/**
 * Canal de Comunicación en Tiempo Real para Pantalla Secundaria del Cliente (Pole / Customer Display)
 * Utiliza BroadcastChannel API para sincronización bidireccional local a 0ms de latencia.
 */

export interface CustomerDisplayItem {
  id: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  promoAplicada?: string;
}

export interface CustomerDisplayPayload {
  tipo: "UPDATE_CART" | "SALE_COMPLETED" | "STANDBY" | "CLEAR";
  cajaNombre?: string;
  cajeroNombre?: string;
  clienteNombre?: string;
  items?: CustomerDisplayItem[];
  subtotal?: number;
  igv?: number;
  ahorroPromociones?: number;
  descuentoPuntos?: number;
  puntosGanados?: number;
  total?: number;
  medioPago?: string;
  montoRecibido?: number;
  vuelto?: number;
  comprobante?: string;
}

const CHANNEL_NAME = "novamarket_pos_customer_display";

class CustomerDisplayChannel {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  public emit(payload: CustomerDisplayPayload) {
    if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  public subscribe(callback: (payload: CustomerDisplayPayload) => void): () => void {
    if (!this.channel) return () => {};

    const handler = (event: MessageEvent) => {
      callback(event.data);
    };

    this.channel.addEventListener("message", handler);
    return () => {
      this.channel?.removeEventListener("message", handler);
    };
  }

  public openCustomerWindow() {
    if (typeof window !== "undefined") {
      const width = 1024;
      const height = 768;
      const left = window.screen.width ? window.screen.width : 100;
      const top = 0;
      window.open(
        "/pos/display",
        "NovaMarketCustomerDisplay",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=no,resizable=yes`
      );
    }
  }
}

export const customerDisplayChannel = new CustomerDisplayChannel();
