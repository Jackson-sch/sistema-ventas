"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { getBranchesAndRegistersData } from "@/actions/data-fetchers";
import {
  createStockTransferAction,
  TransferRecord,
  TransferItemInput,
} from "@/actions/transfer-actions";
import { TransferBranchSelector } from "@/components/inventario/transferencias/nueva/transfer-branch-selector";
import { TransferTransportCard } from "@/components/inventario/transferencias/nueva/transfer-transport-card";
import {
  TransferProductPicker,
  TransferCartItem,
} from "@/components/inventario/transferencias/nueva/transfer-product-picker";
import { TransferItemsTable } from "@/components/inventario/transferencias/nueva/transfer-items-table";
import { TransferSummarySidebar } from "@/components/inventario/transferencias/nueva/transfer-summary-sidebar";
import { GreTicketDialog } from "@/components/inventario/gre-ticket-dialog";

export default function NuevaTransferenciaPage() {
  const router = useRouter();

  // Branch data
  const [branches, setBranches] = useState<any[]>([]);
  const [sucursalOrigenId, setSucursalOrigenId] = useState("");
  const [sucursalDestinoId, setSucursalDestinoId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Cart Items
  const [cartItems, setCartItems] = useState<TransferCartItem[]>([]);

  // Transfer & Transport metadata
  const [motivoTraslado, setMotivoTraslado] = useState<"04" | "01" | "02" | "13">("04");
  const [modalidadTransporte, setModalidadTransporte] = useState<"02" | "01">("02");
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split("T")[0]);

  // Private Transport Details
  const [choferNombre, setChoferNombre] = useState("Jorge Huamán Díaz");
  const [choferDoc, setChoferDoc] = useState("45891234");
  const [choferLicencia, setChoferLicencia] = useState("Q45891234");
  const [vehiculoPlaca, setVehiculoPlaca] = useState("ABC-123");
  const [vehiculoMarca, setVehiculoMarca] = useState("Camión Isuzu");

  // Public Transport Details
  const [transportistaRuc, setTransportistaRuc] = useState("20556677889");
  const [transportistaRazonSocial, setTransportistaRazonSocial] = useState(
    "TRANSPORTE LOGÍSTICO PERÚ S.A.C."
  );

  // Submission & Ticket Dialog
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTransfer, setCreatedTransfer] = useState<TransferRecord | null>(null);
  const [isGreTicketOpen, setIsGreTicketOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const branchesData = await getBranchesAndRegistersData();
        if (branchesData && branchesData.length > 0) {
          setBranches(branchesData);
          setSucursalOrigenId(branchesData[0].id);
          setSucursalDestinoId(branchesData[1]?.id || branchesData[0].id);
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleSwapBranches = useCallback(() => {
    setSucursalOrigenId((prevOrig) => {
      setSucursalDestinoId(prevOrig);
      return sucursalDestinoId;
    });
  }, [sucursalDestinoId]);

  const handleAddItem = useCallback((item: TransferCartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productoId === item.productoId);
      if (existing) {
        return prev.map((i) =>
          i.productoId === item.productoId ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [item, ...prev];
    });
    toast.success(`"${item.nombre}" añadido al despacho.`);
  }, []);

  const handleUpdateQty = useCallback((productoId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.productoId !== productoId) return i;
        return { ...i, cantidad: Math.max(1, i.cantidad + delta) };
      })
    );
  }, []);

  const handleSetQty = useCallback((productoId: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: qty } : i))
    );
  }, []);

  const handleSetWeight = useCallback((productoId: string, weight: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, pesoUnitarioKgm: weight } : i))
    );
  }, []);

  const handleRemoveItem = useCallback((productoId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Debe agregar al menos un producto a la transferencia.");
      return;
    }
    if (sucursalOrigenId === sucursalDestinoId) {
      toast.error("La sucursal de origen y destino deben ser distintas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orig = branches.find((b) => b.id === sucursalOrigenId);
      const dest = branches.find((b) => b.id === sucursalDestinoId);

      const payloadItems: TransferItemInput[] = cartItems.map((i) => ({
        productoId: i.productoId,
        sku: i.sku,
        nombre: i.nombre,
        cantidad: i.cantidad,
        unidadMedida: i.unidadMedida,
        pesoKgm: i.pesoUnitarioKgm,
      }));

      const res = await createStockTransferAction({
        sucursalOrigenId,
        sucursalOrigenNombre: orig?.nombre,
        direccionOrigen: orig?.direccion,
        sucursalDestinoId,
        sucursalDestinoNombre: dest?.nombre || "Sucursal Destino",
        direccionDestino: dest?.direccion,
        motivoTraslado,
        modalidadTransporte,
        conductor:
          modalidadTransporte === "02"
            ? {
                tipoDoc: "1",
                numDoc: choferDoc,
                nombres: choferNombre,
                apellidos: "",
                licenciaConducir: choferLicencia,
              }
            : undefined,
        vehiculo:
          modalidadTransporte === "02"
            ? {
                placa: vehiculoPlaca,
                marca: vehiculoMarca,
              }
            : undefined,
        transportista:
          modalidadTransporte === "01"
            ? {
                ruc: transportistaRuc,
                razonSocial: transportistaRazonSocial,
              }
            : undefined,
        items: payloadItems,
      });

      if (res.success && res.transfer) {
        toast.success(`¡Guía de Remisión ${res.transfer.codigoGuia} emitida con éxito!`, {
          description: `Traslado registrado en Kardex. Peso total: ${res.transfer.pesoBrutoKgm} KGM.`,
        });
        setCreatedTransfer(res.transfer);
        setIsGreTicketOpen(true);
      } else {
        toast.error(res.error || "Error al emitir la transferencia.");
      }
    } catch {
      toast.error("Error de conexión al procesar la transferencia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 bg-[hsl(224,71%,4%)]">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white font-mono">
          Cargando configuración de sucursales...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/inventario/transferencias"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1.5"
          >
            <ArrowLeft className="size-3.5" /> Volver al Historial de Transferencias
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="size-6 text-blue-400" /> Nueva Transferencia & Guía de Remisión
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traslado entre sucursales conforme a normativa SUNAT (UBL 2.1 - Formato GRE Remitente)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sede Origen & Destino Selector */}
          <TransferBranchSelector
            branches={branches}
            sucursalOrigenId={sucursalOrigenId}
            onOrigenChange={setSucursalOrigenId}
            sucursalDestinoId={sucursalDestinoId}
            onDestinoChange={setSucursalDestinoId}
            onSwap={handleSwapBranches}
          />

          {/* Transport & Conductor Details */}
          <TransferTransportCard
            motivoTraslado={motivoTraslado}
            onMotivoChange={setMotivoTraslado}
            modalidadTransporte={modalidadTransporte}
            onModalidadChange={setModalidadTransporte}
            fechaSalida={fechaSalida}
            onFechaSalidaChange={setFechaSalida}
            choferNombre={choferNombre}
            onChoferNombreChange={setChoferNombre}
            choferDoc={choferDoc}
            onChoferDocChange={setChoferDoc}
            choferLicencia={choferLicencia}
            onChoferLicenciaChange={setChoferLicencia}
            vehiculoPlaca={vehiculoPlaca}
            onVehiculoPlacaChange={setVehiculoPlaca}
            vehiculoMarca={vehiculoMarca}
            onVehiculoMarcaChange={setVehiculoMarca}
            transportistaRuc={transportistaRuc}
            onTransportistaRucChange={setTransportistaRuc}
            transportistaRazonSocial={transportistaRazonSocial}
            onTransportistaRazonSocialChange={setTransportistaRazonSocial}
          />

          {/* Product Picker & Dispatch Table */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Productos a Despachar
                </h3>
                <p className="text-[11px] text-slate-400">
                  Agregue los ítems y ajuste pesos unitarios para la guía electrónica
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
                {cartItems.length} seleccionados
              </span>
            </div>

            <TransferProductPicker onAddItem={handleAddItem} />

            <TransferItemsTable
              items={cartItems}
              onUpdateQty={handleUpdateQty}
              onSetQty={handleSetQty}
              onSetWeight={handleSetWeight}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>

        {/* Right Sidebar (1 col) */}
        <div className="space-y-6">
          <TransferSummarySidebar
            items={cartItems}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Ticket GRE Dialog Modal */}
      {createdTransfer && (
        <GreTicketDialog
          isOpen={isGreTicketOpen}
          onClose={() => {
            setIsGreTicketOpen(false);
            router.push("/inventario/transferencias");
          }}
          transfer={createdTransfer}
        />
      )}
    </div>
  );
}
