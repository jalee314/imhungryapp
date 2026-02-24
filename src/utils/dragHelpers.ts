// Shared drag-and-drop utility functions

export const THUMBNAIL_SIZE = 56;
export const GAP = 8;
export const ITEM_WIDTH = THUMBNAIL_SIZE + GAP;

/**
 * Calculate visual index after a theoretical reorder.
 * This helps determine where an item will visually appear during drag preview.
 */
export function getVisualIndex(itemIndex: number, dragFrom: number, dragTo: number): number {
  if (itemIndex === dragFrom) return dragTo;

  if (dragFrom < dragTo) {
    // Dragging right
    if (itemIndex > dragFrom && itemIndex <= dragTo) {
      return itemIndex - 1;
    }
  } else if (dragFrom > dragTo) {
    // Dragging left
    if (itemIndex >= dragTo && itemIndex < dragFrom) {
      return itemIndex + 1;
    }
  }
  return itemIndex;
}

/**
 * Calculate offset for non-dragged items based on drag position.
 * Items between drag start and target should shift to make room.
 */
export function getItemOffset(
  itemIndex: number,
  draggingIndex: number | null,
  targetIndex: number | null,
  itemWidth: number = ITEM_WIDTH
): number {
  if (draggingIndex === null || targetIndex === null) return 0;
  if (itemIndex === draggingIndex) return 0;

  if (draggingIndex < targetIndex) {
    // Dragging right: items between shift left
    if (itemIndex > draggingIndex && itemIndex <= targetIndex) {
      return -itemWidth;
    }
  } else if (draggingIndex > targetIndex) {
    // Dragging left: items between shift right
    if (itemIndex >= targetIndex && itemIndex < draggingIndex) {
      return itemWidth;
    }
  }
  return 0;
}

/**
 * Remap a Map's indices after a reorder operation.
 * When an item moves from fromIndex to toIndex, all affected indices need updating.
 */
export function remapIndicesAfterReorder<T>(
  map: Map<number, T>,
  fromIndex: number,
  toIndex: number
): Map<number, T> {
  const newMap = new Map<number, T>();
  map.forEach((value, key) => {
    let newKey = key;
    if (key === fromIndex) {
      newKey = toIndex;
    } else if (fromIndex < toIndex && key > fromIndex && key <= toIndex) {
      newKey = key - 1;
    } else if (fromIndex > toIndex && key >= toIndex && key < fromIndex) {
      newKey = key + 1;
    }
    newMap.set(newKey, value);
  });
  return newMap;
}

/**
 * Remap a Map's indices after a delete operation.
 * When an item is deleted at deleteIndex, all higher indices shift down.
 */
export function remapIndicesAfterDelete<T>(
  map: Map<number, T>,
  deleteIndex: number
): Map<number, T> {
  const newMap = new Map<number, T>();
  map.forEach((value, key) => {
    if (key < deleteIndex) {
      newMap.set(key, value);
    } else if (key > deleteIndex) {
      newMap.set(key - 1, value);
    }
    // key === deleteIndex is skipped (deleted)
  });
  return newMap;
}
