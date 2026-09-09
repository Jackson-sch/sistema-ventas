/**
 * Shared application constants.
 * Import from here instead of hardcoding values across components.
 */

// ── Tax ────────────────────────────────────────────────────────────────
/** IGV rate (18%) used across POS, purchases, orders, quotations, reports */
export const IGV_RATE = 0.18;

/** IGV percentage as a display string */
export const IGV_RATE_LABEL = "18%";

// ── Payment Conditions ─────────────────────────────────────────────────
export type PaymentConditionLabel =
  | "Contado"
  | "Crédito 15 días"
  | "Crédito 30 días"
  | "Crédito 60 días";

export const PAYMENT_CONDITIONS: { value: PaymentConditionLabel; label: string }[] = [
  { value: "Contado", label: "Contado / Efectivo" },
  { value: "Crédito 15 días", label: "Crédito 15 días" },
  { value: "Crédito 30 días", label: "Crédito 30 días" },
  { value: "Crédito 60 días", label: "Crédito 60 días" },
];

export const DEFAULT_PAYMENT_CONDITION: PaymentConditionLabel = "Crédito 30 días";

// ── Currency ───────────────────────────────────────────────────────────
export const CURRENCY_SYMBOL = "S/";

// ── SUNAT Defaults ─────────────────────────────────────────────────────
export const SUNAT_DEFAULTS = {
  usuarioSol: "MODDATOS",
  claveSol: "MODDATOS",
  certVencimiento: "15/12/2027",
  tasaIgv: "18",
  tasaIcbper: "0.50",
} as const;

// ── POS Defaults ───────────────────────────────────────────────────────
export const POS_DEFAULTS = {
  quickAmounts: [10, 20, 50, 100, 200],
  defaultQuantity: "10",
  defaultCost: "10.00",
  defaultLotePrefix: "L",
  defaultVencYearsAhead: 2,
} as const;

// ── Quotation Defaults ─────────────────────────────────────────────────
export const QUOTATION_DEFAULTS = {
  validityDays: 15,
  defaultObservations:
    "Precios incluyen I.G.V. (18%). Cotización sujeta a disponibilidad de stock al momento de la confirmación.",
} as const;

// ── Labels ─────────────────────────────────────────────────────────────
export const APP_LABELS = {
  igtDisplay: `I.G.V. (${IGV_RATE_LABEL})`,
} as const;
