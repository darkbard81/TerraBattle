import { describe, expect, it } from "vitest";

import {
  VIRTUAL_HEIGHT,
  VIRTUAL_RESOLUTION,
  VIRTUAL_WIDTH,
} from "./display.js";

describe("display constants", () => {
  it("가상 해상도 너비는 1080이다", () => {
    expect(VIRTUAL_WIDTH).toBe(1080);
  });

  it("가상 해상도 높이는 1920이다", () => {
    expect(VIRTUAL_HEIGHT).toBe(1920);
  });

  it("VIRTUAL_RESOLUTION은 width/height 상수와 동기화되어 있다", () => {
    expect(VIRTUAL_RESOLUTION).toEqual({
      width: VIRTUAL_WIDTH,
      height: VIRTUAL_HEIGHT,
    });
  });
});
