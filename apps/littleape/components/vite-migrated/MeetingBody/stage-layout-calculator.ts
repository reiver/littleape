/**
 * reactiveLayout.ts – Reactive video‑conference layout utility (TypeScript)
 * ----------------------------------------------------------------------
 * Given the size of the viewing container and a list of active streams,
 * returns optimal rectangles (x, y, width, height) for each stream so that
 * every tile is as large as possible while preserving a screen‑share tile as
 * the focal element when present.
 *
 * – Each Stream is `{ id: string, type: 'camera' | 'screen' }`.
 * – The algorithm is O(N·√N) time, O(N) space.
 * – Framework‑agnostic: feed the result to CSS, WebGL, React Native, etc.
 */

export interface Stream {
  id: string;
  type: 'camera' | 'screen';
}

export interface Rect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute the layout for the current roster of streams.
 * @param canvasWidth  – container width in pixels
 * @param canvasHeight – container height in pixels
 * @param streams      – active video / screen streams
 * @returns array of rectangles in the same order as `streams`
 */
export default function layoutStreams(
  canvasWidth: number,
  canvasHeight: number,
  streams: Stream[],
): Rect[] {
  if (!Array.isArray(streams) || streams.length === 0) return [];

  const screenIdx = streams.findIndex((s) => s.type === 'screen');
  const rects: Rect[] = [];

  if (screenIdx !== -1) {
    // ————— Screen‑share present ————— //
    const screenStream = streams[screenIdx];
    const peers = [...streams.slice(0, screenIdx), ...streams.slice(screenIdx + 1)];

    // Reserve a dominant 16:9 pane for the screen‑share.
    const aspect = 16 / 9;
    let ssW = 0,
      ssH = 0;

    if (canvasWidth / canvasHeight >= aspect) {
      // Wide container → full‑width banner at top.
      ssW = canvasWidth;
      ssH = Math.min(Math.floor(ssW / aspect), Math.floor(canvasHeight * 0.65));
    } else {
      // Tall container → full‑height slab at left.
      ssH = canvasHeight;
      ssW = Math.min(Math.floor(ssH * aspect), Math.floor(canvasWidth * 0.8));
    }

    rects.push({ id: screenStream.id, x: 0, y: 0, width: ssW, height: ssH });

    // Remaining real‑estate for peer cams.
    const remX = ssW === canvasWidth ? 0 : ssW;
    const remY = ssH === canvasHeight ? 0 : ssH;
    const remW = canvasWidth - remX;
    const remH = canvasHeight - remY;

    const peerTiles = gridLayout(remW, remH, peers.length);
    peerTiles.forEach((t, i) => {
      rects.push({
        id: peers[i].id,
        x: t.x + remX,
        y: t.y + remY,
        width: t.width,
        height: t.height,
      });
    });
  } else {
    // ————— No screen‑share, simple grid ————— //
    const tiles = gridLayout(canvasWidth, canvasHeight, streams.length);
    tiles.forEach((t, i) => rects.push({ id: streams[i].id, ...t }));
  }

  // Preserve original stream order in output.
  return rects.sort(
    (a, b) => streams.findIndex((s) => s.id === a.id) - streams.findIndex((s) => s.id === b.id),
  );
}

/**
 * Find the grid (rows × cols) that maximises the minimum tile edge.
 * Returns array of {x, y, width, height} (without `id`).
 */
function gridLayout(areaW: number, areaH: number, count: number): Omit<Rect, 'id'>[] {
  if (count === 0) return [];

  type Candidate = { cols: number; rows: number; tile: number };
  let best: Candidate = { cols: 1, rows: count, tile: 0 };

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const tileW = Math.floor(areaW / cols);
    const tileH = Math.floor(areaH / rows);
    const tile = Math.min(tileW, tileH);

    if (tile > best.tile) best = { cols, rows, tile };
  }

  const tileW = Math.floor(areaW / best.cols);
  const tileH = Math.floor(areaH / best.rows);
  const tiles: Omit<Rect, 'id'>[] = [];

  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / best.cols);
    const c = i % best.cols;
    tiles.push({ x: c * tileW, y: r * tileH, width: tileW, height: tileH });
  }

  return tiles;
}
