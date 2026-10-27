import { createMockApi, MAX_CODE_TRIES, MOCK_VALID_CODE } from "../api";

describe("mock api", () => {
  it("accepts the valid code", async () => {
    const api = createMockApi(0);
    await api.requestCode("a@b.co");
    expect(await api.verifyCode("a@b.co", MOCK_VALID_CODE)).toEqual({ status: "ok" });
  });

  it("rejects 000000 and counts down the tries", async () => {
    const api = createMockApi(0);
    expect(await api.verifyCode("a@b.co", "000000")).toEqual({ status: "wrong", triesLeft: MAX_CODE_TRIES - 1 });
    expect(await api.verifyCode("a@b.co", "000000")).toEqual({ status: "wrong", triesLeft: MAX_CODE_TRIES - 2 });
  });

  it("locks after too many tries until a new code is requested", async () => {
    const api = createMockApi(0);
    let last = await api.verifyCode("a@b.co", "000000");
    for (let i = 1; i < MAX_CODE_TRIES; i += 1) {
      last = await api.verifyCode("a@b.co", "000000");
    }
    expect(last).toEqual({ status: "locked" });
    expect(await api.verifyCode("a@b.co", MOCK_VALID_CODE)).toEqual({ status: "locked" });

    await api.requestCode("a@b.co");
    expect(await api.verifyCode("a@b.co", MOCK_VALID_CODE)).toEqual({ status: "ok" });
  });
});
