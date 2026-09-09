"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTenantSettingsData, saveTenantSettingsAction } from "@/actions/tenant-actions";

import { ConfigPageHeader, ConfigTab } from "@/components/configuracion/tabs/config-page-header";
import { EmpresaTab } from "@/components/configuracion/tabs/empresa-tab";
import { SunatTab } from "@/components/configuracion/tabs/sunat-tab";
import { PosTab } from "@/components/configuracion/tabs/pos-tab";
import { PuntosTab } from "@/components/configuracion/tabs/puntos-tab";
import { DatabaseTab } from "@/components/configuracion/tabs/database-tab";
import { SeriesManager } from "@/components/configuracion/series-manager";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("empresa");

  // Empresa form state
  const [ruc, setRuc] = useState("10737997630");
  const [razonSocial, setRazonSocial] = useState("JUAN CARLOS PEREZ GOMEZ");
  const [nombreComercial, setNombreComercial] = useState("NovaMarket Retail");
  const [direccionFiscal, setDireccionFiscal] = useState("Av. Javier Prado Este 4200 - Surco - Lima");
  const [telefono, setTelefono] = useState("(01) 619-8000");
  const [emailContacto, setEmailContacto] = useState("contacto@novamarket.pe");

  // POS policies state
  const [limiteGaveta, setLimiteGaveta] = useState("1200");
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [beepScanner, setBeepScanner] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState("15");

  // Loyalty points state
  const [montoPorPunto, setMontoPorPunto] = useState("10.00");
  const [puntosMinimosCanje, setPuntosMinimosCanje] = useState("50");
  const [descuentoPorCanje, setDescuentoPorCanje] = useState("10.00");

  useEffect(() => {
    getTenantSettingsData()
      .then((data) => {
        if (data.ruc) setRuc(data.ruc);
        if (data.razonSocial) setRazonSocial(data.razonSocial);
        if (data.nombreComercial) setNombreComercial(data.nombreComercial);
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const handleSaveAll = async () => {
    const result = await saveTenantSettingsAction({
      razonSocial,
      ruc,
      nombreComercial,
      telefono,
      email: emailContacto,
    });
    if (result.success) {
      toast.success("¡Parámetros del sistema guardados exitosamente!", {
        description: "Todos los cambios han sido sincronizados con el servidor y los terminales POS.",
      });
    } else {
      toast.error(result.error || "Error al guardar configuración");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      <ConfigPageHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSaveAll}
      />

      {activeTab === "empresa" && (
        <EmpresaTab
          ruc={ruc}
          onRucChange={setRuc}
          razonSocial={razonSocial}
          onRazonSocialChange={setRazonSocial}
          nombreComercial={nombreComercial}
          onNombreComercialChange={setNombreComercial}
          direccionFiscal={direccionFiscal}
          onDireccionFiscalChange={setDireccionFiscal}
          telefono={telefono}
          onTelefonoChange={setTelefono}
          emailContacto={emailContacto}
          onEmailContactoChange={setEmailContacto}
        />
      )}

      {activeTab === "sunat" && (
        <SunatTab
          ruc={ruc}
          razonSocial={razonSocial}
          nombreComercial={nombreComercial}
          direccionFiscal={direccionFiscal}
        />
      )}

      {activeTab === "series" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
          <SeriesManager />
        </div>
      )}

      {activeTab === "pos" && (
        <PosTab
          limiteGaveta={limiteGaveta}
          onLimiteGavetaChange={setLimiteGaveta}
          inactivityTimeout={inactivityTimeout}
          onInactivityTimeoutChange={setInactivityTimeout}
          autoPrintTicket={autoPrintTicket}
          onAutoPrintTicketChange={setAutoPrintTicket}
          beepScanner={beepScanner}
          onBeepScannerChange={setBeepScanner}
        />
      )}

      {activeTab === "puntos" && (
        <PuntosTab
          montoPorPunto={montoPorPunto}
          onMontoPorPuntoChange={setMontoPorPunto}
          puntosMinimosCanje={puntosMinimosCanje}
          onPuntosMinimosCanjeChange={setPuntosMinimosCanje}
          descuentoPorCanje={descuentoPorCanje}
          onDescuentoPorCanjeChange={setDescuentoPorCanje}
        />
      )}

      {activeTab === "database" && <DatabaseTab />}
    </div>
  );
}
