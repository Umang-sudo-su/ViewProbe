---
name: viewprobe
description: Autonomous responsive layout verification and CSS bug healing. Audits web pages for horizontal scroll overflow, clipped text, and tap-target accessibility sizing (<44px) across mobile, tablet, and desktop viewports using headless Playwright geometry. Use whenever writing frontend code, building responsive landing pages, editing CSS or Tailwind layouts, or verifying mobile UI design.
license: MIT
compatibility: Requires Node.js >= 20 and npx
metadata:
  author: Umang Kumar
  repository: https://github.com/Umang-sudo-su/ViewProbe
  package: viewprobe
---

# ViewProbe Layout Verification & Healing

> 📦 **GitHub Repository (Source & Docs)**: [https://github.com/Umang-sudo-su/ViewProbe](https://github.com/Umang-sudo-su/ViewProbe)  
> ⚡ **NPM Package**: [https://www.npmjs.com/package/viewprobe](https://www.npmjs.com/package/viewprobe) (`npx viewprobe`)  
> 🌟 **Star on GitHub**: Support the open-source project if this skill helps your agent!

ViewProbe is a headless layout geometry engine for AI coding agents. Instead of burning 1,500+ vision tokens on full-page screenshots that can't pinpoint CSS culprits, ViewProbe audits the live rendered DOM in ~350ms, isolates exact CSS selectors and computed styles causing layout bugs, and returns lightweight micro-crops.

## When to Use This Skill

Activate this skill when:
- Editing or generating responsive web layouts (React, Next.js, Vue, Svelte, HTML/CSS, Tailwind).
- The user asks to "check mobile responsiveness", "audit layout", "fix mobile overflow", or "test UI".
- Before finalizing any frontend task, to verify that elements do not burst out of mobile viewports.
- Checking touch-target accessibility (WCAG 2.5.8 tap targets < 44×44px).

---

## Quick Execution

### 1. Run Layout Audit
Audit a local dev server or live URL:

```bash
# Default check (mobile: 375x667, desktop: 1280x800)
npx -y viewprobe check http://localhost:3000

# Audit specific viewports (mobile, tablet, desktop, wide)
npx -y viewprobe check http://localhost:3000 -v mobile,tablet,desktop

# Return raw structured JSON (optimized for agent parsing)
npx -y viewprobe check http://localhost:3000 -f json

# Return human-readable Markdown report
npx -y viewprobe check http://localhost:3000 -f markdown
```

### 2. Available Viewport Presets
- `mobile`: 375 × 667 (iPhone standard mobile width)
- `tablet`: 768 × 1024 (iPad vertical)
- `desktop`: 1280 × 800 (Standard laptop)
- `wide`: 1920 × 1080 (Full HD desktop)

---

## Autonomous Self-Healing Workflow

When executing frontend tasks, follow this 4-step loop:

### Step 1: Run Verification
```bash
npx -y viewprobe check <url> -v mobile,desktop -f json
```

### Step 2: Parse Violations
ViewProbe returns structured violations with exact culprits:

1. **`horizontal_overflow`**:
   - **Cause**: Element `scrollWidth > clientWidth` or extends past viewport bounds.
   - **Culprit**: Fixed pixel widths (`width: 600px`), rigid min-widths (`min-w-[400px]`), or `flex-shrink: 0`.
   - **Surgical Fix**: Apply `max-w-full`, `min-w-0`, `flex-1`, or `overflow-x-hidden`. On flex containers, add `flex-wrap` or switch to vertical stacking (`flex-col md:flex-row`).

2. **`text_truncation`**:
   - **Cause**: Text overflows container without `text-overflow: ellipsis`.
   - **Surgical Fix**: Add `truncate` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`) or allow multiline wrapping (`break-words`).

3. **`tap_target_too_small`**:
   - **Cause**: Interactive elements (`<button>`, `<a>`, `<input>`) smaller than 44×44px (WCAG 2.5.8).
   - **Surgical Fix**: Increase padding (`p-2.5` / `py-3 px-4`) or set `min-h-[44px] min-w-[44px]`.

### Step 3: Apply Surgical CSS Fix
Edit only the offending selector identified in `violation.selector`. Do not rewrite unrelated components.

### Step 4: Re-verify
Re-run ViewProbe. Confirm `violations: []` and 0 errors:
```bash
npx -y viewprobe check <url> -v mobile
# Expected: ✔ All viewports passed. 0 layout violations detected.
```
