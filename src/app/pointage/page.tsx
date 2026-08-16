"use client";
import { useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthContext";
import { normalizePhone, formatPhoneDisplay } from "@/lib/phone";

type SearchResult =
  | {
      type: "promesse";
      promesse: {
        id: string;
        nomPersonnePromise: string;
        telephonePersonnePromise: string;
        statut: string;
        timestampPointage?: string;
      };
      recruteur: {
        id: string;
        nom: string;
        genre: "M" | "F";
        telephone: string;
      } | null;
    }
  | {
      type: "recruteur";
      recruteur: {
        id: string;
        nom: string;
        genre: "M" | "F";
        telephone: string;
        roleParticipant: "joueur" | "spectateur";
        timestampPointage: string | null;
      };
    }
  | { type: "spontane_deja_enregistre"; spontane: { nom: string; telephone: string; timestampPointage: string } }
  | { type: "non_trouve"; telephone: string }
  | null;

function PointageContent() {
  const { user } = useAuth();
  const [telephone, setTelephone] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult>(null);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [spontaneNom, setSpontaneNom] = useState("");
  const [validating, setValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!telephone.trim()) return;
    setSearching(true);
    setResult(null);
    setActionMsg(null);
    setSpontaneNom("");

    const norm = normalizePhone(telephone);
    try {
      const res = await fetch(
        `/api/pointage?telephone=${encodeURIComponent(norm)}`
      );
      const data = await res.json();
      setResult(data as SearchResult);
    } catch {
      setActionMsg({ type: "error", msg: "Erreur réseau lors de la recherche" });
    } finally {
      setSearching(false);
    }
  };

  const handleValiderPresence = async () => {
    if (result?.type !== "promesse") return;
    setValidating(true);

    try {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "valider_presence",
          promesseId: result.promesse.id,
          telephone: telephone,
          benevoleId: user?.id,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setActionMsg({
          type: "error",
          msg: data.message ?? "Personne déjà pointée",
        });
      } else if (!res.ok) {
        setActionMsg({ type: "error", msg: data.error ?? "Erreur" });
      } else {
        setActionMsg({
          type: "success",
          msg: `✅ Présence confirmée ! Point accordé à l'équipe ${
            result.recruteur?.genre === "M" ? "Garçons 🧑" : "Filles 👩"
          }`,
        });
        setResult(null);
        setTelephone("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch {
      setActionMsg({ type: "error", msg: "Erreur réseau" });
    } finally {
      setValidating(false);
    }
  };

  const handleValiderPresenceRecruteur = async () => {
    if (result?.type !== "recruteur") return;
    setValidating(true);

    try {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "valider_presence_recruteur",
          participantId: result.recruteur.id,
          telephone: telephone,
          benevoleId: user?.id,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setActionMsg({
          type: "error",
          msg: data.message ?? "Recruteur déjà pointé",
        });
      } else if (!res.ok) {
        setActionMsg({ type: "error", msg: data.error ?? "Erreur" });
      } else {
        setActionMsg({
          type: "success",
          msg: `✅ Présence confirmée ! Point accordé à l'équipe ${
            result.recruteur.genre === "M" ? "Garçons 🧑" : "Filles 👩"
          }`,
        });
        setResult(null);
        setTelephone("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch {
      setActionMsg({ type: "error", msg: "Erreur réseau" });
    } finally {
      setValidating(false);
    }
  };

  const handleEnregistrerSpontane = async () => {
    if (!spontaneNom.trim()) return;
    setValidating(true);

    try {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enregistrer_spontane",
          telephone: telephone,
          nom: spontaneNom,
          benevoleId: user?.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionMsg({ type: "error", msg: data.message ?? data.error ?? "Erreur" });
      } else {
        setActionMsg({
          type: "success",
          msg: `✅ Donneur spontané "${spontaneNom}" enregistré ! (+1 objectif global)`,
        });
        setResult(null);
        setTelephone("");
        setSpontaneNom("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch {
      setActionMsg({ type: "error", msg: "Erreur réseau" });
    } finally {
      setValidating(false);
    }
  };

  const reset = () => {
    setTelephone("");
    setResult(null);
    setActionMsg(null);
    setSpontaneNom("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* En-tête */}
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: "var(--cds-bleu-nuit)" }}
      >
        <h1 className="text-xl font-black uppercase tracking-wide">
          🏥 Pointage Donneur
        </h1>
        <p className="text-blue-200 text-sm mt-1">
          📅 Journée du 28 Août — Don de Sang · Stand CRTS
        </p>
        <p className="text-xs text-blue-300 mt-2">
          Saisissez le numéro de téléphone de la personne qui se présente
        </p>
      </div>

      {/* Message succès / erreur */}
      {actionMsg && (
        <div
          className={`rounded-xl p-4 animate-slide-up flex items-start justify-between gap-3 ${
            actionMsg.type === "success"
              ? "bg-green-50 border border-green-300"
              : "bg-red-50 border border-red-300"
          }`}
        >
          <p
            className={`font-bold text-sm ${
              actionMsg.type === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {actionMsg.msg}
          </p>
          <button
            onClick={() => setActionMsg(null)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zone de recherche */}
      <div className="card space-y-4">
        <h2
          className="font-bold text-sm uppercase tracking-wide"
          style={{ color: "var(--cds-bleu-nuit)" }}
        >
          🔍 Recherche par Téléphone
        </h2>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="tel"
            className="input-field text-lg font-mono"
            placeholder="Numéro de téléphone"
            value={telephone}
            onChange={(e) => {
              setTelephone(e.target.value);
              setResult(null);
              setActionMsg(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={!telephone.trim() || searching}
            className="btn-secondary flex-shrink-0 px-4"
          >
            {searching ? "…" : "🔍"}
          </button>
        </div>

        {telephone && (
          <p className="text-xs text-gray-400">
            Normalisé : {normalizePhone(telephone) || "—"}
          </p>
        )}
      </div>

      {/* Résultat de la recherche */}
      {result && (
        <div className="animate-slide-up">
          {/* ── CAS A : Promesse trouvée ── */}
          {result.type === "promesse" && (
            <div
              className={`card border-2 ${
                result.promesse.statut === "presente"
                  ? "border-green-300"
                  : result.promesse.statut === "en_litige"
                  ? "border-orange-300"
                  : "border-blue-300"
              }`}
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">
                  {result.promesse.statut === "presente" ? "✅" : "📋"}
                </div>
                <h3 className="text-2xl font-black" style={{ color: "var(--cds-bleu-nuit)" }}>
                  {result.promesse.nomPersonnePromise}
                </h3>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  {formatPhoneDisplay(result.promesse.telephonePersonnePromise)}
                </p>
              </div>

              <div
                className={`rounded-xl p-3 mb-4 text-center ${
                  result.recruteur?.genre === "M"
                    ? "bg-blue-50 border border-blue-200"
                    : "border"
                }`}
                style={
                  result.recruteur?.genre === "F"
                    ? {
                        backgroundColor: "rgba(201,162,39,0.08)",
                        borderColor: "rgba(201,162,39,0.4)",
                      }
                    : {}
                }
              >
                <p className="text-xs text-gray-500 mb-1">Recruteur</p>
                <p className="font-bold text-sm">
                  {result.recruteur?.genre === "M" ? "🧑" : "👩"}{" "}
                  {result.recruteur?.nom ?? "Inconnu"}
                </p>
                <span
                  className={
                    result.recruteur?.genre === "M"
                      ? "badge-garcons"
                      : "badge-filles"
                  }
                >
                  Équipe {result.recruteur?.genre === "M" ? "Garçons" : "Filles"}
                </span>
              </div>

              {/* Statut */}
              {result.promesse.statut === "presente" && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
                  <p className="font-bold text-green-700">
                    ✅ Déjà pointée
                  </p>
                  {result.promesse.timestampPointage && (
                    <p className="text-xs text-gray-500 mt-1">
                      à{" "}
                      {new Date(result.promesse.timestampPointage).toLocaleTimeString("fr-FR")}
                    </p>
                  )}
                </div>
              )}

              {result.promesse.statut === "en_attente" && (
                <button
                  onClick={handleValiderPresence}
                  disabled={validating}
                  className="w-full btn-primary text-lg"
                  style={{ minHeight: "64px" }}
                >
                  {validating ? "⏳ Validation…" : "✅ Confirmer la Présence"}
                </button>
              )}

              {result.promesse.statut === "en_litige" && (
                <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 text-center">
                  <p className="font-bold text-orange-700">
                    ⚠️ Promesse en litige — arbitrage organisateur requis
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── CAS A bis : Recruteur trouvé ── */}
          {result.type === "recruteur" && (
            <div
              className={`card border-2 ${
                result.recruteur.timestampPointage
                  ? "border-green-300"
                  : "border-blue-300"
              }`}
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">
                  {result.recruteur.timestampPointage ? "✅" : "🧑‍🤝‍🧑"}
                </div>
                <h3 className="text-2xl font-black" style={{ color: "var(--cds-bleu-nuit)" }}>
                  {result.recruteur.nom}
                </h3>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  {formatPhoneDisplay(result.recruteur.telephone)}
                </p>
              </div>

              <div
                className={`rounded-xl p-3 mb-4 text-center ${
                  result.recruteur.genre === "M"
                    ? "bg-blue-50 border border-blue-200"
                    : "border"
                }`}
                style={
                  result.recruteur.genre === "F"
                    ? {
                        backgroundColor: "rgba(201,162,39,0.08)",
                        borderColor: "rgba(201,162,39,0.4)",
                      }
                    : {}
                }
              >
                <p className="text-xs text-gray-500 mb-1">
                  Recruteur ({result.recruteur.roleParticipant === "joueur" ? "Joueur" : "Spectateur"})
                </p>
                <span
                  className={
                    result.recruteur.genre === "M"
                      ? "badge-garcons"
                      : "badge-filles"
                  }
                >
                  Équipe {result.recruteur.genre === "M" ? "Garçons" : "Filles"}
                </span>
              </div>

              {result.recruteur.timestampPointage ? (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
                  <p className="font-bold text-green-700">✅ Déjà pointé</p>
                  <p className="text-xs text-gray-500 mt-1">
                    à{" "}
                    {new Date(result.recruteur.timestampPointage).toLocaleTimeString("fr-FR")}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleValiderPresenceRecruteur}
                  disabled={validating}
                  className="w-full btn-primary text-lg"
                  style={{ minHeight: "64px" }}
                >
                  {validating ? "⏳ Validation…" : "✅ Confirmer la Présence"}
                </button>
              )}
            </div>
          )}

          {/* ── CAS B : Déjà enregistré comme spontané ── */}
          {result.type === "spontane_deja_enregistre" && (
            <div className="card border-2 border-gray-200 text-center">
              <div className="text-4xl mb-3">ℹ️</div>
              <h3 className="font-bold text-gray-700">
                {result.spontane.nom}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Donneur spontané déjà enregistré
              </p>
              <p className="text-xs text-gray-400 mt-1">
                à{" "}
                {new Date(result.spontane.timestampPointage).toLocaleTimeString(
                  "fr-FR"
                )}
              </p>
            </div>
          )}

          {/* ── CAS C : Non trouvé ── */}
          {result.type === "non_trouve" && (
            <div className="card border-2 border-dashed border-gray-300 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">❓</div>
                <h3
                  className="font-bold"
                  style={{ color: "var(--cds-bleu-nuit)" }}
                >
                  Personne non trouvée
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Aucune promesse liée à ce numéro
                </p>
                <p className="font-mono text-sm text-gray-400 mt-1">
                  {formatPhoneDisplay(result.telephone)}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(43,136,216,0.06)",
                  border: "1px solid rgba(43,136,216,0.2)",
                }}
              >
                <p
                  className="font-bold text-sm mb-3"
                  style={{ color: "var(--cds-bleu-ciel)" }}
                >
                  Enregistrer comme Donneur Spontané
                </p>
                <input
                  type="text"
                  className="input-field mb-3"
                  placeholder="Nom complet du donneur"
                  value={spontaneNom}
                  onChange={(e) => setSpontaneNom(e.target.value)}
                  autoComplete="off"
                />
                <button
                  onClick={handleEnregistrerSpontane}
                  disabled={!spontaneNom.trim() || validating}
                  className="btn-secondary w-full"
                >
                  {validating
                    ? "⏳ Enregistrement…"
                    : "🏃 Enregistrer Donneur Spontané"}
                </button>
              </div>
            </div>
          )}

          {/* Bouton nouvelle recherche */}
          <button onClick={reset} className="btn-ghost w-full mt-3">
            🔄 Nouvelle Recherche
          </button>
        </div>
      )}

      {/* Aide rapide */}
      {!result && !actionMsg && (
        <div className="card">
          <h3
            className="font-bold text-sm uppercase tracking-wide mb-3"
            style={{ color: "var(--cds-bleu-nuit)" }}
          >
            📋 Guide Pointage
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-3">
              <span
                className="text-lg flex-shrink-0"
                aria-hidden="true"
              >
                📋
              </span>
              <div>
                <p className="font-semibold">Promesse trouvée</p>
                <p className="text-xs text-gray-400">
                  Appuyez sur "Confirmer la Présence" — le point est crédité à l'équipe du recruteur
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg flex-shrink-0">❓</span>
              <div>
                <p className="font-semibold">Personne non trouvée</p>
                <p className="text-xs text-gray-400">
                  Enregistrez comme donneur spontané — comptabilisé dans l'objectif global uniquement
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg flex-shrink-0">⏱️</span>
              <div>
                <p className="font-semibold">Objectif : &lt; 15 secondes</p>
                <p className="text-xs text-gray-400">
                  Saisie numéro → Validation → Personne suivante
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Pointé par : {user?.prenom ?? "Inconnu"}
      </p>
    </div>
  );
}

export default function PointagePage() {
  return (
    <AppShell>
      <PointageContent />
    </AppShell>
  );
}
