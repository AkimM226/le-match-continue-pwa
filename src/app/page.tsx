"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import ScoreCard from "@/components/ScoreCard";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

interface DashboardData {
  config: {
    scoreBonusGarcons: number;
    scoreBonusFilles: number;
    objectifGlobal: number;
  };
  garcons: {
    recruteurs: number;
    promesses_total: number;
    presente: number;
    recruteurs_presents: number;
    en_attente: number;
    en_litige: number;
    score: number;
  };
  filles: {
    recruteurs: number;
    promesses_total: number;
    presente: number;
    recruteurs_presents: number;
    en_attente: number;
    en_litige: number;
    score: number;
  };
  spontanes: number;
  totalPresents: number;
  objectifGlobal: number;
}

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  useEffect(() => {
    if (!seeded) {
      fetch("/api/seed", { method: "POST" }).then(() => {
        setSeeded(true);
        fetchDashboard();
      });
    }
  }, [seeded, fetchDashboard]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl animate-heartbeat">🩸</div>
        <div className="space-y-2 text-center">
          <p className="font-bold" style={{ color: "var(--cds-bleu-nuit)" }}>
            Chargement du tableau de bord…
          </p>
          <p className="text-xs text-gray-400">Récupération des données en cours</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-10 animate-fade-in">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-red-500 font-semibold">Impossible de charger les données.</p>
        <p className="text-xs text-gray-400 mt-1">Vérifiez votre connexion</p>
        <button onClick={fetchDashboard} className="btn-primary mt-5 text-sm">
          🔄 Réessayer
        </button>
      </div>
    );
  }

  const totalLitiges = data.garcons.en_litige + data.filles.en_litige;
  const totalPromesses = data.garcons.promesses_total + data.filles.promesses_total;
  const totalPresences =
    data.garcons.presente +
    data.filles.presente +
    data.garcons.recruteurs_presents +
    data.filles.recruteurs_presents;
  const totalRecruteurs = data.garcons.recruteurs + data.filles.recruteurs;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Header section ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-xl font-black uppercase tracking-wide"
            style={{ color: "var(--cds-bleu-nuit)" }}
          >
            Tableau de Bord
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Bonjour <span className="font-semibold text-gray-600">{user?.prenom}</span>
            {lastRefresh && (
              <> · MAJ {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost text-xs px-3"
          style={{ minHeight: "36px", fontSize: "0.75rem" }}
        >
          <span className={refreshing ? "animate-spin inline-block" : ""}>🔄</span>
          {refreshing ? " …" : " Actualiser"}
        </button>
      </div>

      {/* ── Alerte litiges ── */}
      {totalLitiges > 0 && user?.role === "organisateur" && (
        <div
          className="rounded-xl p-4 flex items-center justify-between animate-pop-in"
          style={{
            background: "linear-gradient(135deg, rgba(214,69,69,0.08), rgba(214,69,69,0.04))",
            border: "1px solid rgba(214,69,69,0.25)",
          }}
        >
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--cds-alerte)" }}>
              ⚠️ {totalLitiges} promesse{totalLitiges > 1 ? "s" : ""} en litige
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Arbitrage requis avant le calcul final
            </p>
          </div>
          <Link href="/admin" className="btn-danger text-xs px-3 py-2" style={{ minHeight: "36px", fontSize: "0.75rem" }}>
            Arbitrer →
          </Link>
        </div>
      )}

      {/* ── Scores ── */}
      <ScoreCard
        garcons={data.garcons}
        filles={data.filles}
        bonusGarcons={data.config.scoreBonusGarcons}
        bonusFilles={data.config.scoreBonusFilles}
        totalPresents={data.totalPresents}
        objectifGlobal={data.objectifGlobal}
      />

      {/* ── Quick Stats row ── */}
      <div>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--cds-bleu-nuit)" }}
        >
          📊 Statistiques
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <StatMiniCard
            emoji="🧑"
            label="Recruteurs"
            value={totalRecruteurs}
            sub={`${data.garcons.recruteurs}G · ${data.filles.recruteurs}F`}
            color="rgba(43,136,216,0.1)"
            textColor="var(--cds-bleu-ciel)"
          />
          <StatMiniCard
            emoji="📝"
            label="Promesses"
            value={totalPromesses}
            sub="enregistrées"
            color="rgba(201,162,39,0.1)"
            textColor="var(--cds-or)"
          />
          <StatMiniCard
            emoji="✅"
            label="Présences"
            value={totalPresences}
            sub="confirmées"
            color="rgba(34,197,94,0.1)"
            textColor="var(--cds-vert)"
            highlight
          />
          <StatMiniCard
            emoji="🏃"
            label="Spontanés"
            value={data.spontanes}
            sub="donneurs"
            color="rgba(43,136,216,0.08)"
            textColor="var(--cds-bleu-ciel)"
          />
          {totalLitiges > 0 && (
            <StatMiniCard
              emoji="⚠️"
              label="En litige"
              value={totalLitiges}
              sub="à arbitrer"
              color="rgba(214,69,69,0.1)"
              textColor="var(--cds-alerte)"
              danger
            />
          )}
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--cds-bleu-nuit)" }}
        >
          ⚡ Actions rapides
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            href="/saisie"
            emoji="✏️"
            label="Saisir Recruteur"
            sub="Enregistrement J1"
            accentColor="var(--cds-bleu-ciel)"
          />
          <ActionCard
            href="/pointage"
            emoji="🏥"
            label="Pointage Donneur"
            sub="Don de sang J2"
            accentColor="var(--cds-vert)"
          />
          <ActionCard
            href="/public"
            emoji="📺"
            label="Vue Publique"
            sub="Affichage événement"
            accentColor="var(--cds-or)"
          />
          {user?.role === "organisateur" && (
            <ActionCard
              href="/admin"
              emoji="⚙️"
              label="Administration"
              sub="Config & export"
              accentColor="var(--cds-bleu-nuit)"
            />
          )}
        </div>
      </div>

      {/* ── Event banner ── */}
      <div
        className="rounded-2xl p-5 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--cds-bleu-nuit) 0%, #0e2d5c 60%, #142f6a 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--cds-or), transparent)" }}
        />
        <div
          className="absolute bottom-[-20px] left-[-20px] w-20 h-20 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--cds-bleu-ciel), transparent)" }}
        />
        <div className="relative z-10">
          <p className="animate-heartbeat inline-block text-2xl mb-2">🩸</p>
          <p
            className="font-bold text-sm tracking-wide uppercase"
            style={{ color: "var(--cds-or)" }}
          >
            Journée Don de Sang
          </p>
          <p className="text-white font-black text-2xl mt-1 tracking-wide">
            28 Août 2026
          </p>
          <div
            className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(196,224,255,0.9)",
            }}
          >
            📍 Stand CRTS · Bobo-Dioulasso
          </div>
          <p
            className="text-xs mt-3 font-semibold"
            style={{ color: "rgba(201,162,39,0.9)" }}
          >
            Objectif : {data.objectifGlobal} donneurs effectifs
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Composants utilitaires ── */

function StatMiniCard({
  emoji,
  label,
  value,
  sub,
  color,
  textColor,
  highlight,
  danger,
}: {
  emoji: string;
  label: string;
  value: number;
  sub: string;
  color: string;
  textColor: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="stat-card">
      <div
        className="stat-card-icon"
        style={{ background: color }}
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="stat-card-label truncate">{label}</p>
        <p className="stat-card-value" style={{ color: danger ? "var(--cds-alerte)" : highlight ? "var(--cds-vert-dark)" : "var(--cds-bleu-nuit)" }}>
          {value}
        </p>
        <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{sub}</p>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  emoji,
  label,
  sub,
  accentColor,
}: {
  href: string;
  emoji: string;
  label: string;
  sub: string;
  accentColor: string;
}) {
  return (
    <Link
      href={href}
      className="card-interactive flex flex-col items-center text-center py-5 no-underline gap-1.5 group"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-1 transition-transform group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          border: `1px solid ${accentColor}25`,
        }}
      >
        {emoji}
      </div>
      <p
        className="font-bold text-sm leading-tight"
        style={{ color: "var(--cds-bleu-nuit)" }}
      >
        {label}
      </p>
      <p className="text-gray-400" style={{ fontSize: "0.7rem" }}>
        {sub}
      </p>
    </Link>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
