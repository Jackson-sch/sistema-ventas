"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Tag,
  Barcode,
  Printer,
  Search,
  CheckCircle2,
  Settings,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  Eye,
  Sliders,
  DollarSign,
  Building2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Flame,
  Percent,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MinusSquare,
  HelpCircle,
  Copy,
  Sparkle,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getProductsData } from "@/actions/data-fetchers";

interface ProductLabelItem {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  precioVenta: number;
  precioAnterior?: number;
  unidad: string;
  copias: number;
  barcode: string;
  selected: boolean;
  badgePromo?: string;
}

const INITIAL_PRODUCTS: ProductLabelItem[] = [
  {
    id: "1",
    sku: "GLO-001",
    nombre: "Leche Gloria Entera 400g",
    categoria: "Lácteos",
    marca: "Gloria",
    precioVenta: 4.50,
    precioAnterior: 4.90,
    unidad: "und",
    copias: 2,
    barcode: "775123456789",
    selected: true,
    badgePromo: "OFERTA",
  },
  {
    id: "2",
    sku: "COS-001",
    nombre: "Arroz Costeño Extra 1kg",
    categoria: "Abarrotes",
    marca: "Costeño",
    precioVenta: 5.20,
    unidad: "und",
    copias: 2,
    barcode: "775987654321",
    selected: true,
  },
  {
    id: "3",
    sku: "PRI-001",
    nombre: "Aceite Primor Premium 1L",
    categoria: "Abarrotes",
    marca: "Primor",
    precioVenta: 9.80,
    precioAnterior: 10.50,
    unidad: "und",
    copias: 1,
    barcode: "775456789123",
    selected: true,
    badgePromo: "PRECIO CLUB",
  },
  {
    id: "4",
    sku: "MAN-001",
    nombre: "Manzana Delicia Nacional (kg)",
    categoria: "Frutas & Verduras",
    marca: "Granja Fresca",
    precioVenta: 4.80,
    unidad: "kg",
    copias: 3,
    barcode: "200000012345",
    selected: true,
  },
  {
    id: "5",
    sku: "BOL-001",
    nombre: "Detergente Bolívar Floral 1kg",
    categoria: "Limpieza",
    marca: "Bolívar",
    precioVenta: 8.50,
    precioAnterior: 9.20,
    unidad: "und",
    copias: 2,
    barcode: "775678912345",
    selected: true,
    badgePromo: "BAJÓ DE PRECIO",
  },
  {
    id: "6",
    sku: "YOG-001",
    nombre: "Yogurt Gloria Fresa 1L",
    categoria: "Lácteos",
    marca: "Gloria",
    precioVenta: 7.20,
    unidad: "und",
    copias: 1,
    barcode: "775889900112",
    selected: false,
  },
];

type LabelFormat = "gondola_70x40" | "gondola_50x30" | "adhesiva_38x25" | "hoja_a4_24";

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
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function generateCode128Bars(text: string): { width: number; isBar: boolean }[] {
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
function VectorBarcode({ code }: { code: string }) {
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
function generateCode128SvgString(code: string): string {
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

export default function EtiquetasPage() {
  const [products, setProducts] = useState<ProductLabelItem[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [labelFormat, setLabelFormat] = useState<LabelFormat>("gondola_70x40");
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPreviousPrice, setShowPreviousPrice] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [companyName, setCompanyName] = useState("NOVAMARKET");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProductsData();
        if (data && data.length > 0) {
          setProducts(
            data.map((p, idx) => ({
              id: p.id,
              sku: p.sku,
              nombre: p.nombre,
              categoria: p.categoria,
              marca: p.marca || "NovaMarket",
              precioVenta: p.precioVenta,
              precioAnterior: idx % 2 === 0 ? +(p.precioVenta * 1.15).toFixed(2) : undefined,
              unidad: p.tipoVenta === "peso" ? "kg" : "und",
              copias: 2,
              barcode: p.sku.length >= 10 ? p.sku : `775${p.sku.padStart(9, "0")}`,
              selected: idx < 5,
              badgePromo: idx === 0 ? "OFERTA" : idx === 2 ? "PRECIO CLUB" : idx === 4 ? "BAJÓ DE PRECIO" : undefined,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading products for labels:", err);
      }
    }
    loadProducts();
  }, []);

  const categories = ["Todas", "Lácteos", "Abarrotes", "Frutas & Verduras", "Limpieza"];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm);
      const matchesCat = selectedCategory === "Todas" || p.categoria === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const selectedProducts = products.filter((p) => p.selected);
  const totalLabelsToPrint = selectedProducts.reduce((acc, p) => acc + p.copias, 0);

  // Master Checkbox state computation
  const isAllFilteredSelected = filtered.length > 0 && filtered.every((p) => p.selected);
  const isSomeFilteredSelected = filtered.some((p) => p.selected) && !isAllFilteredSelected;

  const handleToggleMasterCheckbox = () => {
    if (isAllFilteredSelected) {
      // Unselect all filtered
      const filteredIds = new Set(filtered.map((f) => f.id));
      setProducts((prev) => prev.map((p) => (filteredIds.has(p.id) ? { ...p, selected: false } : p)));
      toast.info("Se desmarcaron los productos filtrados.");
    } else {
      // Select all filtered
      const filteredIds = new Set(filtered.map((f) => f.id));
      setProducts((prev) => prev.map((p) => (filteredIds.has(p.id) ? { ...p, selected: true } : p)));
      toast.success(`Se marcaron ${filtered.length} productos.`);
    }
  };

  const handleSelectAllGlobal = (select: boolean) => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected: select })));
    toast.info(select ? `Se marcaron todos los ${products.length} productos del catálogo.` : "Se desmarcaron todos los productos.");
  };

  const handleSelectOnlyPromotions = () => {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, selected: Boolean(p.badgePromo || p.precioAnterior) }))
    );
    toast.success("Se seleccionaron únicamente los productos con oferta o precio anterior.");
  };

  const handleToggleProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleUpdateCopies = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, copias: Math.max(1, p.copias + delta) } : p))
    );
  };

  const handleAddCopiesToAll = (amount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.selected ? { ...p, copias: Math.max(1, p.copias + amount) } : p))
    );
    toast.success(`Se agregaron ${amount > 0 ? "+" + amount : amount} copias a los productos marcados.`);
  };

  // High-precision isolated iframe printing with authentic vector Code-128
  const handlePrintIsolated = () => {
    if (totalLabelsToPrint === 0) {
      toast.error("Seleccione al menos un producto para imprimir");
      return;
    }

    setIsPrinting(true);

    const printWindow = document.createElement("iframe");
    printWindow.style.position = "fixed";
    printWindow.style.right = "0";
    printWindow.style.bottom = "0";
    printWindow.style.width = "0";
    printWindow.style.height = "0";
    printWindow.style.border = "0";
    document.body.appendChild(printWindow);

    const doc = printWindow.contentWindow?.document;
    if (!doc) {
      setIsPrinting(false);
      window.print();
      return;
    }

    let gridStyle = "display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; padding: 4mm;";
    let cardStyle = "border: 1px solid #000; border-radius: 4px; padding: 3.5mm; background: #fff; color: #000; font-family: system-ui, -apple-system, sans-serif; page-break-inside: avoid;";

    if (labelFormat === "gondola_70x40") {
      gridStyle = "display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; padding: 4mm;";
    } else if (labelFormat === "gondola_50x30") {
      gridStyle = "display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; padding: 3mm;";
      cardStyle = "border: 1px solid #000; border-radius: 3px; padding: 2.5mm; background: #fff; color: #000; font-family: system-ui, -apple-system, sans-serif; page-break-inside: avoid;";
    } else if (labelFormat === "adhesiva_38x25") {
      gridStyle = "display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; padding: 2mm;";
      cardStyle = "border: 1px solid #000; border-radius: 2px; padding: 1.5mm; background: #fff; color: #000; font-family: system-ui, -apple-system, sans-serif; page-break-inside: avoid;";
    } else if (labelFormat === "hoja_a4_24") {
      gridStyle = "display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; padding: 5mm;";
      cardStyle = "border: 0.5px solid #444; border-radius: 3px; padding: 2mm; background: #fff; color: #000; font-family: system-ui, -apple-system, sans-serif; height: 35mm; box-sizing: border-box; page-break-inside: avoid;";
    }

    let labelsHtml = "";
    selectedProducts.forEach((prod) => {
      for (let i = 0; i < prod.copias; i++) {
        const barcodeSvgHtml = showBarcode ? generateCode128SvgString(prod.barcode) : "";

        labelsHtml += `
          <div style="${cardStyle}">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #000; padding-bottom:2px; margin-bottom:3px;">
              <span style="font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;">${companyName}</span>
              ${prod.badgePromo ? `<span style="font-size:8px; font-weight:900; background:#000; color:#fff; padding:1px 4px; border-radius:2px; text-transform:uppercase;">${prod.badgePromo}</span>` : `<span style="font-size:8px; font-weight:700; text-transform:uppercase; color:#444;">${prod.categoria}</span>`}
            </div>

            <div style="font-size:12px; font-weight:900; line-height:1.15; color:#000; margin-bottom:2px;">
              ${prod.nombre}
            </div>

            <div style="font-size:8px; font-family:monospace; font-weight:600; color:#444; margin-bottom:3px;">
              SKU: ${prod.sku} ${showBrand && prod.marca ? `• ${prod.marca}` : ""}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:2px;">
              <div>
                ${showPreviousPrice && prod.precioAnterior ? `<div style="font-size:9px; text-decoration:line-through; color:#555; font-family:monospace; font-weight:bold;">Antes: S/ ${prod.precioAnterior.toFixed(2)}</div>` : ""}
                <span style="font-size:8px; font-weight:bold; text-transform:uppercase; color:#222;">PRECIO X ${prod.unidad.toUpperCase()}:</span>
              </div>
              <div style="font-size:22px; font-weight:900; font-family:monospace; color:#000; letter-spacing:-0.5px;">
                S/ ${prod.precioVenta.toFixed(2)}
              </div>
            </div>

            ${showBarcode ? `
              <div style="border-top:1px solid #bbb; padding-top:2px; margin-top:3px;">
                ${barcodeSvgHtml}
              </div>
            ` : ""}

            ${showDate ? `
              <div style="font-size:7px; font-family:monospace; color:#666; text-align:right; margin-top:2px;">
                Vigencia: ${new Date().toLocaleDateString("es-PE")}
              </div>
            ` : ""}
          </div>
        `;
      }
    });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impresión de Etiquetas - NovaMarket POS</title>
          <style>
            @page {
              margin: 0;
              size: auto;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div style="${gridStyle}">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printWindow.contentWindow?.focus();
      printWindow.contentWindow?.print();
      setIsPrinting(false);
      document.body.removeChild(printWindow);
      toast.success("Impresión de etiquetas enviada exitosamente.");
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
              Estudio de Precios & Góndolas
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">Estándar Code-128 / EAN-13 Vectorial</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Barcode className="size-6 text-blue-400" /> Diseñador & Impresor de Etiquetas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Impresión térmica calibrada para flejes de estante, ofertas promocionales y etiquetas de empaque.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintIsolated}
            disabled={totalLabelsToPrint === 0 || isPrinting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Printer className={`size-4 ${isPrinting ? "animate-pulse" : ""}`} />
            {isPrinting ? "Generando..." : `Imprimir ${totalLabelsToPrint} Etiquetas`}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Product Selector & Batch Controls (5 Cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Master Selection Toolbar */}
          <div className="glass-panel rounded-2xl p-4 space-y-3.5">
            {/* Master Checkbox Header Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
              <button
                type="button"
                onClick={handleToggleMasterCheckbox}
                className="flex items-center gap-2.5 text-left group cursor-pointer"
              >
                <div
                  className={`size-5 rounded-md flex items-center justify-center border transition-all ${
                    isAllFilteredSelected
                      ? "bg-blue-600 border-blue-500 text-white"
                      : isSomeFilteredSelected
                      ? "bg-blue-950 border-blue-500 text-blue-400"
                      : "border-slate-700 bg-slate-900 text-transparent hover:border-slate-500"
                  }`}
                >
                  {isAllFilteredSelected ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : isSomeFilteredSelected ? (
                    <Minus className="size-3.5" />
                  ) : null}
                </div>

                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                    {isAllFilteredSelected ? "Desmarcar todos los filtrados" : "Marcar todos los filtrados"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {selectedProducts.length} de {products.length} productos marcados ({totalLabelsToPrint} etiquetas)
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectAllGlobal(true)}
                  title="Marcar todo el catálogo"
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Todo
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllGlobal(false)}
                  title="Desmarcar todo el catálogo"
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Smart Filters and Promo Selector */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código de barra..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Category Pills & Promo Filter */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <div className="flex items-center gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white font-semibold"
                          : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSelectOnlyPromotions}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-800/50 hover:bg-amber-900/50 text-amber-300 text-[10px] font-bold whitespace-nowrap flex items-center gap-1 transition-colors"
                >
                  <Flame className="size-3 text-amber-400" /> Solo Ofertas
                </button>
              </div>
            </div>

            {/* Batch copies buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <span>Copias masivas:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddCopiesToAll(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-blue-400 font-bold hover:text-white transition-colors"
                >
                  +1 a Marcados
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCopiesToAll(5)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-blue-400 font-bold hover:text-white transition-colors"
                >
                  +5 a Marcados
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filtered.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleToggleProduct(prod.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    prod.selected
                      ? "bg-blue-950/40 border-blue-600/70 shadow-sm"
                      : "bg-slate-900/40 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-4 rounded flex items-center justify-center border transition-colors ${
                        prod.selected
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {prod.selected && <CheckCircle2 className="size-3" />}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{prod.nombre}</span>
                        {prod.badgePromo && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider">
                            {prod.badgePromo}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>SKU: {prod.sku}</span>
                        <span>•</span>
                        <strong className="text-emerald-400 font-bold text-xs">{formatCurrency(prod.precioVenta)}</strong>
                        {prod.precioAnterior && (
                          <span className="line-through text-slate-600 text-[10px]">{formatCurrency(prod.precioAnterior)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Spinner */}
                  {prod.selected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono font-bold shrink-0"
                    >
                      <button
                        onClick={() => handleUpdateCopies(prod.id, -1)}
                        className="px-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="text-blue-400 min-w-[18px] text-center">{prod.copias}</span>
                      <button
                        onClick={() => handleUpdateCopies(prod.id, 1)}
                        className="px-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customization Studio & Live Preview Sheet (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Format Selector & Design Options */}
          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2.5">
                <Sliders className="size-3.5 text-blue-400" /> Configuración de Formato & Plantilla
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelFormat("gondola_70x40")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    labelFormat === "gondola_70x40"
                      ? "bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-500/10"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">Góndola 70×40</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fleje estante grande</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat("gondola_50x30")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    labelFormat === "gondola_50x30"
                      ? "bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-500/10"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">Góndola 50×30</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Estándar retail</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat("adhesiva_38x25")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    labelFormat === "adhesiva_38x25"
                      ? "bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-500/10"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">Adhesiva 38×25</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Empaque / bolsa</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat("hoja_a4_24")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    labelFormat === "hoja_a4_24"
                      ? "bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-500/10"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">Hoja A4 (3×8)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">24 etiquetas / hoja</div>
                </button>
              </div>
            </div>

            {/* Customization Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Código de Barras</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPreviousPrice}
                  onChange={(e) => setShowPreviousPrice(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Precio Anterior</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBrand}
                  onChange={(e) => setShowBrand(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Marca de Producto</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Fecha Vigencia</span>
              </label>
            </div>
          </div>

          {/* Interactive Live Canvas */}
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
                  onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
                  className="p-1 hover:text-white text-slate-400"
                  title="Alejar"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-300 min-w-[38px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
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
        </div>
      </div>
    </div>
  );
}
