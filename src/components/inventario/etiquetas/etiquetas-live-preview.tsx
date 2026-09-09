"use client";

import { Eye, ZoomIn, ZoomOut } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductLabelItem, LabelFormat } from "./types";
import { VectorBarcode } from "./barcode-utils";

interface EtiquetasLivePreviewProps {
  selectedProducts: ProductLabelItem[];
  totalLabelsToPrint: number;
  labelFormat: LabelFormat;
  companyName: string;
  showBarcode: boolean;
  showPreviousPrice: boolean;
  showBrand: boolean;
  showDate: boolean;
  zoomLevel: number;
  onZoomLevelChange: (level: number) => void;
}

export function EtiquetasLivePreview({
  selectedProducts,
  totalLabelsToPrint,
  labelFormat,
  companyName,
  showBarcode,
  showPreviousPrice,
  showBrand,
  showDate,
  zoomLevel,
  onZoomLevelChange,
}: EtiquetasLivePreviewProps) {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-blue-400" />
          <span className="text-sm font-bold text-white tracking-tight">
            Vista Previa en Vivo ({totalLabelsToPrint} etiquetas)
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onZoomLevelChange(Math.max(75, zoomLevel - 15))}
            className="p-1 hover:text-white text-slate-400"
            title="Alejar"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="font-mono font-bold text-slate-300 min-w-[38px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => onZoomLevelChange(Math.min(150, zoomLevel + 15))}
            className="p-1 hover:text-white text-slate-400"
            title="Acercar"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Scrollport with physical paper look */}
      <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800/90 max-h-[580px] overflow-y-auto">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="transition-transform duration-150"
        >
          <div
            className={`grid gap-3.5 mx-auto ${
              labelFormat === "gondola_70x40"
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
                : labelFormat === "gondola_50x30"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-3xl"
                : labelFormat === "adhesiva_38x25"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-3xl"
                : "grid-cols-3 max-w-2xl bg-white p-4 rounded-xl shadow-2xl border border-slate-300"
            }`}
          >
            {selectedProducts.flatMap((prod) =>
              Array.from({ length: prod.copias }).map((_, idx) => (
                <div
                  key={`${prod.id}-${idx}`}
                  className={`p-3.5 rounded-xl border-2 border-dashed border-slate-400 bg-white text-black font-sans shadow-md space-y-2 relative overflow-hidden transition-all hover:border-blue-500 ${
                    labelFormat === "gondola_70x40"
                      ? "min-h-[145px]"
                      : labelFormat === "gondola_50x30"
                      ? "min-h-[120px] p-2.5"
                      : labelFormat === "adhesiva_38x25"
                      ? "min-h-[95px] p-2"
                      : "min-h-[110px] p-2 border-slate-300"
                  }`}
                >
                  {/* Header: Company & Promo Badge */}
                  <div className="flex items-center justify-between text-[10px] uppercase font-black text-slate-800 pb-1 border-b border-slate-300">
                    <span>{companyName}</span>
                    {prod.badgePromo ? (
                      <span className="px-1.5 py-0.2 rounded bg-black text-white text-[8px] font-black uppercase tracking-wider">
                        {prod.badgePromo}
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] text-slate-500 font-semibold">{prod.categoria}</span>
                    )}
                  </div>

                  {/* Product Title */}
                  <div>
                    <div className="font-black text-xs text-black leading-tight line-clamp-2">
                      {prod.nombre}
                    </div>
                    <div className="text-[9px] font-mono text-slate-600 mt-0.5 font-semibold">
                      SKU: {prod.sku} {showBrand && prod.marca ? `• ${prod.marca}` : ""}
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div>
                      {showPreviousPrice && prod.precioAnterior && (
                        <div className="text-[10px] text-slate-500 line-through font-mono font-bold">
                          Antes: {formatCurrency(prod.precioAnterior)}
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-slate-700 uppercase">
                        Precio x {prod.unidad}:
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-black tracking-tight drop-shadow-sm">
                        {formatCurrency(prod.precioVenta)}
                      </span>
                    </div>
                  </div>

                  {/* Authentic Vector Code-128 Barcode */}
                  {showBarcode && (
                    <div className="pt-1.5 border-t border-slate-300">
                      <VectorBarcode code={prod.barcode} />
                    </div>
                  )}

                  {/* Footer Date */}
                  {showDate && (
                    <div className="text-[8px] text-slate-500 text-right font-mono pt-0.5 font-medium">
                      Vigencia: {new Date().toLocaleDateString("es-PE")}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
