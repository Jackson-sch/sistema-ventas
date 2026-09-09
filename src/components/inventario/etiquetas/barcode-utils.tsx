"use client";

import { useMemo } from "react";

// ── Real Standard Code-128B Barcode Patterns ─────────────────────────
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

export function generateCode128Bars(text: string): { width: number; isBar: boolean }[] {
  const clean = text.trim() || "00000000";
  const charCodes: number[] = [104]; // Start Code B
  let checkSum = 104;

  for (let i = 0; i < clean.length; i++) {
    const ascii = clean.charCodeAt(i);
    const val = ascii >= 32 && ascii <= 126 ? ascii - 32 : 0;
    charCodes.push(val);
    checkSum += val * (i + 1);
  }

  charCodes.push(checkSum % 103);
  charCodes.push(106); // Stop Code

  const result: { width: number; isBar: boolean }[] = [];
  // Left Quiet Zone
  result.push({ width: 10, isBar: false });

  for (const code of charCodes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      result.push({ width, isBar });
    }
  }

  // Right Quiet Zone
  result.push({ width: 10, isBar: false });
  return result;
}

// Authentic High-Precision Vector SVG Barcode Component
export function VectorBarcode({ code }: { code: string }) {
  const bars = useMemo(() => generateCode128Bars(code), [code]);
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;
  const rects: { x: number; width: number }[] = [];
  bars.forEach((b) => {
    if (b.isBar) {
      rects.push({ x: currentX, width: b.width });
    }
    currentX += b.width;
  });

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg
        className="w-full h-8 overflow-hidden"
        viewBox={`0 0 ${totalWidth} 34`}
        preserveAspectRatio="none"
      >
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y="0" width={r.width} height="34" fill="#000000" />
        ))}
      </svg>
      <span className="font-mono text-[9.5px] tracking-[0.25em] text-black font-extrabold mt-0.5 select-none">
        {code}
      </span>
    </div>
  );
}

// Helper to generate SVG string for standalone Print iframe
export function generateCode128SvgString(code: string): string {
  const bars = generateCode128Bars(code);
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;
  let rectsHtml = "";
  bars.forEach((b) => {
    if (b.isBar) {
      rectsHtml += `<rect x="${currentX}" y="0" width="${b.width}" height="32" fill="#000000" />`;
    }
    currentX += b.width;
  });

  return `
    <div style="display:flex; flex-direction:column; align-items:center; width:100%; margin-top:2px;">
      <svg viewBox="0 0 ${totalWidth} 32" style="width:100%; height:26px; display:block;" preserveAspectRatio="none">
        ${rectsHtml}
      </svg>
      <div style="font-family:monospace; font-size:9px; font-weight:800; letter-spacing:2px; color:#000; margin-top:1px;">
        ${code}
      </div>
    </div>
  `;
}
