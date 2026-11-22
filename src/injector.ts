import { buildSelector, scanPage } from "./scanner.js";

/**
 * Returns the JavaScript source that, when injected via addInitScript,
 * makes window.__viewprobe_scan() available in the browser context.
 *
 * We serialize the scanner functions to strings so they run purely
 * inside the browser, with no Node.js dependencies.
 */
export function getScannerSource(): string {
  // We need self-contained browser code. Build it as a string.
  return `
(function() {
  function buildSelector(el) {
    if (el.id) return "#" + el.id;
    var parts = [];
    var current = el;
    while (current && current !== document.body && parts.length < 4) {
      var segment = current.tagName.toLowerCase();
      if (current.id) { parts.unshift("#" + current.id); break; }
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(c) {
          return c.tagName === current.tagName;
        });
        if (siblings.length > 1) {
          segment += ":nth-child(" + (siblings.indexOf(current) + 1) + ")";
        }
      }
      if (current.className && typeof current.className === "string") {
        var cls = current.className.trim().split(/\\s+/)[0];
        if (cls && cls.indexOf(":") === -1) segment += "." + cls;
      }
      parts.unshift(segment);
      current = parent;
    }
    return parts.join(" > ");
  }

  function getStyles(el, props) {
    var computed = window.getComputedStyle(el);
    var sel = buildSelector(el);
    return props.map(function(p) {
      return { property: p, value: computed.getPropertyValue(p), selector: sel };
    });
  }

  function isVisible(el) {
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (parseFloat(style.opacity) === 0) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  window.__viewprobe_scan = function(options) {
    var violations = [];
    var vw = window.innerWidth;
    var elements;

    if (options.targetSelectors && options.targetSelectors.length > 0) {
      elements = options.targetSelectors.reduce(function(acc, sel) {
        return acc.concat(Array.from(document.querySelectorAll(sel)));
      }, []);
    } else {
      elements = Array.from(document.querySelectorAll("body *"));
    }

    var skipSet = new Set();
    if (options.skipSelectors) {
      options.skipSelectors.forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(el) { skipSet.add(el); });
      });
    }

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (skipSet.has(el)) continue;
      if (!isVisible(el)) continue;

      var rect = el.getBoundingClientRect();
      var bounds = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      if (el.scrollWidth > el.clientWidth + 2) {
        var computed = window.getComputedStyle(el);
        var overflowX = computed.overflowX;
        var isEllipsis = computed.textOverflow === "ellipsis" && (overflowX === "hidden" || overflowX === "clip");
        if (overflowX !== "auto" && overflowX !== "scroll" && !isEllipsis) {
          violations.push({
            type: "HORIZONTAL_OVERFLOW",
            severity: "error",
            message: "Element overflows its container horizontally by " + (el.scrollWidth - el.clientWidth) + "px",
            selector: buildSelector(el),
            bounds: bounds,
            styles: getStyles(el, ["width", "min-width", "max-width", "overflow-x", "flex-shrink", "white-space"])
          });
        }
      }

      if (rect.right > vw + 1) {
        violations.push({
          type: "HORIZONTAL_OVERFLOW",
          severity: "error",
          message: "Element extends " + Math.round(rect.right - vw) + "px beyond viewport edge",
          selector: buildSelector(el),
          bounds: bounds,
          styles: getStyles(el, ["width", "min-width", "max-width", "margin-right", "padding-right", "position", "right"])
        });
      }

      if (el.scrollWidth > el.clientWidth + 2 && el.children.length === 0 && (el.textContent || "").trim().length > 0) {
        var comp = window.getComputedStyle(el);
        if (comp.textOverflow !== "ellipsis") {
          violations.push({
            type: "TEXT_TRUNCATION",
            severity: "warning",
            message: "Text is clipped without ellipsis - content overflows by " + (el.scrollWidth - el.clientWidth) + "px",
            selector: buildSelector(el),
            bounds: bounds,
            styles: getStyles(el, ["overflow", "text-overflow", "white-space", "max-width", "width"])
          });
        }
      }

      var tag = el.tagName;
      var interactive = tag === "A" || tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || el.getAttribute("role") === "button" || el.getAttribute("tabindex") !== null;

      if (interactive) {
        var MIN_TAP = 44;
        if (rect.width < MIN_TAP || rect.height < MIN_TAP) {
          violations.push({
            type: "TAP_TARGET_TOO_SMALL",
            severity: "warning",
            message: "Interactive element is " + Math.round(rect.width) + "x" + Math.round(rect.height) + "px - minimum recommended is " + MIN_TAP + "x" + MIN_TAP + "px",
            selector: buildSelector(el),
            bounds: bounds,
            styles: getStyles(el, ["width", "height", "min-width", "min-height", "padding"])
          });
        }
      }
    }

    if (document.body.scrollWidth > window.innerWidth + 2) {
      violations.push({
        type: "HORIZONTAL_OVERFLOW",
        severity: "error",
        message: "Page has unwanted horizontal scroll - body is " + (document.body.scrollWidth - window.innerWidth) + "px wider than viewport",
        selector: "body",
        bounds: { x: 0, y: 0, width: document.body.scrollWidth, height: document.body.scrollHeight },
        styles: [
          { property: "overflow-x", value: window.getComputedStyle(document.body).overflowX, selector: "body" },
          { property: "width", value: document.body.scrollWidth + "px (actual) vs " + window.innerWidth + "px (viewport)", selector: "body" }
        ]
      });
    }

    return violations;
  };
})();
  `;
}
