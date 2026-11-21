import { ApiError, createHttpClient } from "../http";

function res(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new Error("no body");
      return body;
    },
  } as Response;
}

function client(fetchImpl: jest.Mock, extra: object = {}) {
  return createHttpClient({ baseUrl: "https://api.example.test/", getToken: async () => "tok-123", fetchImpl: fetchImpl as unknown as typeof fetch, ...extra });
}

describe("http client", () => {
  it("joins the base URL, sends JSON and the bearer token", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(200, { ok: true }));
    const out = await client(fetchImpl).request("POST", "/plans", { a: 1 });
    expect(out).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/plans");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer tok-123");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it("does not send a token when auth is off (sign-in calls)", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(200, {}));
    await client(fetchImpl).request("POST", "/auth/verify", { x: 1 }, { auth: false });
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toBeUndefined();
  });

  it("returns undefined for 204", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(204));
    expect(await client(fetchImpl).request("DELETE", "/me")).toBeUndefined();
  });

  it("maps a lost connection to offline and reports it", async () => {
    const onReachable = jest.fn();
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError("Network request failed"));
    await expect(client(fetchImpl, { onReachable }).request("GET", "/x")).rejects.toMatchObject({ kind: "offline" });
    expect(onReachable).toHaveBeenCalledWith(false);
  });

  it("times out and maps it to timeout", async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
        }),
    );
    const promise = client(fetchImpl as unknown as jest.Mock).request("GET", "/slow", undefined, { timeoutMs: 30_000 });
    const assertion = expect(promise).rejects.toMatchObject({ kind: "timeout" });
    await jest.advanceTimersByTimeAsync(30_001);
    await assertion;
    jest.useRealTimers();
  });

  it("maps 401 to unauthorized and calls the handler when a token was sent", async () => {
    const onUnauthorized = jest.fn();
    const fetchImpl = jest.fn().mockResolvedValue(res(401, { error: { code: "unauthorized", message: "Please sign in again." } }));
    await expect(client(fetchImpl, { onUnauthorized }).request("GET", "/plans/current")).rejects.toMatchObject({ kind: "unauthorized", status: 401, code: "unauthorized" });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not treat a 401 without a token as an expired session", async () => {
    const onUnauthorized = jest.fn();
    const fetchImpl = jest.fn().mockResolvedValue(res(401, {}));
    const http = createHttpClient({ baseUrl: "https://x.test", getToken: async () => null, onUnauthorized, fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(http.request("GET", "/x")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("keeps only the error code from server errors, never the message", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(400, { error: { code: "invalid_survey", message: "contains secret words" } }));
    const error = await client(fetchImpl).request("POST", "/plans", {}).catch((e: ApiError) => e);
    expect(error).toMatchObject({ kind: "client", status: 400, code: "invalid_survey" });
    expect(JSON.stringify(error)).not.toContain("secret words");
    expect((error as ApiError).message).toBe("client");
  });

  it("maps 5xx to server and a bad success body to server", async () => {
    await expect(client(jest.fn().mockResolvedValue(res(503, {}))).request("GET", "/x")).rejects.toMatchObject({ kind: "server" });
    await expect(client(jest.fn().mockResolvedValue(res(200))).request("GET", "/x")).rejects.toMatchObject({ kind: "server" });
  });
});
