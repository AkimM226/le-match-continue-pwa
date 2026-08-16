"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

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
    en_attente: number;
    en_litige: number;
    score: number;
  };
  filles: {
    recruteurs: number;
    promesses_total: number;
    presente: number;
    en_attente: number;
    en_litige: number;
    score: number;
  };
  spontanes: number;
  totalPresents: number;
  objectifGlobal: number;
}

export default function PublicPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, 15000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, [fetchData]);

  const progressPercent = data
    ? Math.min(100, Math.round((data.totalPresents / data.objectifGlobal) * 100))
    : 0;

  const winner = data
    ? data.garcons.score > data.filles.score
      ? "garcons"
      : data.filles.score > data.garcons.score
      ? "filles"
      : "egalite"
    : "egalite";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--cds-bleu-nuit)" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-yellow-400">
            <Image
              src="/cds-logo.png"
              alt="CDS"
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h1
              className="text-2xl font-black uppercase tracking-wider"
              style={{ color: "var(--cds-or)" }}
            >
              Le Match Continue
            </h1>
            <p className="text-blue-300 text-sm">
              Capital du Savoir · Bobo-Dioulasso · 27-28 Août 2026
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white font-mono">
            {now.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <p className="text-blue-300 text-xs">
            {now.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-6">
        {/* Objectif */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black text-lg uppercase tracking-wide">
              🎯 Objectif Global — Don de Sang
            </h2>
            <div
              className="text-3xl font-black rounded-xl px-4 py-2"
              style={{ backgroundColor: "var(--cds-or)", color: "var(--cds-bleu-nuit)" }}
            >
              {data?.totalPresents ?? 0} / {data?.objectifGlobal ?? 50}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-8 overflow-hidden">
            <div
              className="h-8 rounded-full transition-all duration-1000 flex items-center justify-center"
              style={{
                width: `${progressPercent}%`,
                background:
                  progressPercent >= 100
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : progressPercent >= 60
                    ? "linear-gradient(90deg, #c9a227, #e8b84b)"
                    : "linear-gradient(90deg, #2b88d8, #1a6ec7)",
              }}
            >
              {progressPercent > 15 && (
                <span className="text-white font-black text-sm">
                  {progressPercent}%
                </span>
              )}
            </div>
          </div>
          <p className="text-blue-300 text-sm text-center mt-2">
            {data && data.objectifGlobal - data.totalPresents > 0
              ? `Plus que ${data.objectifGlobal - data.totalPresents} donneur(s) pour atteindre l'objectif !`
              : "🎉 Objectif atteint — Félicitations !"}
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-6 flex-1">
          {/* GARÇONS */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
              winner === "garcons" ? "ring-4 ring-blue-400" : ""
            }`}
            style={{
              background:
                winner === "garcons"
                  ? "linear-gradient(135deg, rgba(43,136,216,0.25), rgba(43,136,216,0.1))"
                  : "rgba(255,255,255,0.06)",
            }}
          >
            {winner === "garcons" && (
              <div className="text-center mb-2">
                <span className="bg-blue-500 text-white text-sm font-black px-4 py-1 rounded-full">
                  🏆 EN TÊTE
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-6xl mb-2">🧑</div>
              <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-4">
                Garçons
              </h3>

              <div className="space-y-3 text-left">
                <ScoreLine
                  label="Bonus match"
                  value={`+${data?.config.scoreBonusGarcons ?? 0}`}
                />
                <ScoreLine
                  label="Promesses"
                  value={data?.garcons.promesses_total ?? 0}
                />
                <ScoreLine
                  label="✅ Présents"
                  value={data?.garcons.presente ?? 0}
                  highlight
                />
              </div>

              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-blue-300 text-sm uppercase tracking-wider">
                  Score Total
                </p>
                <p
                  className="text-8xl font-black"
                  style={{ color: "var(--cds-bleu-ciel)" }}
                >
                  {data?.garcons.score ?? 0}
                </p>
                <p className="text-blue-300 text-sm">points</p>
              </div>
            </div>
          </div>

          {/* FILLES */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
              winner === "filles" ? "ring-4 ring-yellow-400" : ""
            }`}
            style={{
              background:
                winner === "filles"
                  ? "linear-gradient(135deg, rgba(201,162,39,0.25), rgba(201,162,39,0.1))"
                  : "rgba(255,255,255,0.06)",
            }}
          >
            {winner === "filles" && (
              <div className="text-center mb-2">
                <span
                  className="text-sm font-black px-4 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--cds-or)",
                    color: "var(--cds-bleu-nuit)",
                  }}
                >
                  🏆 EN TÊTE
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-6xl mb-2">👩</div>
              <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-4">
                Filles
              </h3>

              <div className="space-y-3 text-left">
                <ScoreLine
                  label="Bonus match"
                  value={`+${data?.config.scoreBonusFilles ?? 0}`}
                />
                <ScoreLine
                  label="Promesses"
                  value={data?.filles.promesses_total ?? 0}
                />
                <ScoreLine
                  label="✅ Présents"
                  value={data?.filles.presente ?? 0}
                  highlight
                />
              </div>

              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-blue-300 text-sm uppercase tracking-wider">
                  Score Total
                </p>
                <p
                  className="text-8xl font-black"
                  style={{ color: "var(--cds-or)" }}
                >
                  {data?.filles.score ?? 0}
                </p>
                <p className="text-blue-300 text-sm">points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatBox
            label="Donneurs spontanés"
            value={data?.spontanes ?? 0}
            emoji="🏃"
            color="#2b88d8"
          />
          <StatBox
            label="Total promesses"
            value={
              (data?.garcons.promesses_total ?? 0) +
              (data?.filles.promesses_total ?? 0)
            }
            emoji="📝"
            color="#c9a227"
          />
          <StatBox
            label="Présences confirmées"
            value={
              (data?.garcons.presente ?? 0) + (data?.filles.presente ?? 0)
            }
            emoji="✅"
            color="#22c55e"
          />
        </div>

        {/* Lien retour */}
        <div className="flex justify-between items-center">
          <p className="text-blue-400 text-xs">
            🩸 Rejoignez le mouvement — Don de sang gratuit et sans douleur
          </p>
          <Link href="/" className="text-xs text-blue-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScoreLine({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-blue-300 text-sm">{label}</span>
      <span
        className={`font-black text-lg ${
          highlight ? "text-green-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatBox({
  label,
  value,
  emoji,
  color,
}: {
  label: string;
  value: number;
  emoji: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-3xl font-black" style={{ color }}>
        {value}
      </div>
      <div className="text-blue-300 text-xs mt-1">{label}</div>
    </div>
  );
}
