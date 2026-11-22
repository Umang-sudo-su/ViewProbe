<p align="center">
  <img src=".github/assets/viewprobe-icon.jpg" width="100" height="100" style="border-radius: 20px" alt="ViewProbe Logo" />
</p>

<h1 align="center">ViewProbe</h1>

<p align="center">
  <b>Headless layout verification engine & autonomous CSS healing for AI coding agents.</b>
</p>

<p align="center">
  <a href="https://glama.ai/mcp/servers/Umang-sudo-su/ViewProbe"><img src="https://glama.ai/mcp/servers/Umang-sudo-su/ViewProbe/badges/score.svg" alt="Glama Score" /></a>
  <a href="https://www.npmjs.com/package/viewprobe"><img src="https://img.shields.io/npm/v/viewprobe?color=cb3837&logo=npm" alt="npm version" /></a>
  <a href="https://github.com/Umang-sudo-su/ViewProbe/actions/workflows/ci.yml"><img src="https://github.com/Umang-sudo-su/ViewProbe/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://github.com/Umang-sudo-su/ViewProbe/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
</p>

<p align="center">
  <a href="https://github.com/Umang-sudo-su/ViewProbe/raw/main/.github/assets/videos/viewprobe-demo.webm">
    <img src=".github/assets/viewprobe-banner.jpg" width="800" alt="ViewProbe Multi-Viewport Autonomous Layout Verification" />
  </a>
</p>

<p align="center">
  🎬 <b><a href="https://github.com/Umang-sudo-su/ViewProbe/raw/main/.github/assets/videos/viewprobe-demo.webm">Watch the 15-second autonomous self-healing demo (HD WebM)</a></b>
</p>

ViewProbe gives coding agents a fast, deterministic way to catch CSS and layout bugs — horizontal overflow, broken responsive layouts, truncated text, undersized tap targets — without relying on expensive vision models or manual human review.

It runs headless Chromium, performs geometric analysis on the rendered DOM, and returns compact, structured diagnostics that an LLM can parse in a single turn. When something breaks, it tells the agent *exactly which element* and *which CSS properties* caused the problem, along with an optional micro-crop screenshot of just the broken region.

---

## 🚀 1-Click Agent Setup

### Claude Code (CLI)
```bash
claude mcp add viewprobe npx -y viewprobe-mcp
```

### Cursor
Add directly in **Settings (`Cmd + ,`) → Features → MCP → + Add New MCP Server**:
* **Name**: `viewprobe`
* **Type**: `command`
* **Command**: `npx -y viewprobe-mcp`

### Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "viewprobe": {
      "command": "npx",
      "args": ["-y", "viewprobe-mcp"]
    }
  }
}
```

---

## Why

AI coding agents (Cursor, Claude Code, Cline, Aider, etc.) are surprisingly good at writing logic but consistently bad at CSS. They produce layouts that overflow on mobile, text that clips without ellipsis, and buttons too small to tap. The human developer ends up as a visual QA layer, manually checking every UI change.

ViewProbe closes that feedback loop. The agent writes the code, ViewProbe checks the layout across viewports in under a second, and if something breaks, the agent gets back the exact selector and computed styles needed to fix it — no guessing, no print-statement debugging.

## Visual Verification in Action

### Autonomous Self-Healing on Mobile Viewports

When an agent introduces a CSS defect (such as a rigid `min-width` that overflows on mobile, or text clipping without ellipsis), ViewProbe identifies the exact culprit and verifies the fix:

| Before Fix (Broken Layout) | After Fix (Self-Healed) |
| :---: | :---: |
| <img src=".github/assets/before-fix.png" width="340" alt="Mobile layout before fix: card overflows viewport by 23px" /> | <img src=".github/assets/after-fix.png" width="340" alt="Mobile layout after fix: responsive fluid bounds" /> |
| ❌ *Card overflows 375px screen by 23px, text clipped, 22px button* | ✅ *Fluid responsive bounds, clean ellipsis, 44px accessible touch target* |

## How ViewProbe Compares

Most developers currently try to verify agent UI changes using raw browser screenshots, DOM dumps, or visual regression dashboards. Here is why those approaches fail autonomous coding agents:

| Feature / Approach | Full Screenshots (`page.screenshot`) | Raw DOM / HTML Dumps | Visual Regression (Percy / Chromatic) | **ViewProbe** |
| :--- | :---: | :---: | :---: | :---: |
| **Token Cost per Turn** | ~1,500 – 3,000 vision tokens | 20,000+ text tokens | N/A (Web UI only) | **~80 tokens** (micro-crop + JSON) |
| **Identifies CSS Culprit** | ❌ No (Agent must guess) | ❌ No (Markup only) | ❌ No (Pixel diff only) | ✅ **Yes** (Exact computed style & selector) |
| **Deterministic Math** | ❌ No (Probabilistic vision) | ❌ No (No geometry data) | ⚠️ Partial (Pixel threshold) | ✅ **Yes** (DOM geometry & viewport math) |
| **Autonomous Agent Loop** | ⚠️ High latency & cost | ❌ Context window blowup | ❌ Human review required | ✅ **Native MCP & CLI tool-calling** |
| **Execution Environment** | ✅ Local | ✅ Local | ❌ Paid Cloud / SaaS | ✅ **100% Local & Free** |

### Why Existing Approaches Fall Short:

* **vs. Raw Full Screenshots (`page.screenshot()`)**: Full-screen vision prompts burn 1,500+ tokens per viewport turn. Furthermore, vision models are probabilistic—they frequently hallucinate alignment, miss 15px mobile overflows, and cannot tell the agent *which* CSS rule (`min-width: 420px;`) caused the problem.
* **vs. Raw DOM / Accessibility Tree Dumps**: Dumping 50,000 characters of HTML into an LLM context wastes tokens on unchanged markup and completely ignores the rendered layout, CSS cascade, media queries, and flexbox wrapping.
* **vs. Traditional Visual Regression (Percy, Chromatic)**: Designed for human reviewers to click "Approve / Reject" on pixel diffs in a web dashboard. They don't output machine-readable remediation diagnostics for LLM tool-calling.
* **vs. Accessibility Linters (axe-core, Lighthouse)**: A11y linters check semantic HTML, ARIA roles, and contrast, but are completely blind to responsive layout breakage, clipped text, and broken flex containers.

## Quick Start

```bash
# install
npm install -g viewprobe

# scan a running page across mobile and desktop
viewprobe check http://localhost:3000

# scan specific viewports
viewprobe check http://localhost:3000 -v mobile,tablet,desktop

# get markdown report instead of JSON
viewprobe check http://localhost:3000 -f markdown

# focus on specific elements
viewprobe check http://localhost:3000 -s ".hero,.pricing-grid"
```

## What It Catches

| Check | Severity | Description |
|-------|----------|-------------|
| **Horizontal Overflow** | error | Elements wider than their container or the viewport, causing unwanted horizontal scroll |
| **Text Truncation** | warning | Text content clipped without `text-overflow: ellipsis` |
| **Tap Target Sizing** | warning | Interactive elements smaller than 44×44px (WCAG 2.5.8) |
| **Body Scroll** | error | Page-level horizontal scroll caused by elements breaking out of the viewport |

## Output Formats

### Agent format (default)

Compact JSON designed for LLM consumption:

```json
{
  "status": "FAIL",
  "url": "http://localhost:3000",
  "duration": "340ms",
  "summary": "Found 1 error and 1 warning across 2 viewports.",
  "violations": [
    {
      "type": "HORIZONTAL_OVERFLOW",
      "severity": "error",
      "viewport": "mobile",
      "message": "Element extends 24px beyond viewport edge",
      "selector": "div.pricing-grid > div:nth-child(2) > button",
      "culpritStyles": [
        "min-width: 400px",
        "flex-shrink: 0"
      ]
    }
  ]
}
```

### Markdown format

Human-readable report with severity badges, bounding box data, and computed style blocks. Good for PR comments or documentation.

### One-liner format

Single line for CI pipelines: `FAIL: 1 layout error(s) — Element extends 24px beyond viewport edge`

## MCP Server

ViewProbe ships as an MCP server so any MCP-compatible agent can use it as a tool:

```json
{
  "mcpServers": {
    "viewprobe": {
      "command": "npx",
      "args": ["-y", "viewprobe-mcp"]
    }
  }
}
```

Or when running from a local clone:
```json
{
  "mcpServers": {
    "viewprobe": {
      "command": "node",
      "args": ["/absolute/path/to/ViewProbe/dist/mcp-server.js"]
    }
  }
}
```

### Tools

**`viewprobe_check`** — Scan a URL for layout violations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | yes | URL to scan |
| `viewports` | string | no | Comma-separated: mobile, tablet, desktop, wide |
| `selectors` | string | no | CSS selectors to focus on |
| `skipSelectors` | string | no | CSS selectors to skip |
| `microCrops` | boolean | no | Attach cropped violation screenshots (default: true) |

**`viewprobe_viewports`** — List available viewport presets with dimensions.

## Micro-Crops (~80 tokens vs ~1,500 tokens)

Instead of sending a full-page screenshot (1,500+ vision tokens), ViewProbe computes the exact screen-space bounding box of the violation, highlights it with a red debug border, and crops only that region (~80 tokens):

<p align="center">
  <img src=".github/assets/micro-crop-overflow.jpg" width="460" alt="ViewProbe Micro-Crop with Red Highlight Box" />
</p>

You can disable micro-crops with `--no-crops` or `microCrops: false` in the MCP call.

## Programmatic API

```typescript
import { ProbeEngine, formatForAgent } from "viewprobe";

const engine = new ProbeEngine();
const result = await engine.probe({
  url: "http://localhost:3000",
  viewports: [
    { name: "mobile", width: 375, height: 812 },
    { name: "desktop", width: 1280, height: 900 },
  ],
});

console.log(formatForAgent(result));
await engine.close();
```

## Development

```bash
git clone https://github.com/Umang-sudo-su/ViewProbe.git
cd ViewProbe
npm install
npm run build
npm test
```

## License

MIT
