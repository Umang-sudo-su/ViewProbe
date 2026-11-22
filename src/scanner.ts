/**
 * Browser-side scanning logic. Runs inside page context via page.evaluate().
 * Walks the visible DOM and checks geometric properties for layout problems.
 */

export interface RawViolation {
  type: string;
  severity: "error" | "warning";
  message: string;
  selector: string;
  bounds: { x: number; y: number; width: number; height: number };
  styles: { property: string; value: string; selector: string }[];
}

export function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && parts.length < 4) {
    let segment = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${current.id}`);
      break;
    }

    const parent: HTMLElement | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        segment += `:nth-child(${idx})`;
      }
    }

    if (current.className && typeof current.className === "string") {
      const cls = current.className.trim().split(/\s+/)[0];
      if (cls && !cls.includes(":")) {
        segment += `.${cls}`;
      }
    }

    parts.unshift(segment);
    current = parent;
  }

  return parts.join(" > ");
}

function getStyles(
  el: Element,
  props: string[]
): { property: string; value: string; selector: string }[] {
  const computed = window.getComputedStyle(el);
  const sel = buildSelector(el);
  return props.map((p) => ({
    property: p,
    value: computed.getPropertyValue(p),
    selector: sel,
  }));
}

function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (parseFloat(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function scanPage(options: {
  skipSelectors?: string[];
  targetSelectors?: string[];
}): RawViolation[] {
  const violations: RawViolation[] = [];
  const vw = window.innerWidth;

  let elements: Element[];
  if (options.targetSelectors && options.targetSelectors.length > 0) {
    elements = options.targetSelectors.flatMap((sel) =>
      Array.from(document.querySelectorAll(sel))
    );
  } else {
    elements = Array.from(document.querySelectorAll("body *"));
  }

  const skipSet = new Set<Element>();
  if (options.skipSelectors) {
    for (const sel of options.skipSelectors) {
      document.querySelectorAll(sel).forEach((el) => skipSet.add(el));
    }
  }

  for (const el of elements) {
    if (skipSet.has(el)) continue;
    if (!isVisible(el)) continue;

    const rect = el.getBoundingClientRect();
    const bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    // Horizontal overflow within container
    if (el.scrollWidth > el.clientWidth + 2) {
      const computed = window.getComputedStyle(el);
      const overflowX = computed.overflowX;
      const isEllipsis = computed.textOverflow === "ellipsis" && (overflowX === "hidden" || overflowX === "clip");
      if (overflowX !== "auto" && overflowX !== "scroll" && !isEllipsis) {
        violations.push({
          type: "HORIZONTAL_OVERFLOW",
          severity: "error",
          message: `Element overflows its container horizontally by ${el.scrollWidth - el.clientWidth}px`,
          selector: buildSelector(el),
          bounds,
          styles: getStyles(el, [
            "width", "min-width", "max-width",
            "overflow-x", "flex-shrink", "white-space",
          ]),
        });
      }
    }

    // Element extends beyond viewport
    if (rect.right > vw + 1) {
      violations.push({
        type: "HORIZONTAL_OVERFLOW",
        severity: "error",
        message: `Element extends ${Math.round(rect.right - vw)}px beyond viewport edge`,
        selector: buildSelector(el),
        bounds,
        styles: getStyles(el, [
          "width", "min-width", "max-width",
          "margin-right", "padding-right", "position", "right",
        ]),
      });
    }

    // Text truncation without ellipsis
    if (
      el.scrollWidth > el.clientWidth + 2 &&
      el.children.length === 0 &&
      (el.textContent?.trim().length ?? 0) > 0
    ) {
      const computed = window.getComputedStyle(el);
      if (computed.textOverflow !== "ellipsis") {
        violations.push({
          type: "TEXT_TRUNCATION",
          severity: "warning",
          message: `Text is clipped without ellipsis — content overflows by ${el.scrollWidth - el.clientWidth}px`,
          selector: buildSelector(el),
          bounds,
          styles: getStyles(el, [
            "overflow", "text-overflow", "white-space", "max-width", "width",
          ]),
        });
      }
    }

    // Tap target sizing
    const interactive =
      el.tagName === "A" ||
      el.tagName === "BUTTON" ||
      el.tagName === "INPUT" ||
      el.tagName === "SELECT" ||
      el.tagName === "TEXTAREA" ||
      el.getAttribute("role") === "button" ||
      el.getAttribute("tabindex") !== null;

    if (interactive) {
      const MIN_TAP = 44;
      if (rect.width < MIN_TAP || rect.height < MIN_TAP) {
        violations.push({
          type: "TAP_TARGET_TOO_SMALL",
          severity: "warning",
          message: `Interactive element is ${Math.round(rect.width)}x${Math.round(rect.height)}px — minimum recommended is ${MIN_TAP}x${MIN_TAP}px`,
          selector: buildSelector(el),
          bounds,
          styles: getStyles(el, [
            "width", "height", "min-width", "min-height", "padding",
          ]),
        });
      }
    }
  }

  // Body-level horizontal scroll
  if (document.body.scrollWidth > window.innerWidth + 2) {
    violations.push({
      type: "HORIZONTAL_OVERFLOW",
      severity: "error",
      message: `Page has unwanted horizontal scroll — body is ${document.body.scrollWidth - window.innerWidth}px wider than viewport`,
      selector: "body",
      bounds: {
        x: 0, y: 0,
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
      },
      styles: [
        {
          property: "overflow-x",
          value: window.getComputedStyle(document.body).overflowX,
          selector: "body",
        },
        {
          property: "width",
          value: `${document.body.scrollWidth}px (actual) vs ${window.innerWidth}px (viewport)`,
          selector: "body",
        },
      ],
    });
  }

  return violations;
}
