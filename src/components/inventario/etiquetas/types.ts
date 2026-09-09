export interface ProductLabelItem {
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

export type LabelFormat = "gondola_70x40" | "gondola_50x30" | "adhesiva_38x25" | "hoja_a4_24";

export const LABEL_FORMATS: { key: LabelFormat; label: string; description: string }[] = [
  { key: "gondola_70x40", label: "Góndola 70×40", description: "Fleje estante grande" },
  { key: "gondola_50x30", label: "Góndola 50×30", description: "Estándar retail" },
  { key: "adhesiva_38x25", label: "Adhesiva 38×25", description: "Empaque / bolsa" },
  { key: "hoja_a4_24", label: "Hoja A4 (3×8)", description: "24 etiquetas / hoja" },
];

export const CATEGORIES = ["Todas", "Lácteos", "Abarrotes", "Frutas & Verduras", "Limpieza"];
