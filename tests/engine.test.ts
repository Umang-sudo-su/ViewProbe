import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ProbeEngine } from "../src/engine.js";

describe("ProbeEngine integration", () => {
  let engine: ProbeEngine;

  beforeAll(async () => {
    engine = new ProbeEngine();
    await engine.launch();
  });

  afterAll(async () => {
    await engine.close();
  });

  it("detects layout violations on broken fixture", async () => {
    const fixturePath = resolve(__dirname, "fixtures/broken-layout.html");
    const fixtureUrl = pathToFileURL(fixturePath).toString();

    const result = await engine.probe({
      url: fixtureUrl,
      viewports: [{ name: "mobile", width: 375, height: 812 }],
      microCrops: false,
    });

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);

    const overflowViolation = result.violations.find(
      (v) => v.type === "HORIZONTAL_OVERFLOW"
    );
    expect(overflowViolation).toBeDefined();

    const tapViolation = result.violations.find(
      (v) => v.type === "TAP_TARGET_TOO_SMALL"
    );
    expect(tapViolation).toBeDefined();
  });

  it("passes cleanly on responsive fixture", async () => {
    const fixturePath = resolve(__dirname, "fixtures/clean-layout.html");
    const fixtureUrl = pathToFileURL(fixturePath).toString();

    const result = await engine.probe({
      url: fixtureUrl,
      viewports: [
        { name: "mobile", width: 375, height: 812 },
        { name: "desktop", width: 1280, height: 900 },
      ],
      microCrops: false,
    });

    expect(result.passed).toBe(true);
    expect(result.violations.filter((v) => v.severity === "error")).toHaveLength(0);
  });
});
