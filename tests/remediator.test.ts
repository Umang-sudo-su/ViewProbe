import { describe, it, expect } from "vitest";
import { generateSuggestedFix } from "../src/remediator.js";

describe("generateSuggestedFix", () => {
  it("suggests min-width relaxation for rigid horizontal overflow", () => {
    const fix = generateSuggestedFix({
      type: "HORIZONTAL_OVERFLOW",
      selector: "div.pricing-card",
      bounds: { x: 0, y: 0, width: 520, height: 200 },
      message: "Element overflows by 145px",
      culpritStyles: [
        { property: "min-width", value: "520px", selector: "div.pricing-card" },
        { property: "flex-shrink", value: "0", selector: "div.pricing-card" },
      ],
    });

    expect(fix.css).toContain("max-width: 100%");
    expect(fix.css).toContain("min-width: 0");
    expect(fix.tailwind).toBe("max-w-full min-w-0 shrink");
    expect(fix.explanation).toContain("min-width");
  });

  it("suggests responsive fluid width for fixed pixel width overflow", () => {
    const fix = generateSuggestedFix({
      type: "HORIZONTAL_OVERFLOW",
      selector: "div.banner",
      bounds: { x: 0, y: 0, width: 600, height: 100 },
      message: "Element extends 225px beyond viewport",
      culpritStyles: [
        { property: "width", value: "600px", selector: "div.banner" },
      ],
    });

    expect(fix.css).toContain("max-width: 100%");
    expect(fix.css).toContain("width: auto");
    expect(fix.tailwind).toBe("max-w-full w-auto");
  });

  it("suggests ellipsis truncation for clipped text", () => {
    const fix = generateSuggestedFix({
      type: "TEXT_TRUNCATION",
      selector: "h1.title",
      bounds: { x: 0, y: 0, width: 300, height: 40 },
      message: "Text is clipped without ellipsis",
      culpritStyles: [
        { property: "white-space", value: "nowrap", selector: "h1.title" },
      ],
    });

    expect(fix.css).toContain("text-overflow: ellipsis");
    expect(fix.tailwind).toBe("truncate");
  });

  it("suggests minimum 44x44px touch area for small interactive elements", () => {
    const fix = generateSuggestedFix({
      type: "TAP_TARGET_TOO_SMALL",
      selector: "button.icon-btn",
      bounds: { x: 0, y: 0, width: 24, height: 24 },
      message: "Interactive element is 24x24px",
      culpritStyles: [
        { property: "width", value: "24px", selector: "button.icon-btn" },
        { property: "height", value: "24px", selector: "button.icon-btn" },
      ],
    });

    expect(fix.css).toContain("min-width: 44px");
    expect(fix.css).toContain("min-height: 44px");
    expect(fix.tailwind).toContain("min-w-[44px] min-h-[44px]");
    expect(fix.explanation).toContain("WCAG 2.5.8");
  });

  it("suggests root overflow clipping for body horizontal scroll", () => {
    const fix = generateSuggestedFix({
      type: "HORIZONTAL_OVERFLOW",
      selector: "body",
      bounds: { x: 0, y: 0, width: 500, height: 1000 },
      message: "Body is wider than viewport",
      culpritStyles: [
        { property: "overflow-x", value: "visible", selector: "body" },
      ],
    });

    expect(fix.css).toContain("overflow-x: hidden");
    expect(fix.tailwind).toBe("overflow-x-hidden max-w-full");
  });
});
