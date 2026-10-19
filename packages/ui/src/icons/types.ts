export type IconShape =
  | { tag: 'path'; d: string | null }
  | { tag: 'circle'; cx: number | null; cy: number | null; r: number | null }
  | { tag: 'ellipse'; cx: number | null; cy: number | null; rx: number | null; ry: number | null }
  | {
      tag: 'rect';
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
      rx: number | null;
    }
  | { tag: 'line'; x1: number | null; y1: number | null; x2: number | null; y2: number | null }
  | { tag: 'polyline' | 'polygon'; points: string | null };

export type IconShapes = {
  width: number;
  height: number;
  shapes: readonly IconShape[];
};
