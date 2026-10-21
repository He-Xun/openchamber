import { CODE_FONT_OPTION_MAP, UI_FONT_OPTION_MAP, type FontFaceSource, type MonoFontOption, type UiFontOption } from '@/lib/fontOptions';

const loadedFaces = new Set<string>();
const pendingFaces = new Map<string, Promise<void>>();
const loadedCss = new Set<string>();
const pendingCss = new Map<string, Promise<void>>();

const buildFontUrl = (source: FontFaceSource, weight: number) => {
  if ('urls' in source) {
    return source.urls[weight];
  }
  if ('cssUrl' in source) {
    return source.cssUrl;
  }

  const packageName = encodeURIComponent(source.packageName).replace('%40', '@').replace('%2F', '/');
  return `https://cdn.jsdelivr.net/npm/${packageName}/files/${source.filePrefix}-latin-${weight}-normal.woff2`;
};

/**
 * Stylesheets with their own @font-face rules (CJK subsets). Network-loaded
 * only. Fontsource publishes one stylesheet per weight (`400.css`, `500.css`,
 * …) beside `index.css` (which is just 400), so each declared weight loads
 * its own file — otherwise `font-synthesis-weight: none` would leave medium
 * and semibold CJK silently rendering regular.
 */
const loadOneCss = (url: string, family: string): Promise<void> => {
  const key = `css:${url}`;
  if (loadedCss.has(key)) return Promise.resolve();
  const pending = pendingCss.get(key);
  if (pending) return pending;

  const promise = new Promise<void>((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLLinkElement>(`link[data-font-css="${url}"]`);
    if (existing) {
      loadedCss.add(key);
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-font-css', url);
    link.onload = () => {
      loadedCss.add(key);
      resolve();
    };
    link.onerror = () => {
      console.warn(`Failed to load font stylesheet: ${family}`, url);
      resolve();
    };
    document.head.appendChild(link);
  }).finally(() => {
    pendingCss.delete(key);
  });

  pendingCss.set(key, promise);
  return promise;
};

/** Load every declared weight: fontsource ships one stylesheet per weight. */
const loadCssSource = (source: { family: string; cssUrl: string; weights: readonly number[] }): Promise<void> => {
  const dir = source.cssUrl.replace(/\/[^/]*$/, '');
  return Promise.all(source.weights.map((weight) => loadOneCss(`${dir}/${weight}.css`, source.family))).then(() => undefined);
};

const loadFace = (source: FontFaceSource, weight: number) => {
  const key = `${source.family}:${weight}`;
  if (loadedFaces.has(key)) {
    return Promise.resolve();
  }

  const pending = pendingFaces.get(key);
  if (pending) {
    return pending;
  }

  if (typeof document === 'undefined' || typeof FontFace === 'undefined' || !document.fonts) {
    return Promise.resolve();
  }

  const face = new FontFace(source.family, `url(${buildFontUrl(source, weight)}) format('woff2')`, {
    style: 'normal',
    weight: String(weight),
    display: 'swap',
  });

  document.fonts.add(face);
  const promise = face.load()
    .then(() => {
      loadedFaces.add(key);
    })
    .catch((error) => {
      document.fonts.delete(face);
      console.warn(`Failed to load font: ${source.family} ${weight}`, error);
    })
    .finally(() => {
      pendingFaces.delete(key);
    });

  pendingFaces.set(key, promise);
  return promise;
};

const loadSource = (source: FontFaceSource | undefined) => {
  if (!source) {
    return Promise.resolve();
  }

  if ('cssUrl' in source) {
    return loadCssSource(source);
  }

  return Promise.all(source.weights.map((weight) => loadFace(source, weight))).then(() => undefined);
};

export const loadUiFont = (font: UiFontOption) => loadSource(UI_FONT_OPTION_MAP[font]?.source);

export const loadMonoFont = (font: MonoFontOption) => loadSource(CODE_FONT_OPTION_MAP[font]?.source);
