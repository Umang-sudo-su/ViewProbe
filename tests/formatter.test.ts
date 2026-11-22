import { describe, it, expect } from "vitest";
import { formatForAgent, formatAsMarkdown, formatAsOneLiner } from "../src/formatter.js";
import type { ProbeResult } from "../src/types.js";

function makeResult(overrides: Partial<ProbeResult> = {}): ProbeResult {
  return {
    url: "http://localhost:3000",
    timestamp: "2024-01-15T10:30:00Z",
    duration: 450,
    viewportsChecked: [{ name: "mobile", width: 375, height: 812 }],
    violations: [],
    passed: true,
    summary: "All clean — no layout issues found across 1 viewport.",
    ...overrides,
  };
}

describe("formatForAgent", () => {
  it("returns valid JSON with PASS status for clean results", () => {
    const output = formatForAgent(makeResult());
    const parsed = JSON.parse(output);

    expect(parsed.status).toBe("PASS");
    expect(parsed.violations).toHaveLength(0);
    expect(parsed.url).toBe("http://localhost:3000");
  });

  it("returns FAIL status when violations exist", () => {
    const result = makeResult({
      passed: false,
      violations: [
        {
          type: "HORIZONTAL_OVERFLOW",
          severity: "error",
          viewport: { name: "mobile", width: 375, height: 812 },
          message: "Element overflows by 24px",
          selector: "div.card > button",
          bounds: { x: 0, y: 100, width: 399, height: 48 },
          culpritStyles: [
            { property: "min-width", value: "400px", selector: "div.card > button" },
          ],
        },
      ],
    });

    const parsed = JSON.parse(formatForAgent(result));
    expect(parsed.status).toBe("FAIL");
    expect(parsed.violations).toHaveLength(1);
    expect(parsed.violations[0].culpritStyles).toContain("min-width: 400px");
  });
});

describe("formatAsMarkdown", () => {
  it("includes checkmark for passing results", () => {
    const md = formatAsMarkdown(makeResult());
    expect(md).toContain("✅");
    expect(md).toContain("Ship it");
  });

  it("includes failure icon for failing results", () => {
    const md = formatAsMarkdown(
      makeResult({
        passed: false,
        violations: [
          {
            type: "TEXT_TRUNCATION",
            severity: "warning",
            viewport: { name: "mobile", width: 375, height: 812 },
            message: "Text clipped without ellipsis",
            selector: "p.subtitle",
            bounds: { x: 10, y: 200, width: 355, height: 20 },
            culpritStyles: [],
          },
        ],
      })
    );
    expect(md).toContain("❌");
    expect(md).toContain("TEXT_TRUNCATION");
  });
});

describe("formatAsOneLiner", () => {
  it("starts with PASS for clean results", () => {
    expect(formatAsOneLiner(makeResult())).toMatch(/^PASS:/);
  });

  it("starts with FAIL for broken results", () => {
    const result = makeResult({
      passed: false,
      violations: [
        {
          type: "HORIZONTAL_OVERFLOW",
          severity: "error",
          viewport: { name: "desktop", width: 1280, height: 900 },
          message: "Body wider than viewport",
          selector: "body",
          bounds: { x: 0, y: 0, width: 1400, height: 900 },
          culpritStyles: [],
        },
      ],
    });
    expect(formatAsOneLiner(result)).toMatch(/^FAIL:/);
  });
});
