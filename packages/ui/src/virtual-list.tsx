"use client";

import { useVirtualizer, type VirtualItem, type Virtualizer, type VirtualizerOptions } from "@tanstack/react-virtual";
import {
  useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState,
  type ComponentPropsWithoutRef, type ReactElement, type ReactNode, type Ref, type RefObject,
} from "react";
import { cn } from "./cn.js";

type ListVirtualizer = Virtualizer<HTMLDivElement, HTMLDivElement>;

export interface VirtualListScrollSnapshot {
  offset: number;
  measurements: VirtualItem[];
}

export interface UseVirtualListOptions {
  count: number;
  estimateSize: number | ((index: number) => number);
  overscan?: number;
  /** Supply stable item IDs when inserting, filtering, or reordering rows. */
  getItemKey?: VirtualizerOptions<HTMLDivElement, HTMLDivElement>["getItemKey"];
  measureElement?: VirtualizerOptions<HTMLDivElement, HTMLDivElement>["measureElement"];
  /** Initial offset in CSS pixels, for restoring a remounted viewport. */
  initialScrollOffset?: number;
  /** Restore both the offset and measured sizes for the same set of item keys. */
  initialScrollSnapshot?: VirtualListScrollSnapshot;
  onScrollOffsetChange?: (offset: number) => void;
  /** Keep the end pinned on append or row growth while the reader is already at the end. */
  followBottom?: boolean;
  bottomThreshold?: number;
  onBottomAnchorChange?: (atBottom: boolean) => void;
  /** Height of content above the virtual rows inside the viewport. */
  headerHeight?: number;
}

export interface VirtualListHandle {
  getScrollOffset: () => number;
  getScrollSnapshot: () => VirtualListScrollSnapshot;
  restoreScrollOffset: (offset: number) => void;
  scrollToBottom: () => void;
  isAtBottom: () => boolean;
}

export interface UseVirtualListResult extends VirtualListHandle {
  scrollRef: RefObject<HTMLDivElement | null>;
  virtualizer: ListVirtualizer;
}

function isViewportAtBottom(element: HTMLDivElement, threshold: number) {
  return element.scrollHeight - element.clientHeight - element.scrollTop <= threshold;
}

export function useVirtualList({
  count, estimateSize, overscan = 4, getItemKey, measureElement, initialScrollSnapshot,
  initialScrollOffset = initialScrollSnapshot?.offset ?? 0,
  onScrollOffsetChange, followBottom = false, bottomThreshold = 2, onBottomAnchorChange,
  headerHeight = 0,
}: UseVirtualListOptions): UseVirtualListResult {
  const scrollRef = useRef<HTMLDivElement>(null);
  const estimate = useCallback((index: number) => typeof estimateSize === "number" ? estimateSize : estimateSize(index), [estimateSize]);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: estimate,
    overscan,
    getItemKey,
    measureElement,
    initialOffset: initialScrollOffset,
    initialMeasurementsCache: initialScrollSnapshot?.measurements,
    paddingStart: headerHeight,
    scrollPaddingStart: headerHeight,
    anchorTo: followBottom ? "end" : "start",
    followOnAppend: followBottom ? "instant" : false,
    scrollEndThreshold: bottomThreshold,
  });

  const lastAnchor = useRef<boolean>(undefined);
  const lastOffset = useRef<number>(undefined);
  const reportScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const atBottom = isViewportAtBottom(element, bottomThreshold);
    if (onBottomAnchorChange && lastAnchor.current !== atBottom) {
      lastAnchor.current = atBottom;
      onBottomAnchorChange(atBottom);
    }
    if (onScrollOffsetChange && lastOffset.current !== element.scrollTop) {
      lastOffset.current = element.scrollTop;
      onScrollOffsetChange(element.scrollTop);
    }
  }, [bottomThreshold, onBottomAnchorChange, onScrollOffsetChange]);

  useEffect(() => {
    if (!onBottomAnchorChange && !onScrollOffsetChange) return;
    // A committed row measurement can change the anchor without a scroll event.
    reportScroll();
    const element = scrollRef.current;
    element?.addEventListener("scroll", reportScroll, { passive: true });
    return () => element?.removeEventListener("scroll", reportScroll);
  });

  const getScrollOffset = () => scrollRef.current?.scrollTop ?? initialScrollOffset;
  return {
    scrollRef,
    virtualizer,
    getScrollOffset,
    getScrollSnapshot: () => ({ offset: getScrollOffset(), measurements: virtualizer.takeSnapshot() }),
    restoreScrollOffset: (offset) => virtualizer.scrollToOffset(offset, { behavior: "instant" }),
    scrollToBottom: () => virtualizer.scrollToEnd({ behavior: "instant" }),
    isAtBottom: () => !!scrollRef.current && isViewportAtBottom(scrollRef.current, bottomThreshold),
  };
}

export interface VirtualListProps<T> extends Omit<ComponentPropsWithoutRef<"div">, "children">,
  Omit<UseVirtualListOptions, "count" | "getItemKey" | "headerHeight"> {
  items: readonly T[];
  getItemKey?: (item: T, index: number) => VirtualItem["key"];
  renderItem: (item: T, index: number) => ReactNode;
  stickyHeader?: ReactNode;
  ref?: Ref<VirtualListHandle>;
}

export function VirtualList<T>({
  items, renderItem, getItemKey, stickyHeader, ref, className, estimateSize, overscan,
  measureElement, initialScrollOffset, initialScrollSnapshot, onScrollOffsetChange, followBottom, bottomThreshold,
  onBottomAnchorChange, ...viewportProps
}: VirtualListProps<T>): ReactElement {
  const [header, setHeader] = useState<HTMLDivElement | null>(null);
  const [measuredHeaderHeight, setHeaderHeight] = useState(0);
  const hasHeader = stickyHeader != null && stickyHeader !== false;
  const headerHeight = hasHeader ? measuredHeaderHeight : 0;
  const keyForIndex = useCallback((index: number) => getItemKey?.(items[index]!, index) ?? index, [getItemKey, items]);
  const { scrollRef, virtualizer, ...controls } = useVirtualList({
    count: items.length, estimateSize, overscan, measureElement, initialScrollOffset, initialScrollSnapshot,
    getItemKey: getItemKey ? keyForIndex : undefined,
    onScrollOffsetChange, followBottom, bottomThreshold, onBottomAnchorChange, headerHeight,
  });
  useImperativeHandle(ref, () => controls);

  useLayoutEffect(() => {
    if (!header) return;
    const measure = () => setHeaderHeight(header.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [header]);

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      className={cn("min-h-0 overflow-auto [overflow-anchor:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring", className)}
      data-slot="virtual-list"
      {...viewportProps}
    >
      {hasHeader && (
        <div ref={setHeader} className="sticky top-0 z-10 bg-card text-card-foreground" data-slot="virtual-list-header">
          {stickyHeader}
        </div>
      )}
      <div role="list" className="relative" style={{ height: virtualizer.getTotalSize() - headerHeight }}>
        {virtualizer.getVirtualItems().map(({ key, index, start }) => (
          <div
            key={key}
            ref={virtualizer.measureElement}
            data-index={index}
            data-slot="virtual-list-row"
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={items.length}
            className="absolute top-0 inset-x-0"
            style={{ transform: `translateY(${start - headerHeight}px)` }}
          >
            {renderItem(items[index]!, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
