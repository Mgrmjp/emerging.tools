"use client";

import { useState, useEffect } from "react";

interface FontPreviewProps {
  family: string;
  weights: number[];
  styles: string[];
}

function buildGoogleFontsUrl(family: string, weights: number[], styles: string[]): string {
  const uniqueWeights = [...new Set(weights)].slice(0, 7).join(",");
  const familyParam = family.replace(/ /g, "+");
  if (styles.includes("italic")) {
    return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@0,${uniqueWeights};1,${uniqueWeights}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${uniqueWeights}&display=swap`;
}

export function FontPreview({ family, weights, styles }: FontPreviewProps) {
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    const url = buildGoogleFontsUrl(family, weights, styles);
    const link = document.createElement("link");
    link.href = url;
    link.rel = "stylesheet";

    let done = false;
    const markReady = () => {
      if (!done) {
        done = true;
        setFontReady(true);
      }
    };

    link.onload = () => {
      document.fonts.ready.then(markReady);
    };

    link.onerror = () => markReady();

    document.head.appendChild(link);

    const timeout = setTimeout(markReady, 5000);

    return () => {
      clearTimeout(timeout);
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [family, weights, styles]);

  const fontFace = `"${family}", ui-sans-serif, system-ui, sans-serif`;

  return (
    <div className="space-y-4">
      <div
        className="p-8 border text-center overflow-hidden transition-opacity duration-500"
        style={{
          fontFamily: fontFace,
          fontSize: "64px",
          lineHeight: "1.1",
          opacity: fontReady ? 1 : 0.5,
          minHeight: "100px",
        }}
      >
        Aa Bb Cc
      </div>

      <div
        className="p-6 border text-center overflow-hidden transition-opacity duration-500"
        style={{
          fontFamily: fontFace,
          fontSize: "24px",
          lineHeight: "1.4",
          opacity: fontReady ? 1 : 0.5,
        }}
      >
        The quick brown fox jumps over the lazy dog
      </div>

      <div
        className="p-6 border overflow-hidden transition-opacity duration-500"
        style={{
          fontFamily: fontFace,
          fontSize: "16px",
          lineHeight: "1.6",
          opacity: fontReady ? 1 : 0.5,
        }}
      >
        <p className="mb-3">
          A good font improves readability during long coding sessions.
          {family} offers {weights.length} weights.
        </p>
        <p>
          0123456789 · !@#$%^&amp;*() · &lt;&gt;{"{}"}[] · ;:'".,~
        </p>
      </div>

      {weights.length > 0 && (
        <div className="border border-[var(--border)]">
          <p className="text-[9px] tracking-[0.15em] uppercase px-4 pt-3 text-[var(--muted)]">
            weights
          </p>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-4">
            {weights.map((w) => (
              <div
                key={w}
                className="flex items-baseline gap-2 transition-opacity duration-500"
                style={{ fontWeight: w, fontFamily: fontFace, opacity: fontReady ? 1 : 0.5 }}
              >
                <span className="text-[10px] tabular-nums w-10 text-right text-[var(--muted)]">
                  {w}
                </span>
                <span className="text-sm text-[var(--text)] truncate">
                  {family}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
