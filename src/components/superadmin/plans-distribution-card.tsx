"use client";

import { Crown, Sparkles, Zap, Shield, CheckCircle2 } from "lucide-react";

interface PlansDistributionCardProps {
  distribution: {
    starter: number;
    pro: number;
    enterprise: number;
  };
}

export function PlansDistributionCard({ distribution }: PlansDistributionCardProps) {
  const total = distribution.starter + distribution.pro + distribution.enterprise || 1;

  const starterPct = Math.round((distribution.starter / total) * 100);
  const proPct = Math.round((distribution.pro / total) * 100);
  const enterprisePct = Math.round((distribution.enterprise / total) * 100);

  return (
    <div className="p-5 rounded-3xl bg-[hsl(224,71%,4%)] border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <Crown className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              Distribución de Suscripciones SaaS
            </h3>
            <p className="text-[11px] text-slate-400">Desglose por categoría de plan contratado</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Starter Plan */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Starter</span>
            <span className="text-xs font-mono font-bold text-slate-300">$49/m</span>
          </div>
          <div className="text-2xl font-black font-mono text-white">{distribution.starter}</div>
          <div className="text-[10px] text-slate-500">{starterPct}% del total</div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-slate-500 h-1.5 rounded-full" style={{ width: `${starterPct}%` }}></div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-900/40 bg-blue-950/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-blue-400">Pro</span>
            <span className="text-xs font-mono font-bold text-blue-300">$149/m</span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">{distribution.pro}</div>
          <div className="text-[10px] text-blue-300/70">{proPct}% del total</div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${proPct}%` }}></div>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-900/40 bg-amber-950/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-400">Enterprise</span>
            <span className="text-xs font-mono font-bold text-amber-300">$299/m+</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{distribution.enterprise}</div>
          <div className="text-[10px] text-amber-300/70">{enterprisePct}% del total</div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${enterprisePct}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
