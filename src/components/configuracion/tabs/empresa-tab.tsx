"use client";

interface EmpresaTabProps {
  ruc: string;
  onRucChange: (v: string) => void;
  razonSocial: string;
  onRazonSocialChange: (v: string) => void;
  nombreComercial: string;
  onNombreComercialChange: (v: string) => void;
  direccionFiscal: string;
  onDireccionFiscalChange: (v: string) => void;
  telefono: string;
  onTelefonoChange: (v: string) => void;
  emailContacto: string;
  onEmailContactoChange: (v: string) => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500";

export function EmpresaTab({
  ruc,
  onRucChange,
  razonSocial,
  onRazonSocialChange,
  nombreComercial,
  onNombreComercialChange,
  direccionFiscal,
  onDireccionFiscalChange,
  telefono,
  onTelefonoChange,
  emailContacto,
  onEmailContactoChange,
}: EmpresaTabProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
      <div className="pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-white tracking-tight">Identidad & Datos Fiscales</h3>
        <p className="text-xs text-slate-400">Esta información se imprime en el encabezado de los tickets térmicos y facturas electrónicas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">R.U.C. de la Empresa *</label>
          <input
            type="text"
            value={ruc}
            onChange={(e) => onRucChange(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Razón Social Registrada *</label>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => onRazonSocialChange(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Comercial</label>
          <input
            type="text"
            value={nombreComercial}
            onChange={(e) => onNombreComercialChange(e.target.value)}
            className={`${inputClass} text-slate-200`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dirección Fiscal de la Sede Principal *</label>
          <input
            type="text"
            value={direccionFiscal}
            onChange={(e) => onDireccionFiscalChange(e.target.value)}
            className={`${inputClass} text-slate-200`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teléfono Central / WhatsApp</label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => onTelefonoChange(e.target.value)}
            className={`${inputClass} text-slate-200`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico de Contacto</label>
          <input
            type="email"
            value={emailContacto}
            onChange={(e) => onEmailContactoChange(e.target.value)}
            className={`${inputClass} text-slate-200`}
          />
        </div>
      </div>
    </div>
  );
}
