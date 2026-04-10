import { describe, expect, it } from "vitest";
import { calculateReferenceScale, createViewportFrame } from "./layout.js";

describe("layout", () => {
  it("keeps the reference scale at 1 for the design resolution", () => {
    expect(
      calculateReferenceScale({
        viewportWidth: 1080,
        viewportHeight: 1920,
        referenceResolution: { width: 1080, height: 1920 },
        minScale: 0.72,
        maxScale: 1.2,
      }),
    ).toBe(1);
  });

  it("clamps oversized screens to the configured maximum scale", () => {
    expect(
      calculateReferenceScale({
        viewportWidth: 2160,
        viewportHeight: 3840,
        referenceResolution: { width: 1080, height: 1920 },
        minScale: 0.72,
        maxScale: 1.2,
      }),
    ).toBe(1.2);
  });

  it("creates centered insets when the viewport is wider than the reference ratio", () => {
    const frame = createViewportFrame(1440, 1920);

    expect(frame.scale).toBe(1);
    expect(frame.horizontalInset).toBe(180);
    expect(frame.verticalInset).toBe(0);
  });
});
