export const auxiliaryPaneWidths = { sm: 360, md: 400, lg: 440 } as const;
export const dialogWidths = { sm: 400, md: 560, lg: 720 } as const;
export const drawerWidths = { sm: 400, md: 560, lg: 760, xl: 840 } as const;

export type AuxiliaryPaneSize = keyof typeof auxiliaryPaneWidths;
export type DialogSize = keyof typeof dialogWidths;
export type DrawerSize = keyof typeof drawerWidths;
export type AppShellMode = "standard" | "immersive";

export const workbenchLayout = {
  l1Width: 56,
  l2Width: 208,
  topBarHeight: 48,
  desktopWidth: 1280,
  wideDesktopWidth: 1440,
  fullScreenWidth: 768,
  contentMinWidth: 720,
  overlaySafeMargin: 16, // --ole-spacing-16
} as const;

export interface DialogSafeMargins {
  start: number;
  end: number;
}

/** Margins are in CSS pixels and include the corresponding device safe area. */
export function computeDialogWidth(
  width: number,
  size: DialogSize,
  safeMargins: number | DialogSafeMargins = workbenchLayout.overlaySafeMargin,
): number {
  const horizontalMargins = typeof safeMargins === "number"
    ? safeMargins * 2
    : safeMargins.start + safeMargins.end;
  return Math.max(0, width < workbenchLayout.fullScreenWidth
    ? width
    : Math.min(dialogWidths[size], width - horizontalMargins));
}

/** The compact Drawer fills the available width up to the non-docked safe margin. */
export function computeDrawerWidth(
  width: number,
  size: DrawerSize,
  safeMargin: number = workbenchLayout.overlaySafeMargin,
): number {
  if (width >= workbenchLayout.desktopWidth) return Math.min(drawerWidths[size], drawerWidths.xl, width * 0.65);
  return Math.max(0, width < workbenchLayout.fullScreenWidth ? width : width - safeMargin);
}

export interface ContentWidthBudget {
  /** Actual inner width of the shell. All deductions are separate border-box occupations. */
  width: number;
  l1Width?: number;
  l2Width?: number;
  auxiliaryWidth?: number;
  paddingStart?: number;
  paddingEnd?: number;
  rulerWidth?: number;
  outsideGap?: number;
  maxContentWidth?: number;
}

export function computeContentNetWidth({
  width, l1Width = 0, l2Width = 0, auxiliaryWidth = 0, paddingStart = 0,
  paddingEnd = 0, rulerWidth = 0, outsideGap = 0, maxContentWidth = Infinity,
}: ContentWidthBudget): number {
  return Math.max(0, Math.min(maxContentWidth,
    width - l1Width - l2Width - auxiliaryWidth - paddingStart - paddingEnd - rulerWidth - outsideGap,
  ));
}

export interface SplitBudget {
  /** The registered list width is between 260px and 340px. */
  listWidth?: number;
  dividerWidth?: number;
  detailMinWidth?: number;
  contentMinWidth?: number;
}

export function computeSplitCanSideBySide(contentNetWidth: number, {
  listWidth = 280, dividerWidth = 1, detailMinWidth = 480, contentMinWidth = workbenchLayout.contentMinWidth,
}: SplitBudget = {}): boolean {
  return contentNetWidth >= Math.max(contentMinWidth, listWidth + dividerWidth + detailMinWidth);
}

export type AuxiliaryPaneEntry = { kind: "drawer"; size: DrawerSize } | { kind: "single-view" };
export type LayoutDegradationStep = 1 | 2 | 3 | 4 | 5;
type ReorderableStep = 2 | 3 | 4;
export type LayoutDegradationOrder =
  | readonly [2, 3, 4] | readonly [2, 4, 3]
  | readonly [3, 2, 4] | readonly [3, 4, 2]
  | readonly [4, 2, 3] | readonly [4, 3, 2];

export interface LayoutBudget extends Omit<ContentWidthBudget, "auxiliaryWidth"> {
  mode?: AppShellMode;
  /** Actual in-flow width, if already measured. Otherwise the preference determines it. */
  l2Width?: number;
  l2PreferredExpanded?: boolean;
  contentMinWidth?: number;
  split?: SplitBudget;
  auxiliaryPane?: {
    size?: AuxiliaryPaneSize;
    minSize?: AuxiliaryPaneSize;
    canUseSize?: (size: AuxiliaryPaneSize) => boolean;
    /** Accessible presentation for the auxiliary task when it no longer fits alongside. */
    entry: AuxiliaryPaneEntry;
  };
  optionalRuler?: boolean;
  allowImmersiveL1Collapse?: boolean;
  order?: LayoutDegradationOrder;
}

export interface LayoutBudgetResult {
  l1Width: number;
  l2Width: number;
  l2PreferredExpanded: boolean;
  rulerWidth: number;
  auxiliaryPane: { kind: "inline"; size: AuxiliaryPaneSize } | AuxiliaryPaneEntry | null;
  split: "side-by-side" | "single-view" | null;
  contentNetWidth: number;
  fits: boolean;
  appliedSteps: readonly LayoutDegradationStep[];
}

const auxiliarySizes = ["lg", "md", "sm"] as const;
const defaultOrder: LayoutDegradationOrder = [2, 3, 4];

export function degradeLayout(input: LayoutBudget): LayoutBudgetResult {
  const {
    mode = "standard", l1Width = workbenchLayout.l1Width, rulerWidth = 0, auxiliaryPane,
    l2PreferredExpanded = mode === "standard",
    l2Width = l2PreferredExpanded ? workbenchLayout.l2Width : 0,
    contentMinWidth = workbenchLayout.contentMinWidth,
  } = input;
  const splitBudget = input.split && {
    ...input.split, contentMinWidth: Math.max(contentMinWidth, input.split.contentMinWidth ?? 0),
  };
  const appliedSteps: LayoutDegradationStep[] = [];
  const result: LayoutBudgetResult = {
    l1Width, l2Width, l2PreferredExpanded, rulerWidth,
    auxiliaryPane: auxiliaryPane ? { kind: "inline", size: auxiliaryPane.size ?? "md" } : null,
    split: splitBudget ? "side-by-side" : null,
    contentNetWidth: 0, fits: false, appliedSteps,
  };

  function canUseSize(size: AuxiliaryPaneSize): boolean {
    return !auxiliaryPane || (
      auxiliaryPaneWidths[size] >= auxiliaryPaneWidths[auxiliaryPane.minSize ?? "sm"] &&
      (auxiliaryPane.canUseSize?.(size) ?? true)
    );
  }

  function contentFits(): boolean {
    return result.contentNetWidth >= contentMinWidth &&
      (result.split !== "side-by-side" || computeSplitCanSideBySide(result.contentNetWidth, splitBudget));
  }

  function measure(): boolean {
    const pane = result.auxiliaryPane;
    result.contentNetWidth = computeContentNetWidth({
      ...input, l1Width: result.l1Width, l2Width: result.l2Width, rulerWidth: result.rulerWidth,
      auxiliaryWidth: pane?.kind === "inline" ? auxiliaryPaneWidths[pane.size] : 0,
    });
    result.fits = contentFits() &&
      (pane?.kind !== "inline" || canUseSize(pane.size));
    return result.fits;
  }

  if (measure()) return result;
  if (result.l2Width > 0) {
    result.l2Width = 0;
    appliedSteps.push(1);
    if (measure()) return result;
  }

  for (const step of new Set<ReorderableStep>([...(input.order ?? defaultOrder), ...defaultOrder])) {
    if (step === 2 && result.split === "side-by-side" &&
      !computeSplitCanSideBySide(result.contentNetWidth, splitBudget)) {
      result.split = "single-view";
      appliedSteps.push(step);
    }
    if (step === 3 && !contentFits() && result.auxiliaryPane?.kind === "inline") {
      const currentSize = result.auxiliaryPane.size;
      for (const size of auxiliarySizes.slice(auxiliarySizes.indexOf(currentSize) + 1)) {
        if (!canUseSize(size)) break;
        result.auxiliaryPane = { kind: "inline", size };
        if (appliedSteps.at(-1) !== step) appliedSteps.push(step);
        if (measure()) return result;
      }
    }
    if (step === 4) {
      if (input.optionalRuler && result.rulerWidth > 0) {
        result.rulerWidth = 0;
        appliedSteps.push(step);
        if (measure()) return result;
      }
      if (mode === "immersive" && input.allowImmersiveL1Collapse && result.l1Width > 0) {
        result.l1Width = 0;
        if (appliedSteps.at(-1) !== step) appliedSteps.push(step);
      }
    }
    if (measure()) return result;
  }

  if (auxiliaryPane) {
    result.auxiliaryPane = auxiliaryPane.entry;
    appliedSteps.push(5);
    measure();
  }
  return result;
}
