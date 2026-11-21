import { API_URL, REQUEST_TIMEOUT_MS } from "./config";

export type ApiErrorKind = "offline" | "timeout" | "unauthorized" | "server" | "client";

/** Every failure the app can see, with a short kind and the server's error code when there is one. */
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    public readonly status = 0,
    public readonly code: string | null = null,
  ) {
    super(kind);
    this.name = "ApiError";
  }
}

export type HttpOptions = {
  baseUrl?: string;
  getToken: () => Promise<string | null>;
  /** Called on any 401 from a request that sent a token. */
  onUnauthorized?: () => void;
  /** Called after every request with whether the network answered. */
  onReachable?: (reachable: boolean) => void;
  fetchImpl?: typeof fetch;
};

export type RequestOptions = { timeoutMs?: number; auth?: boolean };

export type HttpClient = {
  request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T>;
};

/** Reads the server's {error:{code}} body without ever keeping the message text. */
async function readCode(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { error?: { code?: unknown } };
    return typeof data.error?.code === "string" ? data.error.code : null;
  } catch {
    return null;
  }
}

export function createHttpClient(options: HttpOptions): HttpClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrl ?? API_URL).replace(/\/+$/, "");

  return {
    async request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
      const token = opts.auth === false ? null : await options.getToken();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          method,
          headers: {
            accept: "application/json",
            ...(body === undefined ? {} : { "content-type": "application/json" }),
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        const aborted = controller.signal.aborted || (error as { name?: string })?.name === "AbortError";
        options.onReachable?.(false);
        throw new ApiError(aborted ? "timeout" : "offline");
      } finally {
        clearTimeout(timer);
      }
      options.onReachable?.(true);

      if (response.status === 204) {
        return undefined as T;
      }
      if (!response.ok) {
        const code = await readCode(response);
        if (response.status === 401 && token) {
          options.onUnauthorized?.();
          throw new ApiError("unauthorized", 401, code);
        }
        throw new ApiError(response.status >= 500 ? "server" : response.status === 401 ? "unauthorized" : "client", response.status, code);
      }
      try {
        return (await response.json()) as T;
      } catch {
        throw new ApiError("server", response.status);
      }
    },
  };
}
