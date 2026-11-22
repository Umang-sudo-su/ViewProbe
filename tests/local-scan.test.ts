import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import { ProbeEngine } from "../src/engine.js";

describe("Local & Raw HTML Scanning", () => {
  let engine: ProbeEngine;

  beforeAll(async () => {
    engine = new ProbeEngine();
    await engine.launch();
  });

  afterAll(async () => {
    await engine.close();
  });

  it("scans raw HTML strings in-memory without a running server", async () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0;">
          <div style="width: 600px; height: 100px; background: red;">Overflow Card</div>
          <button style="width: 20px; height: 20px;">X</button>
        </body>
      </html>
    `;

    const result = await engine.probe({
      html: rawHtml,
      viewports: [{ name: "mobile", width: 375, height: 667 }],
      microCrops: false,
    });

    expect(result.url).toBe("raw:html");
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);

    const overflow = result.violations.find((v) => v.type === "HORIZONTAL_OVERFLOW");
    expect(overflow).toBeDefined();
    expect(overflow?.suggestedFix).toBeDefined();
    expect(overflow?.suggestedFix?.css).toBeDefined();

    const tapTarget = result.violations.find((v) => v.type === "TAP_TARGET_TOO_SMALL");
    expect(tapTarget).toBeDefined();
    expect(tapTarget?.suggestedFix?.tailwind).toContain("min-w-[44px]");
  });

  it("scans a local HTML file path directly", async () => {
    const filePath = path.resolve(__dirname, "fixtures/broken-layout.html");

    const result = await engine.probe({
      url: filePath,
      viewports: [{ name: "mobile", width: 375, height: 667 }],
      microCrops: false,
    });

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].suggestedFix).toBeDefined();
  });
});
