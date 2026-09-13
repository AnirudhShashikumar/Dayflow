import { describe, expect, it } from "vitest";
import { safeCallbackPath } from "./callback-path";

describe("callback destination", () => {
  it.each([null, "https://evil.example", "//evil.example", "/\\evil.example", "/%5cevil.example", "/%2fevil.example", "javascript:alert(1)", "/home\nX-Test: bad"])("rejects unsafe destination %s", (value) => {
    expect(safeCallbackPath(value)).toBe("/home");
  });
  it("keeps local destinations", () => {
    expect(safeCallbackPath("/reset-password?source=email")).toBe("/reset-password?source=email");
  });
});
