"use client";
import { useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthContext";
import { normalizePhone, formatPhoneDisplay } from "@/lib/phone";

interface PromesseInput {
  id: number;
  nom: string;
  telephone: string;
  error?: string;
  success?: boolean;
}

interface FormData {
  nom: string;
  telephone: string;
  genre: "M" | "F" | "";
  roleParticipant: "joueur" | "spectateur" | "staff";
  promesses: PromesseInput[];
}

function SaisieContent() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>({
    nom: "",
    telephone: "",
    genre: "",
    roleParticipant: "spectateur",
    promesses: [{ id: 1, nom: "", telephone: "" }],
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error" | "doublon";
    message: string;
    details?: string[];
  } | null>(null);

  const addPromesse = () => {
    setForm((f) => ({
      ...f,
      promesses: [
        ...f.promesses,
        { id: Date.now(), nom: "", telephone: "" },
      ],
    }));
  };

  const removePromesse = (id: number) => {
    setForm((f) => ({
      ...f,
      promesses: f.promesses.filter((p) => p.id !== id),
    }));
  };

  const updatePromesse = (id: number, field: "nom" | "telephone", value: string) => {
    setForm((f) => ({
      ...f,
      promesses: f.promesses.map((p) =>
        p.id === id ? { ...p, [field]: value, error: undefined } : p
      ),
    }));
  };

  const checkDuplicate = useCallback(async (id: number, tel: string) => {
    const norm = normalizePhone(tel);
    if (!norm || norm.length < 8) return;

    try {
      const res = await fetch(
        `/api/pointage?telephone=${encodeURIComponent(norm)}`
      );
      const data = await res.json();
      if (data.type === "promesse") {
        setForm((f) => ({
          ...f,
          promesses: f.promesses.map((p) =>
            p.id === id
              ? {
                  ...p,
                  error: `⚠️ Déjà promis par ${data.recruteur?.nom ?? "un autre recruteur"}`,
                }
              : p
          ),
        }));
      } else if (data.type === "spontane_deja_enregistre") {
        setForm((f) => ({
          ...f,
          promesses: f.promesses.map((p) =>
            p.id === id
              ? { ...p, error: "⚠️ Ce numéro est déjà enregistré comme donneur spontané" }
              : p
          ),
        }));
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.telephone || !form.genre) return;
    setSubmitting(true);
    setResult(null);

    const promessesData = form.promesses
      .filter((p) => p.nom.trim() && p.telephone.trim())
      .map((p) => ({ nom: p.nom.trim(), telephone: p.telephone.trim() }));

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim(),
          telephone: form.telephone.trim(),
          genre: form.genre,
          roleParticipant: form.roleParticipant,
          promessesData,
          benevoleId: user?.id,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.error === "doublon_recruteur") {
        setResult({
          type: "doublon",
          message: data.message,
        });
      } else if (!res.ok) {
        setResult({
          type: "error",
          message: data.error ?? "Erreur lors de l'enregistrement",
        });
      } else {
        const details: string[] = [];
        if (data.promessesCreees?.length > 0) {
          details.push(
            `✅ ${data.promessesCreees.length} promesse(s) enregistrée(s)`
          );
        }
        if (data.promessesEchecs?.length > 0) {
          for (const e of data.promessesEchecs) {
            details.push(`⚠️ ${e.nom} : ${e.raison}`);
          }
        }
        setResult({
          type: "success",
          message: `Recruteur "${data.participant.nom}" enregistré avec succès !`,
          details,
        });
        // Reset form
        setForm({
          nom: "",
          telephone: "",
          genre: "",
          roleParticipant: "spectateur",
          promesses: [{ id: Date.now(), nom: "", telephone: "" }],
        });
      }
    } catch (err) {
      setResult({ type: "error", message: "Erreur réseau" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* En-tête */}
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: "var(--cds-bleu-nuit)" }}
      >
        <h1 className="text-xl font-black uppercase tracking-wide">
          ✏️ Saisie Recruteur
        </h1>
        <p className="text-blue-200 text-sm mt-1">
          📅 Journée du 27 Août — Enregistrement des promesses
        </p>
        <p className="text-xs text-blue-300 mt-2 leading-relaxed">
          Confirmez oralement que chaque personne promise a donné son accord pour être contactée.
        </p>
      </div>

      {/* Résultat */}
      {result && (
        <div
          className={`rounded-xl p-4 animate-slide-up ${
            result.type === "success"
              ? "bg-green-50 border border-green-200"
              : result.type === "doublon"
              ? "bg-orange-50 border border-orange-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`font-bold text-sm ${
              result.type === "success"
                ? "text-green-700"
                : result.type === "doublon"
                ? "text-orange-700"
                : "text-red-700"
            }`}
          >
            {result.message}
          </p>
          {result.details?.map((d, i) => (
            <p key={i} className="text-xs text-gray-600 mt-1">
              {d}
            </p>
          ))}
          <button
            onClick={() => setResult(null)}
            className="mt-2 text-xs underline text-gray-500"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Infos recruteur */}
        <div className="card space-y-4">
          <h2
            className="font-bold text-sm uppercase tracking-wide"
            style={{ color: "var(--cds-bleu-nuit)" }}
          >
            👤 Informations du Recruteur
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex : Ouédraogo Ibrahim"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Téléphone *
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="Ex : 70 12 34 56"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              required
            />
            {form.telephone && (
              <p className="text-xs text-gray-400 mt-1">
                Normalisé : {normalizePhone(form.telephone) || "—"}
              </p>
            )}
          </div>

          {/* Équipe */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              {form.roleParticipant === "staff" ? "Genre *" : "Équipe *"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, genre: "M" })}
                className={`h-14 rounded-xl border-2 font-bold text-sm transition-all ${
                  form.genre === "M"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-blue-600 border-blue-200 hover:border-blue-400"
                }`}
              >
                🧑 Garçons
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, genre: "F" })}
                className={`h-14 rounded-xl border-2 font-bold text-sm transition-all ${
                  form.genre === "F"
                    ? "text-white border-transparent"
                    : "bg-white border-yellow-200 hover:border-yellow-400"
                }`}
                style={
                  form.genre === "F"
                    ? { backgroundColor: "var(--cds-or)", color: "var(--cds-bleu-nuit)" }
                    : { color: "var(--cds-or)" }
                }
              >
                👩 Filles
              </button>
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Statut
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["spectateur", "joueur", "staff"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, roleParticipant: r })}
                  className={`h-10 rounded-lg border-2 font-semibold text-xs transition-all capitalize ${
                    form.roleParticipant === r
                      ? "border-gray-700 bg-gray-800 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {r === "joueur"
                    ? "⚽ Joueur"
                    : r === "spectateur"
                    ? "👁️ Spectateur"
                    : "🎯 Staff"}
                </button>
              ))}
            </div>
            {form.roleParticipant === "staff" && (
              <p
                className="text-xs mt-2 rounded-lg p-2"
                style={{
                  backgroundColor: "rgba(201,162,39,0.1)",
                  color: "#7a5c00",
                }}
              >
                🎯 Staff mobilisation : ses recrutements comptent dans
                l&apos;objectif global mais pas dans le match Garçons vs Filles.
              </p>
            )}
          </div>
        </div>

        {/* Promesses */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="font-bold text-sm uppercase tracking-wide"
              style={{ color: "var(--cds-bleu-nuit)" }}
            >
              📝 Personnes Promises ({form.promesses.length})
            </h2>
            <button
              type="button"
              onClick={addPromesse}
              className="text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: "rgba(201,162,39,0.15)",
                color: "var(--cds-or)",
              }}
            >
              + Ajouter
            </button>
          </div>

          <div className="space-y-4">
            {form.promesses.map((p, idx) => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  p.error
                    ? "border-red-300 bg-red-50"
                    : p.success
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500">
                    Personne {idx + 1}
                  </span>
                  {form.promesses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePromesse(p.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕ Retirer
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nom complet"
                    value={p.nom}
                    onChange={(e) =>
                      updatePromesse(p.id, "nom", e.target.value)
                    }
                    autoComplete="off"
                  />
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="Téléphone (Ex: 70 12 34 56)"
                    value={p.telephone}
                    onChange={(e) =>
                      updatePromesse(p.id, "telephone", e.target.value)
                    }
                    onBlur={(e) => checkDuplicate(p.id, e.target.value)}
                  />

                  {p.error && (
                    <div
                      className="rounded-lg p-2 text-xs font-semibold"
                      style={{
                        backgroundColor: "rgba(214,69,69,0.1)",
                        color: "var(--cds-alerte)",
                      }}
                    >
                      {p.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton soumettre */}
        <button
          type="submit"
          disabled={
            submitting ||
            !form.nom.trim() ||
            !form.telephone ||
            !form.genre
          }
          className="btn-primary w-full text-lg"
        >
          {submitting ? (
            <>⏳ Enregistrement…</>
          ) : (
            <>💾 Enregistrer le Recruteur</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Saisi par : {user?.prenom ?? "Inconnu"}
        </p>
      </form>
    </div>
  );
}

export default function SaisiePage() {
  return (
    <AppShell>
      <SaisieContent />
    </AppShell>
  );
}
