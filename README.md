# Sistema de Ventas & Facturación Electrónica POS (NovaMarket)

Sistema integral de Punto de Venta (POS) y Facturación Electrónica SUNAT UBL 2.1 con arquitectura SaaS Multi-Tenant desarrollado con **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS** y **Server Actions**.

---

## 🚀 Módulos y Capacidades

1. **Terminal POS Supermercado / Retail (Latencia 0ms)**:
   - Cobro rápido por teclado y lector de código de barras.
   - Balanza electrónica integrada (pesables en kg / gramaje).
   - Control de turno de caja (Aperturas, Movimientos X y Arqueos/Cierres Z).
   - Cobro mixto (Efectivo, Tarjeta POS, Yape, Plin, Transferencia).
   - Modo Offline con sincronización automática mediante IndexedDB.

2. **Facturación Electrónica SUNAT UBL 2.1**:
   - Emisión instantánea de Boletas de Venta Electrónicas (`B001`) y Facturas Electrónicas (`F001`).
   - Notas de Crédito y Anulaciones oficiales.
   - Resúmenes Diarios de Boletas (**RC**) y Comunicación de Bajas (**RA**).
   - Guías de Remisión Electrónicas (**GRE Remitente T001**).

3. **Impresión Térmica Directa ESC/POS por Hardware**:
   - Soporte para impresoras térmicas de 80mm y 58mm (Epson, Bixolon, Xprinter, 3nStar).
   - Conexión vía **WebUSB**, **Web Serial (COM / RS-232)** y **RawBT**.
   - Apertura automática de gaveta de dinero (`ESC p 0 25 250`) y auto-corte de papel (`GS V 66 0`).

4. **Motor de Promociones & Fidelización de Clientes (Loyalty)**:
   - Reglas automáticas en vivo: 2x1, 3x2, descuentos por volumen y combos.
   - Sistema de puntos de fidelidad por DNI con canje directo en caja.

5. **Consola Superadmin SaaS & Multi-Tenant**:
   - Monitoreo ejecutivo de MRR, suscripciones y telemetría SUNAT/DB en tiempo real.
   - Aprovisionamiento de nuevas empresas con validación en línea de RUC.

---

## 🛠️ Instalación y Despliegue

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jackson-sch/sistema-ventas.git

# 2. Instalar dependencias
pnpm install

# 3. Iniciar servidor de desarrollo
pnpm dev

# 4. Compilar para producción
pnpm next build --webpack
```
