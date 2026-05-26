export type TryOnOverlayConfig = {
  key: string;
  label: string;
  assetPath: string;
  anchor: { x: number; y: number };
  scale: number;
  rotationDeg: number;
  offset: { x: number; y: number };
};

const overlayByStyleName: Record<string, TryOnOverlayConfig> = {
  fade: {
    key: 'fade',
    label: 'Fade',
    assetPath: '/try-on/haircuts/fade.svg',
    anchor: { x: 0.5, y: 0.82 },
    scale: 2.1,
    rotationDeg: 0,
    offset: { x: 0, y: -0.18 },
  },
  'buzz cut': {
    key: 'fade',
    label: 'Buzz Cut',
    assetPath: '/try-on/haircuts/fade.svg',
    anchor: { x: 0.5, y: 0.82 },
    scale: 2.0,
    rotationDeg: 0,
    offset: { x: 0, y: -0.16 },
  },
  pompadour: {
    key: 'pomp',
    label: 'Pompadour',
    assetPath: '/try-on/haircuts/pomp.svg',
    anchor: { x: 0.5, y: 0.78 },
    scale: 2.35,
    rotationDeg: 2,
    offset: { x: 0, y: -0.26 },
  },
  'slick back': {
    key: 'pomp',
    label: 'Slick Back',
    assetPath: '/try-on/haircuts/pomp.svg',
    anchor: { x: 0.5, y: 0.8 },
    scale: 2.25,
    rotationDeg: 0,
    offset: { x: 0, y: -0.22 },
  },
  'crew cut': {
    key: 'classic',
    label: 'Crew Cut',
    assetPath: '/try-on/haircuts/classic.svg',
    anchor: { x: 0.5, y: 0.82 },
    scale: 2.05,
    rotationDeg: 0,
    offset: { x: 0, y: -0.18 },
  },
  undercut: {
    key: 'classic',
    label: 'Undercut',
    assetPath: '/try-on/haircuts/classic.svg',
    anchor: { x: 0.5, y: 0.8 },
    scale: 2.2,
    rotationDeg: 1,
    offset: { x: 0, y: -0.22 },
  },
  bob: {
    key: 'bob',
    label: 'Bob',
    assetPath: '/try-on/haircuts/bob.svg',
    anchor: { x: 0.5, y: 0.58 },
    scale: 2.05,
    rotationDeg: 0,
    offset: { x: 0, y: -0.05 },
  },
  'layered cut': {
    key: 'bob',
    label: 'Layered Cut',
    assetPath: '/try-on/haircuts/bob.svg',
    anchor: { x: 0.5, y: 0.6 },
    scale: 2.15,
    rotationDeg: 0,
    offset: { x: 0, y: -0.08 },
  },
};

export const defaultOverlay: TryOnOverlayConfig = {
  key: 'classic',
  label: 'Classic',
  assetPath: '/try-on/haircuts/classic.svg',
  anchor: { x: 0.5, y: 0.82 },
  scale: 2.1,
  rotationDeg: 0,
  offset: { x: 0, y: -0.18 },
};

const normalizeStyleName = (styleName: string) =>
  styleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const resolveOverlayForStyle = (styleName?: string | null) => {
  if (!styleName) {
    return defaultOverlay;
  }
  const key = normalizeStyleName(styleName);
  return overlayByStyleName[key] ?? defaultOverlay;
};

