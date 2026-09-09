"use client";

import { Sliders } from "lucide-react";
import { LabelFormat, LABEL_FORMATS } from "./types";

interface EtiquetasSettingsPanelProps {
  labelFormat: LabelFormat;
  onLabelFormatChange: (format: LabelFormat) => void;
  showBarcode: boolean;
  onShowBarcodeChange: (show: boolean) => void;
  showPreviousPrice: boolean;
  onShowPreviousPriceChange: (show: boolean) => void;
  showBrand: boolean;
  onShowBrandChange: (show: boolean) => void;
  showDate: boolean;
  onShowDateChange: (show: boolean) => void;
}

export function EtiquetasSettingsPanel({
  labelFormat,
  onLabelFormatChange,
  showBarcode,
  onShowBarcodeChange,
  showPreviousPrice,
  onShowPreviousPriceChange,
  showBrand,
  onShowBrandChange,
  showDate,
  onShowDateChange,
}: EtiquetasSettingsPanelProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 space-y-4">
      <div>
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2.5">
          <Sliders className="size-3.5 text-blue-400" /> Configuración de Formato & Plantilla
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LABEL_FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              type="button"
              onClick={() => onLabelFormatChange(fmt.key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                labelFormat === fmt.key
                  ? "bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="text-xs font-bold">{fmt.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{fmt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Customization Toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showBarcode}
            onChange={(e) => onShowBarcodeChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
          />
          <span>Código de Barras</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPreviousPrice}
            onChange={(e) => onShowPreviousPriceChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
          />
          <span>Precio Anterior</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showBrand}
            onChange={(e) => onShowBrandChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
          />
          <span>Marca de Producto</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDate}
            onChange={(e) => onShowDateChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
          />
          <span>Fecha Vigencia</span>
        </label>
      </div>
    </div>
  );
}
