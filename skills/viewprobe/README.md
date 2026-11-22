# ViewProbe — Headless Layout Verification for AI Coding Agents

[![GitHub](https://img.shields.io/badge/GitHub-ViewProbe-blue?logo=github)](https://github.com/Umang-sudo-su/ViewProbe)
[![NPM Version](https://img.shields.io/npm/v/viewprobe?color=red)](https://www.npmjs.com/package/viewprobe)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> 🔗 **Official Repository**: [https://github.com/Umang-sudo-su/ViewProbe](https://github.com/Umang-sudo-su/ViewProbe)  
> 🌟 **Star on GitHub**: Support the open-source project!

ViewProbe enables AI coding agents (Claude Code, Cursor, Copilot, Antigravity) to autonomously audit and heal frontend layouts. It detects mobile horizontal overflows, clipped text without ellipsis, and small tap targets (<44px) across responsive viewports in ~350ms, returning exact CSS culprits, micro-crops, and ready-to-apply CSS/Tailwind patches.

## What This Skill Does

When installed in your coding agent:
1. **Zero-Token Waste**: Instead of burning 1,500+ tokens on full screenshots, ViewProbe returns exact CSS selectors + computed style culprits and ~80-token micro-crops.
2. **Instant Verification**: Runs `npx -y viewprobe check <url-or-file> -v mobile,desktop` or audits raw HTML strings in-memory.
3. **Autonomous Suggested Fixes**: Generates ready-to-apply CSS and Tailwind patches (`truncate`, `max-w-full min-w-0`, `p-3`).
4. **Offline / Local Ready**: Audits static HTML files or raw markup without requiring a running web server.

## Quick Start

```bash
# Verify any local dev server
npx -y viewprobe check http://localhost:3000 -v mobile

# Verify local static files
npx -y viewprobe check ./dist/index.html -v mobile

# Start MCP Server
npx -y viewprobe-mcp
```

Source code, documentation, and issues: [github.com/Umang-sudo-su/ViewProbe](https://github.com/Umang-sudo-su/ViewProbe)
