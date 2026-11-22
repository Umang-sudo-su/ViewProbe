import type { Page } from "playwright";
import type { BoundingBox } from "./types.js";

interface CropOptions {
  padding: number;
  quality: number;
}

/**
 * Captures a small region around a violation bounding box and returns
 * a base64-encoded JPEG. Uses Playwright's native clipping for fast,
 * dependency-free cropping.
 */
export async function cropViolation(
  page: Page,
  bounds: BoundingBox,
  options: CropOptions
): Promise<string> {
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("Page has no viewport set");
  }

  const pad = options.padding;

  const clip = {
    x: Math.max(0, bounds.x - pad),
    y: Math.max(0, bounds.y - pad),
    width: Math.min(
      bounds.width + pad * 2,
      viewport.width - Math.max(0, bounds.x - pad)
    ),
    height: Math.min(
      bounds.height + pad * 2,
      viewport.height - Math.max(0, bounds.y - pad)
    ),
  };

  clip.width = Math.max(clip.width, 48);
  clip.height = Math.max(clip.height, 48);

  const buffer = await page.screenshot({
    clip,
    type: "jpeg",
    quality: options.quality,
  });

  return buffer.toString("base64");
}

/**
 * Draws a red debug outline around a violation on the page.
 */
export async function highlightViolation(
  page: Page,
  selector: string
): Promise<void> {
  await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return;

    const overlay = document.createElement("div");
    const rect = el.getBoundingClientRect();

    Object.assign(overlay.style, {
      position: "fixed",
      top: `${rect.y}px`,
      left: `${rect.x}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      border: "3px solid #ff2d55",
      borderRadius: "2px",
      pointerEvents: "none",
      zIndex: "999999",
      boxShadow: "0 0 8px rgba(255, 45, 85, 0.5)",
    });

    overlay.setAttribute("data-viewprobe-highlight", "true");
    document.body.appendChild(overlay);
  }, selector);
}
