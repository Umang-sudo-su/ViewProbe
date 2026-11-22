import type { BoundingBox, CulpritStyle, SuggestedFix, ViolationType } from "./types.js";

interface ViolationContext {
  type: ViolationType;
  selector: string;
  bounds: BoundingBox;
  culpritStyles: CulpritStyle[];
  message: string;
}

/**
 * Computes surgical, ready-to-apply CSS and Tailwind CSS patches
 * based on layout violation geometry and computed styles.
 */
export function generateSuggestedFix(violation: ViolationContext): SuggestedFix {
  const stylesMap = new Map<string, string>();
  for (const s of violation.culpritStyles) {
    stylesMap.set(s.property.toLowerCase(), s.value.toLowerCase().trim());
  }

  switch (violation.type) {
    case "HORIZONTAL_OVERFLOW": {
      if (violation.selector === "body") {
        return {
          css: "overflow-x: hidden; max-width: 100vw;",
          tailwind: "overflow-x-hidden max-w-full",
          explanation: "Prevent viewport-level horizontal scrolling by clipping root overflow.",
        };
      }

      const minWidth = stylesMap.get("min-width");
      const width = stylesMap.get("width");
      const flexShrink = stylesMap.get("flex-shrink");

      if (minWidth && minWidth !== "none" && minWidth !== "0px" && minWidth !== "auto") {
        return {
          css: "max-width: 100%; min-width: 0; flex-shrink: 1;",
          tailwind: "max-w-full min-w-0 shrink",
          explanation: "Relax rigid min-width and allow element to shrink within parent container bounds.",
        };
      }

      if (flexShrink === "0") {
        return {
          css: "flex-shrink: 1; min-width: 0;",
          tailwind: "shrink min-w-0",
          explanation: "Allow flex item to shrink below content size on narrow screens.",
        };
      }

      if (width && !width.includes("%") && width !== "auto") {
        return {
          css: "max-width: 100%; width: auto;",
          tailwind: "max-w-full w-auto",
          explanation: "Replace fixed width with fluid responsive max-width.",
        };
      }

      return {
        css: "max-width: 100%; box-sizing: border-box; overflow-wrap: break-word;",
        tailwind: "max-w-full box-border break-words",
        explanation: "Constrain element dimensions to parent container width.",
      };
    }

    case "TEXT_TRUNCATION": {
      return {
        css: "overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
        tailwind: "truncate",
        explanation: "Apply standard single-line ellipsis truncation with hidden overflow.",
      };
    }

    case "TAP_TARGET_TOO_SMALL": {
      const minDimension = 44;
      const currentW = Math.max(0, violation.bounds.width);
      const currentH = Math.max(0, violation.bounds.height);
      const padX = Math.max(0, Math.ceil((minDimension - currentW) / 2));
      const padY = Math.max(0, Math.ceil((minDimension - currentH) / 2));
      const maxPad = Math.max(padX, padY);

      return {
        css: `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: ${padY}px ${padX}px;`,
        tailwind: `min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-[${maxPad}px]`,
        explanation: "Expand touch target area to meet WCAG 2.5.8 minimum 44×44px mobile requirement.",
      };
    }

    default:
      return {
        css: "box-sizing: border-box; max-width: 100%;",
        tailwind: "box-border max-w-full",
        explanation: "Ensure element adheres to box-sizing and responsive constraints.",
      };
  }
}
