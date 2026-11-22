import type { ProbeResult, LayoutViolation } from "./types.js";

/**
 * Compact JSON optimized for LLM consumption.
 * Strips micro-crops from text output.
 */
export function formatForAgent(result: ProbeResult): string {
  const compact = {
    status: result.passed ? "PASS" : "FAIL",
    url: result.url,
    duration: `${result.duration}ms`,
    summary: result.summary,
    violations: result.violations.map((v) => ({
      type: v.type,
      severity: v.severity,
      viewport: v.viewport.name,
      message: v.message,
      selector: v.selector,
      culpritStyles: v.culpritStyles.map(
        (s) => `${s.property}: ${s.value}`
      ),
    })),
  };

  return JSON.stringify(compact, null, 2);
}

/**
 * Human-readable Markdown report.
 */
export function formatAsMarkdown(result: ProbeResult): string {
  const lines: string[] = [];
  const icon = result.passed ? "\u2705" : "\u274C";

  lines.push(`# ${icon} ViewProbe Report`);
  lines.push("");
  lines.push(`**URL:** ${result.url}`);
  lines.push(`**Scanned:** ${result.timestamp}`);
  lines.push(`**Duration:** ${result.duration}ms`);
  lines.push(
    `**Viewports:** ${result.viewportsChecked.map((v) => v.name).join(", ")}`
  );
  lines.push("");
  lines.push(`## Summary`);
  lines.push(result.summary);
  lines.push("");

  if (result.violations.length === 0) {
    lines.push("No issues detected. Ship it. \uD83D\uDE80");
    return lines.join("\n");
  }

  const errors = result.violations.filter((v) => v.severity === "error");
  const warnings = result.violations.filter((v) => v.severity === "warning");

  if (errors.length > 0) {
    lines.push(`## Errors (${errors.length})`);
    lines.push("");
    errors.forEach((v, i) => formatViolation(v, i + 1, lines));
  }

  if (warnings.length > 0) {
    lines.push(`## Warnings (${warnings.length})`);
    lines.push("");
    warnings.forEach((v, i) => formatViolation(v, i + 1, lines));
  }

  return lines.join("\n");
}

function formatViolation(
  v: LayoutViolation,
  idx: number,
  lines: string[]
): void {
  const badge = v.severity === "error" ? "\uD83D\uDD34" : "\uD83D\uDFE1";
  lines.push(`### ${badge} ${idx}. ${v.type} (${v.viewport.name})`);
  lines.push("");
  lines.push(`> ${v.message}`);
  lines.push("");
  lines.push("**Element:** `" + v.selector + "`");
  lines.push(
    `**Bounding Box:** ${v.bounds.width}\u00D7${v.bounds.height} at (${v.bounds.x}, ${v.bounds.y})`
  );
  lines.push("");

  if (v.culpritStyles.length > 0) {
    lines.push("**Computed Styles:**");
    lines.push("```css");
    v.culpritStyles.forEach((s) => {
      lines.push(`${s.property}: ${s.value};`);
    });
    lines.push("```");
    lines.push("");
  }
}

/**
 * Single-line status for CI environments.
 */
export function formatAsOneLiner(result: ProbeResult): string {
  if (result.passed) {
    return `PASS: ${result.summary}`;
  }
  const errorCount = result.violations.filter(
    (v) => v.severity === "error"
  ).length;
  return `FAIL: ${errorCount} layout error(s) \u2014 ${result.violations[0]?.message ?? "unknown"}`;
}
