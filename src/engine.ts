import { chromium, type Browser, type Page } from "playwright";
import { type RawViolation } from "./scanner.js";
import { cropViolation, highlightViolation } from "./cropper.js";
import {
  type ProbeConfig,
  type ProbeResult,
  type LayoutViolation,
  type Viewport,
  DEFAULT_VIEWPORTS,
  DEFAULT_CONFIG,
} from "./types.js";
import { getScannerSource } from "./injector.js";

export class ProbeEngine {
  private browser: Browser | null = null;

  async launch(): Promise<void> {
    try {
      this.browser = await chromium.launch({ headless: true });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "";
      if (
        msg.includes("Executable doesn't exist") ||
        msg.includes("looks like Playwright was just installed")
      ) {
        try {
          this.browser = await chromium.launch({
            channel: "chrome",
            headless: true,
          });
          return;
        } catch {
          throw new Error(
            "Chromium browser not found. Please install Playwright browsers with:\n  npx playwright install chromium"
          );
        }
      }
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async probe(config: ProbeConfig): Promise<ProbeResult> {
    if (!this.browser) {
      await this.launch();
    }

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const viewports = mergedConfig.viewports ?? DEFAULT_VIEWPORTS;
    const allViolations: LayoutViolation[] = [];
    const startTime = Date.now();

    for (const viewport of viewports) {
      const violations = await this.scanViewport(mergedConfig, viewport);
      allViolations.push(...violations);
    }

    const duration = Date.now() - startTime;
    const deduped = this.deduplicateViolations(allViolations);

    const passed = deduped.filter((v) => v.severity === "error").length === 0;
    const errorCount = deduped.filter((v) => v.severity === "error").length;
    const warnCount = deduped.filter((v) => v.severity === "warning").length;

    let summary: string;
    if (passed && warnCount === 0) {
      summary = `All clean \u2014 no layout issues found across ${viewports.length} viewport${viewports.length > 1 ? "s" : ""}.`;
    } else if (passed) {
      summary = `Passed with ${warnCount} warning${warnCount > 1 ? "s" : ""}. No blocking layout errors.`;
    } else {
      summary = `Found ${errorCount} error${errorCount > 1 ? "s" : ""} and ${warnCount} warning${warnCount > 1 ? "s" : ""} across ${viewports.length} viewport${viewports.length > 1 ? "s" : ""}.`;
    }

    return {
      url: config.url,
      timestamp: new Date().toISOString(),
      duration,
      viewportsChecked: viewports,
      violations: deduped,
      passed,
      summary,
    };
  }

  private async scanViewport(
    config: ProbeConfig & typeof DEFAULT_CONFIG,
    viewport: Viewport
  ): Promise<LayoutViolation[]> {
    const page = await this.browser!.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    try {
      // Inject the scanner function before navigation
      const scannerSrc = getScannerSource();
      await page.addInitScript({ content: scannerSrc });

      await page.goto(config.url!, {
        waitUntil: "networkidle",
        timeout: config.timeout,
      });

      if (config.waitForSelector) {
        await page.waitForSelector(config.waitForSelector, {
          timeout: config.timeout,
        });
      }

      const rawViolations: RawViolation[] = await page.evaluate(
        (opts: { skipSelectors?: string[]; targetSelectors?: string[] }) => {
          return (window as any).__viewprobe_scan(opts);
        },
        {
          skipSelectors: config.skipSelectors,
          targetSelectors: config.selectors,
        }
      );

      const violations: LayoutViolation[] = [];

      for (const raw of rawViolations) {
        const violation: LayoutViolation = {
          type: raw.type as LayoutViolation["type"],
          severity: raw.severity,
          viewport,
          message: raw.message,
          selector: raw.selector,
          bounds: raw.bounds,
          culpritStyles: raw.styles,
        };

        if (config.microCrops) {
          try {
            await highlightViolation(page, raw.selector);
            violation.microCrop = await cropViolation(page, raw.bounds, {
              padding: config.cropPadding ?? 20,
              quality: config.cropQuality ?? 60,
            });
          } catch {
            // cropping is best-effort
          }
        }

        violations.push(violation);
      }

      return violations;
    } finally {
      await page.close();
    }
  }

  private deduplicateViolations(
    violations: LayoutViolation[]
  ): LayoutViolation[] {
    const seen = new Set<string>();
    return violations.filter((v) => {
      const key = `${v.type}::${v.selector}::${v.viewport.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
