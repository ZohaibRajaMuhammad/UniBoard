import { describe, expect, it } from "vitest";
import { formatDeadline, initials, truncate } from "./utils";

describe("utils", () => {
  it("truncates long text", () => {
    expect(truncate("abcdefghij", 6)).toBe("abcde…");
  });

  it("keeps short text unchanged", () => {
    expect(truncate("abc", 6)).toBe("abc");
  });

  it("builds initials from two words", () => {
    expect(initials("Uni Board")).toBe("UB");
  });

  it("formats missing deadlines safely", () => {
    expect(formatDeadline(undefined)).toBe("No deadline");
  });
});
