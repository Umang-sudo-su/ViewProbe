export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CulpritStyle {
  property: string;
  value: string;
  selector: string;
}

export interface SuggestedFix {
  css: string;
  tailwind?: string;
  explanation: string;
}

export type ViolationType =
  | "HORIZONTAL_OVERFLOW"
  | "VERTICAL_OVERFLOW"
  | "ELEMENT_COLLISION"
  | "TEXT_TRUNCATION"
  | "TAP_TARGET_TOO_SMALL"
  | "TAP_TARGET_OVERLAP"
  | "INVISIBLE_CONTENT"
  | "ASPECT_RATIO_DISTORTION";

export interface LayoutViolation {
  type: ViolationType;
  severity: "error" | "warning";
  viewport: Viewport;
  message: string;
  selector: string;
  bounds: BoundingBox;
  culpritStyles: CulpritStyle[];
  microCrop?: string;
  suggestedFix?: SuggestedFix;
}

export interface ProbeResult {
  url: string;
  timestamp: string;
  duration: number;
  viewportsChecked: Viewport[];
  violations: LayoutViolation[];
  passed: boolean;
  summary: string;
}

export interface ProbeConfig {
  url?: string;
  filePath?: string;
  html?: string;
  viewports?: Viewport[];
  selectors?: string[];
  timeout?: number;
  microCrops?: boolean;
  cropPadding?: number;
  cropQuality?: number;
  waitForSelector?: string;
  skipSelectors?: string[];
}

export const DEFAULT_VIEWPORTS: Viewport[] = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];

export const DEFAULT_CONFIG: Partial<ProbeConfig> = {
  timeout: 10000,
  microCrops: true,
  cropPadding: 20,
  cropQuality: 60,
};
