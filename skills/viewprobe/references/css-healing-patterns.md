# Responsive CSS & Tailwind Healing Recipes

Common layout failure patterns detected by ViewProbe and their battle-tested fixes.

---

## 1. Flexbox Horizontal Overflow
**Problem**: Children inside a flex row refuse to shrink on mobile, pushing the parent beyond 375px.
```html
<!-- BROKEN -->
<div class="flex gap-4">
  <div class="min-w-[300px]">Card 1</div>
  <div class="min-w-[300px]">Card 2</div>
</div>
```
**Fix**: Switch to column on mobile or allow flex wrapping with `min-w-0`:
```html
<!-- HEALED -->
<div class="flex flex-col sm:flex-row gap-4">
  <div class="min-w-0 flex-1">Card 1</div>
  <div class="min-w-0 flex-1">Card 2</div>
</div>
```

---

## 2. Table / Data Grid Mobile Cutoff
**Problem**: Wide tabular data bursting past screen boundaries.
```html
<!-- BROKEN -->
<table class="w-full">...</table>
```
**Fix**: Wrap the table in an auto-scrolling container:
```html
<!-- HEALED -->
<div class="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <table class="w-full min-w-[500px]">...</table>
</div>
```

---

## 3. Unpadded Icon Buttons (WCAG 2.5.8 Failure)
**Problem**: An icon button is rendered at 24×24px, making it difficult to tap on touchscreen devices.
```html
<!-- BROKEN: 24x24px tap area -->
<button class="w-6 h-6"><svg>...</svg></button>
```
**Fix**: Expand the clickable area to at least 44×44px while keeping the icon visual size identical:
```html
<!-- HEALED: 44x44px target with centered 24px icon -->
<button class="w-11 h-11 flex items-center justify-center -m-2.5">
  <svg class="w-6 h-6">...</svg>
</button>
```

---

## 4. Fixed Pixel Images & Canvas Elements
**Problem**: `<img>` or `<canvas>` with fixed width attributes breaking container bounds.
```html
<!-- BROKEN -->
<img src="chart.png" width="600" />
```
**Fix**: Apply responsive max-width rules:
```html
<!-- HEALED -->
<img src="chart.png" class="max-w-full h-auto object-contain" />
```
