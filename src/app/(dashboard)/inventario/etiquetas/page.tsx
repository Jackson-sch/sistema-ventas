"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Barcode,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { getProductsData } from "@/actions/data-fetchers";

import { ProductLabelItem, LabelFormat } from "@/components/inventario/etiquetas/types";
import { generateCode128SvgString } from "@/components/inventario/etiquetas/barcode-utils";
import { EtiquetasProductSelector } from "@/components/inventario/etiquetas/etiquetas-product-selector";
import { EtiquetasSettingsPanel } from "@/components/inventario/etiquetas/etiquetas-settings-panel";
import { EtiquetasLivePreview } from "@/components/inventario/etiquetas/etiquetas-live-preview";

export default function EtiquetasPage() {
  const [products, setProducts] = useState<ProductLabelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [labelFormat, setLabelFormat] = useState<LabelFormat>("gondola_70x40");
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPreviousPrice, setShowPreviousPrice] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [companyName] = useState("NOVAMARKET");
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
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

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

  const isAllFilteredSelected = filtered.length > 0 && filtered.every((p) => p.selected);
  const isSomeFilteredSelected = filtered.some((p) => p.selected) && !isAllFilteredSelected;

  const handleToggleMasterCheckbox = () => {
    const filteredIds = new Set(filtered.map((f) => f.id));
    if (isAllFilteredSelected) {
      setProducts((prev) => prev.map((p) => (filteredIds.has(p.id) ? { ...p, selected: false } : p)));
      toast.info("Se desmarcaron los productos filtrados.");
    } else {
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
        <EtiquetasProductSelector
          products={products}
          filtered={filtered}
          selectedProducts={selectedProducts}
          totalLabelsToPrint={totalLabelsToPrint}
          isAllFilteredSelected={isAllFilteredSelected}
          isSomeFilteredSelected={isSomeFilteredSelected}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onSelectedCategoryChange={setSelectedCategory}
          onToggleMasterCheckbox={handleToggleMasterCheckbox}
          onSelectAllGlobal={handleSelectAllGlobal}
          onSelectOnlyPromotions={handleSelectOnlyPromotions}
          onToggleProduct={handleToggleProduct}
          onUpdateCopies={handleUpdateCopies}
          onAddCopiesToAll={handleAddCopiesToAll}
        />

        {/* Right Column: Customization Studio & Live Preview Sheet (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          <EtiquetasSettingsPanel
            labelFormat={labelFormat}
            onLabelFormatChange={setLabelFormat}
            showBarcode={showBarcode}
            onShowBarcodeChange={setShowBarcode}
            showPreviousPrice={showPreviousPrice}
            onShowPreviousPriceChange={setShowPreviousPrice}
            showBrand={showBrand}
            onShowBrandChange={setShowBrand}
            showDate={showDate}
            onShowDateChange={setShowDate}
          />

          <EtiquetasLivePreview
            selectedProducts={selectedProducts}
            totalLabelsToPrint={totalLabelsToPrint}
            labelFormat={labelFormat}
            companyName={companyName}
            showBarcode={showBarcode}
            showPreviousPrice={showPreviousPrice}
            showBrand={showBrand}
            showDate={showDate}
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
          />
        </div>
      </div>
    </div>
  );
}
