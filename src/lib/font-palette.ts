function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export interface FontPalette {
  bg: string;
  fg: string;
  accent: string;
  keyword: string;
  string: string;
  comment: string;
  variable: string;
  function: string;
  number: string;
  border: string;
  surface: string;
  muted: string;
}

const categoryBaseColors: Record<string, string> = {
  sans: "#3cf73c",
  serif: "#f7d73c",
  display: "#f73c3c",
  monospace: "#3c9cf7",
  handwriting: "#c73cf7",
};

export function deriveFontPalette(category: string): FontPalette {
  const base = categoryBaseColors[category] || "#00e5ff";
  const [h, s] = hexToHsl(base);

  const keyword = hslToHex((h + 10) % 360, Math.min(s + 10, 95), 65);
  const string = hslToHex((h + 60) % 360, s - 10, 72);
  const comment = hslToHex(h, Math.max(s - 40, 10), 40);
  const variable = hslToHex((h + 180) % 360, Math.min(s + 5, 95), 62);
  const fn = hslToHex((h + 30) % 360, s + 5, 68);
  const number = hslToHex((h + 120) % 360, s, 72);
  const fg = hslToHex(h, Math.max(s - 30, 15), 88);
  const border = hslToHex(h, Math.max(s - 40, 8), 15);
  const surface = hslToHex(h, Math.max(s - 30, 5), 8);
  const muted = hslToHex(h, Math.max(s - 45, 5), 52);

  return {
    bg: hslToHex(h, Math.max(s - 30, 3), 3),
    fg,
    accent: base,
    keyword,
    string,
    comment,
    variable,
    function: fn,
    number,
    border,
    surface,
    muted,
  };
}
