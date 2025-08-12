import type { FC, PropsWithChildren, ReactElement } from "react";
import { cloneElement, isValidElement } from "react";

// Default aspect ratio for video (16:9)
const DEFAULT_ASPECT_RATIO = 16 / 9;

interface DynamicLayoutProps {
  width: number;
  height: number;
  aspectRatio?: number; // Optional, defaults to 16/9
  gap?: number; // Gap between items in px
  pinnedIndex?: number;
  pinnedRatio?: number; // Ratio of space for pinned video (0 < pinnedRatio < 1)
}

type LayoutChild = ReactElement<{
  className?: string;
  style?: React.CSSProperties;
}>;

export const DynamicLayout: FC<PropsWithChildren<DynamicLayoutProps>> = ({
  width,
  height,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  gap = 0,
  pinnedIndex = -1,
  pinnedRatio = 9 / 12,
  children,
}) => {
  const childArray = Array.isArray(children) ? children : [children];
  const count = childArray.length;

  // Layout for regular grid (no pin)
  let bestGrid = { area: 0, rows: 1, cols: count, w: 0, h: 0 };
  for (let rows = 1; rows <= count; rows++) {
    const cols = Math.ceil(count / rows);
    const totalGapW = gap * (cols - 1);
    const totalGapH = gap * (rows - 1);
    let cellW = (width - totalGapW) / cols;
    let cellH = (height - totalGapH) / rows;
    if (cellW / cellH > aspectRatio) {
      cellW = cellH * aspectRatio;
    } else {
      cellH = cellW / aspectRatio;
    }
    const area = cellW * cellH;
    if (area > bestGrid.area) {
      bestGrid = { area, rows, cols, w: cellW, h: cellH };
    }
  }
  const totalW = bestGrid.cols * bestGrid.w + gap * (bestGrid.cols - 1);
  const totalH = bestGrid.rows * bestGrid.h + gap * (bestGrid.rows - 1);
  const offsetX = (width - totalW) / 2;
  const offsetY = (height - totalH) / 2;

  // Layout for pin mode
  let pinLayout: { [idx: number]: React.CSSProperties } = {};
  if (pinnedIndex !== -1 && count > 1) {
    // Step 1: Calculate initial split based on pinnedRatio
    const splitVertical = width >= height;
    const others = childArray.filter((_, i) => i !== pinnedIndex);
    const minPinnedSize = splitVertical ? width * pinnedRatio : height * pinnedRatio;
    const minOthersSize = splitVertical ? width * (1 - pinnedRatio) : height * (1 - pinnedRatio);
    let pinnedSize = minPinnedSize;
    let othersSize = minOthersSize;
    let othersBox = splitVertical
      ? {
          left: pinnedSize + gap,
          top: 0,
          width: othersSize - gap,
          height,
        }
      : {
          left: 0,
          top: pinnedSize + gap,
          width,
          height: othersSize - gap,
        };
    let best = { area: 0, rows: 1, cols: others.length, w: 0, h: 0 };
    // Step 2: Layout unpinned videos in their section
    for (let rows = 1; rows <= others.length; rows++) {
      const cols = Math.ceil(others.length / rows);
      const totalGapW = gap * (cols - 1);
      const totalGapH = gap * (rows - 1);
      let cellW = (othersBox.width - totalGapW) / cols;
      let cellH = (othersBox.height - totalGapH) / rows;
      if (cellW / cellH > aspectRatio) {
        cellW = cellH * aspectRatio;
      } else {
        cellH = cellW / aspectRatio;
      }
      const area = cellW * cellH;
      if (area > best.area) {
        best = { area, rows, cols, w: cellW, h: cellH };
      }
    }
    // Step 3: Check for leftover space in unpinned section
    const usedOthersWidth = splitVertical
      ? best.cols * best.w + gap * (best.cols - 1)
      : othersBox.width;
    const usedOthersHeight = splitVertical
      ? othersBox.height
      : best.rows * best.h + gap * (best.rows - 1);
    let leftover = splitVertical
      ? othersBox.width - usedOthersWidth
      : othersBox.height - usedOthersHeight;
    if (leftover > 0) {
      // Grow pinned video to fill leftover space
      if (splitVertical) {
        pinnedSize += leftover;
        othersBox = {
          left: pinnedSize + gap / 2,
          top: 0,
          width: width - pinnedSize - gap / 2,
          height,
        };
      } else {
        pinnedSize += leftover;
        othersBox = {
          left: 0,
          top: pinnedSize + gap / 2,
          width,
          height: height - pinnedSize - gap / 2,
        };
      }
    }
    // Recalculate pinned/unpinned layout with new pinnedSize
    const pinnedBox = splitVertical
      ? { left: 0, top: 0, width: pinnedSize, height }
      : { left: 0, top: 0, width, height: pinnedSize };
    const totalW2 = best.cols * best.w + gap * (best.cols - 1);
    const totalH2 = best.rows * best.h + gap * (best.rows - 1);
    const offsetX2 = othersBox.left + (othersBox.width - totalW2) / 2;
    const offsetY2 = othersBox.top + (othersBox.height - totalH2) / 2;
    // Pinned
    pinLayout[pinnedIndex] = {
      position: "absolute",
      left: pinnedBox.left,
      top: pinnedBox.top,
      width: pinnedBox.width,
      height: pinnedBox.height,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      overflow: "hidden",
    };
    // Others
    let k = 0;
    for (let i = 0; i < count; i++) {
      if (i === pinnedIndex) continue;
      const row = Math.floor(k / best.cols);
      const col = k % best.cols;
      // Center last row if not full
      let left = offsetX2 + col * (best.w + gap);
      if (row === best.rows - 1) {
        const itemsInLastRow = others.length - best.cols * (best.rows - 1);
        if (itemsInLastRow < best.cols) {
          const extraSpace = ((best.cols - itemsInLastRow) * (best.w + gap)) / 2;
          left += extraSpace;
        }
      }
      pinLayout[i] = {
        position: "absolute",
        left,
        top: offsetY2 + row * (best.h + gap),
        width: best.w,
        height: best.h,
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        overflow: "hidden",
      };
      k++;
    }
  } else if (pinnedIndex !== -1 && count === 1) {
    // Single pinned: full size, others hidden
    pinLayout[0] = {
      position: "absolute",
      left: 0,
      top: 0,
      width,
      height,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      overflow: "hidden",
    };
  }

  return (
    <div
      style={{
        width,
        height,
      }}
      className="relative overflow-hidden transition-all mt-4 ml-4"
    >
      {childArray.map((child, i) => {
        if (!isValidElement(child)) return null;
        const el = child as LayoutChild;
        let style: React.CSSProperties;
        if (pinnedIndex !== -1) {
          if (pinLayout[i]) {
            style = { ...pinLayout[i], ...(el.props.style || {}) };
          } else if (count === 1) {
            // Shouldn't happen, but fallback
            style = {
              opacity: 0,
              pointerEvents: "none",
              zIndex: 0,
              width: 0,
              height: 0,
              ...(el.props.style || {}),
            };
          } else {
            // Hide non-pinned in single-pinned case
            style = {
              opacity: 0,
              pointerEvents: "none",
              zIndex: 0,
              width: 0,
              height: 0,
              ...(el.props.style || {}),
            };
          }
        } else {
          // Regular grid
          const row = Math.floor(i / bestGrid.cols);
          const col = i % bestGrid.cols;
          let left = offsetX + col * (bestGrid.w + gap);
          if (row === bestGrid.rows - 1) {
            const itemsInLastRow = count - bestGrid.cols * (bestGrid.rows - 1);
            if (itemsInLastRow < bestGrid.cols) {
              const extraSpace = ((bestGrid.cols - itemsInLastRow) * (bestGrid.w + gap)) / 2;
              left += extraSpace;
            }
          }
          style = {
            position: "absolute" as const,
            left,
            top: offsetY + row * (bestGrid.h + gap),
            width: bestGrid.w,
            height: bestGrid.h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            overflow: "hidden",
            ...(el.props.style || {}),
          };
        }
        return cloneElement(el, { style, key: i });
      })}
    </div>
  );
};
