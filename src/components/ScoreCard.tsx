"use client";
import { useEffect, useRef } from "react";

interface TeamData {
  recruteurs: number;
  promesses_total: number;
  presente: number;
  recruteurs_presents: number;
  en_attente: number;
  en_litige: number;
  score: number;
}

interface Props {
  garcons: TeamData;
  filles: TeamData;
  bonusGarcons: number;
  bonusFilles: number;
  totalPresents: number;
  objectifGlobal: number;
}

/** Animated number counter hook */
function useCountUp(target: number, duration = 800) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = Date.now();
    const startVal = 0;
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startVal + (target - startVal) * ease);
      if (ref.current) ref.current.textContent = String(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return ref;
}

function ScoreNumber({ value, color }: { value: number; color: string }) {
  const ref = useCountUp(value, 900);
  return (
    <span
      ref={ref}
      className="text-4xl font-black animate-count-up"
      style={{ color }}
    >
      {value}
    </span>
  );
}

export default function ScoreCard({
  garcons,
  filles,
  bonusGarcons,
  bonusFilles,
  totalPresents,
  objectifGlobal,
}: Props) {
  const progressPercent = Math.min(
    100,
    Math.round((totalPresents / objectifGlobal) * 100)
  );

  const progressColor =
    progressPercent >= 100
      ? "#22c55e"
      : progressPercent >= 60
      ? "var(--cds-or)"
      : "var(--cds-bleu-ciel)";

  const winner =
    garcons.score > filles.score
      ? "garcons"
      : filles.score > garcons.score
      ? "filles"
      : "egalite";

  return (
    <div className="space-y-4">
      {/* ── Jauge globale ── */}
      <div className="card animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2
              className="font-black text-sm uppercase tracking-widest"
              style={{ color: "var(--cds-bleu-nuit)" }}
            >
              🎯 Objectif Global
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Mobilisation don de sang</p>
          </div>
          <div
            className="text-right px-3 py-1.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.06))",
              border: "1px solid rgba(201,162,39,0.25)",
            }}
          >
            <span
              className="text-lg font-black block leading-none animate-count-up"
              style={{ color: "var(--cds-or)" }}
            >
              {totalPresents}
            </span>
            <span className="text-xs text-gray-400">/ {objectifGlobal}</span>
          </div>
        </div>

        <div className="progress-track h-6">
          <div
            className="progress-fill h-6"
            style={{
              width: `${progressPercent}%`,
              background:
                progressPercent >= 100
                  ? "linear-gradient(90deg, #16a34a, #22c55e)"
                  : progressPercent >= 60
                  ? "linear-gradient(90deg, var(--cds-or), var(--cds-or-light))"
                  : "linear-gradient(90deg, var(--cds-bleu-nuit), var(--cds-bleu-ciel))",
            }}
          >
            {progressPercent > 12 && (
              <span className="text-white text-xs font-bold pr-2 relative z-10">
                {progressPercent}%
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {objectifGlobal - totalPresents > 0 ? (
            <>
              Encore{" "}
              <span className="font-bold" style={{ color: "var(--cds-bleu-ciel)" }}>
                {objectifGlobal - totalPresents}
              </span>{" "}
              donneurs pour atteindre l'objectif
            </>
          ) : (
            <span className="font-bold text-green-600 animate-pop-in">
              🎉 Félicitations — Objectif atteint !
            </span>
          )}
        </p>
      </div>

      {/* ── Scores Garçons vs Filles ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* GARÇONS */}
        <div
          className={`card relative overflow-hidden transition-all duration-300 ${
            winner === "garcons"
              ? "border-2 border-blue-400 animate-winner-glow-blue"
              : "border border-transparent"
          }`}
        >
          {/* Fond décoratif */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, var(--cds-bleu-ciel), transparent 70%)",
            }}
          />

          {winner === "garcons" && (
            <div
              className="absolute top-0 right-0 text-white text-xs font-bold px-2 py-1 rounded-bl-lg"
              style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}
            >
              🏆 MÈNE
            </div>
          )}

          <div className="relative text-center mb-3">
            <div
              className="text-3xl mb-1 inline-block"
              style={winner === "garcons" ? { animation: "heartbeat 1.8s ease-in-out infinite" } : {}}
            >
              🧑
            </div>
            <h3
              className="font-black text-base uppercase tracking-widest"
              style={{ color: "var(--cds-bleu-ciel)" }}
            >
              Garçons
            </h3>
          </div>

          <div className="relative space-y-1.5 text-sm">
            <StatLine label="Bonus match" value={`+${bonusGarcons}`} />
            <StatLine label="Promesses" value={garcons.promesses_total} />
            <StatLine
              label="✅ Présents"
              value={garcons.presente + garcons.recruteurs_presents}
              color="text-green-600"
            />
            {garcons.en_litige > 0 && (
              <StatLine label="⚠️ Litiges" value={garcons.en_litige} color="text-red-500" />
            )}
          </div>

          <div
            className="relative mt-3 pt-3 border-t text-center"
            style={{ borderColor: "rgba(43, 136, 216, 0.25)" }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Score</p>
            <ScoreNumber value={garcons.score} color="var(--cds-bleu-nuit)" />
            <p className="text-xs text-gray-300 mt-0.5">pts</p>
          </div>
        </div>

        {/* FILLES */}
        <div
          className={`card relative overflow-hidden transition-all duration-300 ${
            winner === "filles"
              ? "border-2 border-yellow-400 animate-winner-glow-or"
              : "border border-transparent"
          }`}
        >
          {/* Fond décoratif */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, var(--cds-or), transparent 70%)",
            }}
          />

          {winner === "filles" && (
            <div
              className="absolute top-0 right-0 text-white text-xs font-bold px-2 py-1 rounded-bl-lg"
              style={{ background: "linear-gradient(135deg, #92600a, var(--cds-or))" }}
            >
              🏆 MÈNE
            </div>
          )}

          <div className="relative text-center mb-3">
            <div
              className="text-3xl mb-1 inline-block"
              style={winner === "filles" ? { animation: "heartbeat 1.8s ease-in-out infinite" } : {}}
            >
              👩
            </div>
            <h3
              className="font-black text-base uppercase tracking-widest"
              style={{ color: "var(--cds-or)" }}
            >
              Filles
            </h3>
          </div>

          <div className="relative space-y-1.5 text-sm">
            <StatLine label="Bonus match" value={`+${bonusFilles}`} />
            <StatLine label="Promesses" value={filles.promesses_total} />
            <StatLine
              label="✅ Présents"
              value={filles.presente + filles.recruteurs_presents}
              color="text-green-600"
            />
            {filles.en_litige > 0 && (
              <StatLine label="⚠️ Litiges" value={filles.en_litige} color="text-red-500" />
            )}
          </div>

          <div
            className="relative mt-3 pt-3 border-t text-center"
            style={{ borderColor: "rgba(201, 162, 39, 0.25)" }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Score</p>
            <ScoreNumber value={filles.score} color="var(--cds-bleu-nuit)" />
            <p className="text-xs text-gray-300 mt-0.5">pts</p>
          </div>
        </div>
      </div>

      {winner === "egalite" && (
        <div
          className="text-center py-3 rounded-xl text-sm font-bold animate-pop-in"
          style={{
            background: "linear-gradient(135deg, rgba(43,136,216,0.08), rgba(43,136,216,0.04))",
            border: "1px solid rgba(43,136,216,0.2)",
            color: "var(--cds-bleu-ciel)",
          }}
        >
          ⚖️ Égalité parfaite — La prochaine présence fera la différence !
        </div>
      )}
    </div>
  );
}

function StatLine({
  label,
  value,
  color = "text-gray-800",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className={`font-bold text-sm ${color}`}>{value}</span>
    </div>
  );
}
