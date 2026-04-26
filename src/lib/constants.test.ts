import { describe, expect, it } from "vitest";
import { BATCHES, POST_TYPES, ROOM_COLORS, ROOM_EMOJIS } from "./constants";

describe("constants", () => {
  it("defines supported post types", () => {
    expect(POST_TYPES).toContain("announcement");
    expect(POST_TYPES).toContain("deadline");
  });

  it("keeps room color and emoji presets populated", () => {
    expect(ROOM_COLORS.length).toBeGreaterThan(3);
    expect(ROOM_EMOJIS.length).toBeGreaterThan(3);
    expect(BATCHES.length).toBeGreaterThan(0);
  });
});
