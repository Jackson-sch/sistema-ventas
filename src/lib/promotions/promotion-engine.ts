/**
 * Motor de Promociones, Combos y Fidelización de Puntos (Loyalty)
 * Calcula descuentos en tiempo real para 2x1, 3x2, descuentos por volumen, combos y puntos de fidelidad.
 */

export interface PromotionRule {
  id: string;
  nombre: string;
  tipo: "2x1" | "3x2" | "volumen" | "combo" | "porcentaje";
  productoSkuPrincipal: string;
  productoSkuSecundario?: string; // Para combos (ej. Gaseosa + Snack)
  minCantidad?: number; // Para volumen (ej. >= 3)
  precioPromocional?: number; // Para combos o volumen
  descuentoPorcentaje?: number; // Ej. 20% de descuento
  activo: boolean;
  descripcion: string;
}

export interface CartItemWithPromo {
  id: string;
  sku: string;
  nombre: string;
  precioOriginal: number;
  precioFinalUnitario: number;
  cantidad: number;
  tipo: "unidad" | "peso";
  descuentoTotalItem: number;
  promoAplicada?: string;
  total: number;
}

export interface PromoCalculationResult {
  items: CartItemWithPromo[];
  totalBruto: number;
  totalAhorroPromociones: number;
  totalPuntosAplicadosDescuento: number;
  puntosAcumuladosVenta: number;
  totalNeto: number;
}

export const DEMO_PROMOTIONS: PromotionRule[] = [
  {
    id: "promo-1",
    nombre: "Promo 2x1 en Bebidas Rehidratantes",
    tipo: "2x1",
    productoSkuPrincipal: "7750106001124", // Sporade / Gatorade
    activo: true,
    descripcion: "Llévate 2 y paga 1 en rehidratantes seleccionados",
  },
  {
    id: "promo-2",
    nombre: "Promo 3x2 en Snacks & Galletas",
    tipo: "3x2",
    productoSkuPrincipal: "7751234567890", // Galletas Soda
    activo: true,
    descripcion: "3ra unidad GRATIS en galletas familiares",
  },
  {
    id: "promo-3",
    nombre: "Descuento por Volumen (>= 3 unidades)",
    tipo: "volumen",
    productoSkuPrincipal: "7750001002003", // Aceite Primor 1L
    minCantidad: 3,
    precioPromocional: 8.2, // Precio normal 9.50 -> a 8.20 c/u
    activo: true,
    descripcion: "Lleva 3 o más botellas de aceite a S/ 8.20 c/u (Ahorra S/ 1.30 c/u)",
  },
  {
    id: "promo-4",
    nombre: "Combo Parrillero (Carne + Gaseosa)",
    tipo: "combo",
    productoSkuPrincipal: "7759876543210", // Pack Carne
    productoSkuSecundario: "7754443332221", // Coca Cola 3L
    precioPromocional: 32.0, // Ahorro especial
    activo: true,
    descripcion: "Combo Parrillero Carne + Gaseosa 3L por solo S/ 32.00",
  },
];

export class PromotionEngine {
  private promotions: PromotionRule[] = DEMO_PROMOTIONS;

  public getActivePromotions(): PromotionRule[] {
    return this.promotions.filter((p) => p.activo);
  }

  public addPromotion(rule: PromotionRule) {
    this.promotions.push(rule);
  }

  public togglePromotion(id: string) {
    this.promotions = this.promotions.map((p) =>
      p.id === id ? { ...p, activo: !p.activo } : p
    );
  }

  /**
   * Evalúa el carrito de compras y calcula descuentos automáticos
   */
  public evaluateCart(
    rawCart: Array<{
      id: string;
      sku: string;
      nombre: string;
      precio: number;
      cantidad: number;
      tipo: "unidad" | "peso";
    }>,
    puntosCanjeados: number = 0
  ): PromoCalculationResult {
    let totalBruto = 0;
    let totalAhorro = 0;

    const evaluatedItems: CartItemWithPromo[] = rawCart.map((item) => {
      const itemSubtotal = item.precio * item.cantidad;
      totalBruto += itemSubtotal;

      const promo = this.promotions.find(
        (p) => p.activo && p.productoSkuPrincipal === item.sku
      );

      if (!promo) {
        return {
          id: item.id,
          sku: item.sku,
          nombre: item.nombre,
          precioOriginal: item.precio,
          precioFinalUnitario: item.precio,
          cantidad: item.cantidad,
          tipo: item.tipo,
          descuentoTotalItem: 0,
          total: +(itemSubtotal).toFixed(2),
        };
      }

      let descuentoItem = 0;
      let promoTag = "";

      if (promo.tipo === "2x1" && item.cantidad >= 2) {
        // En 2x1: Por cada 2 unidades, 1 es gratis
        const pairs = Math.floor(item.cantidad / 2);
        descuentoItem = pairs * item.precio;
        promoTag = `Promo 2x1 (-S/ ${descuentoItem.toFixed(2)})`;
      } else if (promo.tipo === "3x2" && item.cantidad >= 3) {
        // En 3x2: Por cada 3 unidades, 1 es gratis
        const trios = Math.floor(item.cantidad / 3);
        descuentoItem = trios * item.precio;
        promoTag = `Promo 3x2 (-S/ ${descuentoItem.toFixed(2)})`;
      } else if (
        promo.tipo === "volumen" &&
        promo.minCantidad &&
        item.cantidad >= promo.minCantidad &&
        promo.precioPromocional
      ) {
        // Descuento por volumen
        const ahorroPorUnidad = item.precio - promo.precioPromocional;
        if (ahorroPorUnidad > 0) {
          descuentoItem = ahorroPorUnidad * item.cantidad;
          promoTag = `Pack Volumen (-S/ ${descuentoItem.toFixed(2)})`;
        }
      } else if (promo.tipo === "porcentaje" && promo.descuentoPorcentaje) {
        descuentoItem = (itemSubtotal * promo.descuentoPorcentaje) / 100;
        promoTag = `-${promo.descuentoPorcentaje}% Promo (-S/ ${descuentoItem.toFixed(2)})`;
      }

      totalAhorro += descuentoItem;
      const finalItemTotal = +(itemSubtotal - descuentoItem).toFixed(2);
      const finalUnitPrice = +(finalItemTotal / item.cantidad).toFixed(2);

      return {
        id: item.id,
        sku: item.sku,
        nombre: item.nombre,
        precioOriginal: item.precio,
        precioFinalUnitario: finalUnitPrice,
        cantidad: item.cantidad,
        tipo: item.tipo,
        descuentoTotalItem: +descuentoItem.toFixed(2),
        promoAplicada: promoTag || undefined,
        total: finalItemTotal,
      };
    });

    // Descuento por Puntos de Fidelidad (10 puntos = S/ 1.00)
    const totalPuntosDescuento = +(puntosCanjeados / 10).toFixed(2);

    const totalConPromos = +(totalBruto - totalAhorro).toFixed(2);
    const totalNeto = Math.max(0, +(totalConPromos - totalPuntosDescuento).toFixed(2));

    // Acumulación: 1 punto por cada S/ 10 netos gastados
    const puntosAcumuladosVenta = Math.floor(totalNeto / 10);

    return {
      items: evaluatedItems,
      totalBruto: +totalBruto.toFixed(2),
      totalAhorroPromociones: +totalAhorro.toFixed(2),
      totalPuntosAplicadosDescuento: totalPuntosDescuento,
      puntosAcumuladosVenta,
      totalNeto,
    };
  }
}

export const promotionEngine = new PromotionEngine();
