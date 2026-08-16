"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthContext";
import { formatPhoneDisplay } from "@/lib/phone";

interface Litige {
  id: string;
  nomPersonnePromise: string;
  telephonePersonnePromise: string;
  recruteur: { nom: string; genre: "M" | "F" } | null;
  timestampEnregistrement: string;
}

interface Benevole {
  id: string;
  prenom: string;
  role: string;
  createdAt: string;
}

interface Config {
  scoreBonusGarcons: number;
  scoreBonusFilles: number;
  objectifGlobal: number;
}

function AdminContent() {
  const { user } = useAuth();
  const [config, setConfig] = useState<Config>({
    scoreBonusGarcons: 0,
    scoreBonusFilles: 0,
    objectifGlobal: 50,
  });
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [benevoles, setBenevoles] = useState<Benevole[]>([]);
  const [loading, setLoading] = useState(true);
  const [configMsg, setConfigMsg] = useState<string | null>(null);
  const [newBenevole, setNewBenevole] = useState({ prenom: "", pin: "", role: "benevole" });
  const [addingBenevole, setAddingBenevole] = useState(false);
  const [benevoleMsg, setBenevoleMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "litiges" | "benevoles">("config");

  // Guard: only organisateur
  if (user?.role !== "organisateur") {
    return (
      <div className="card text-center py-10">
        <div className="text-5xl mb-4">🔒</div>
        <p className="font-bold text-gray-700">Accès réservé à l'organisateur</p>
        <p className="text-sm text-gray-500 mt-2">
          Connectez-vous avec un compte organisateur
        </p>
      </div>
    );
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, litRes, benRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/litiges"),
        fetch("/api/benevoles"),
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (litRes.ok) setLitiges(await litRes.json());
      if (benRes.ok) setBenevoles(await benRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveConfig = async () => {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, benevoleId: user.id }),
    });
    if (res.ok) {
      setConfigMsg("✅ Configuration enregistrée");
      setTimeout(() => setConfigMsg(null), 3000);
    }
  };

  const resolveListige = async (id: string, decision: "valider" | "rejeter") => {
    const res = await fetch("/api/litiges", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promesseId: id, decision, benevoleId: user.id }),
    });
    if (res.ok) {
      setLitiges((l) => l.filter((x) => x.id !== id));
    }
  };

  const addBenevole = async () => {
    if (!newBenevole.prenom || !newBenevole.pin) return;
    setAddingBenevole(true);
    const res = await fetch("/api/benevoles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBenevole),
    });
    if (res.ok) {
      setBenevoleMsg("✅ Bénévole ajouté");
      setNewBenevole({ prenom: "", pin: "", role: "benevole" });
      fetchAll();
      setTimeout(() => setBenevoleMsg(null), 3000);
    }
    setAddingBenevole(false);
  };

  const deleteBenevole = async (b: Benevole) => {
    if (!confirm(`Supprimer ${b.prenom} ? Cette action est définitive.`)) return;
    setDeletingId(b.id);
    const res = await fetch("/api/benevoles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, requesterId: user.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setBenevoleMsg(`🗑️ ${b.prenom} supprimé`);
      setBenevoles((list) => list.filter((x) => x.id !== b.id));
    } else {
      setBenevoleMsg(`❌ ${data.error ?? "Erreur lors de la suppression"}`);
    }
    setTimeout(() => setBenevoleMsg(null), 3000);
    setDeletingId(null);
  };

  const tabs = [
    { id: "config" as const, label: "⚙️ Config Match", badge: 0 },
    { id: "litiges" as const, label: "⚠️ Litiges", badge: litiges.length },
    { id: "benevoles" as const, label: "👥 Bénévoles", badge: 0 },
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: "var(--cds-bleu-nuit)" }}
      >
        <h1 className="text-xl font-black uppercase tracking-wide">
          ⚙️ Administration
        </h1>
        <p className="text-blue-200 text-sm mt-1">
          Organisateur : {user.prenom}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`relative flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === t.id
                ? "border-yellow-500 text-yellow-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Chargement…</div>
      ) : (
        <>
          {/* ── TAB CONFIG ── */}
          {activeTab === "config" && (
            <div className="card space-y-5 animate-slide-up">
              <h2
                className="font-bold uppercase tracking-wide text-sm"
                style={{ color: "var(--cds-bleu-nuit)" }}
              >
                🏆 Bonus Match (27 août)
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    🧑 Bonus Garçons
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="input-field text-2xl font-black text-center"
                    value={config.scoreBonusGarcons}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        scoreBonusGarcons: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    👩 Bonus Filles
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="input-field text-2xl font-black text-center"
                    value={config.scoreBonusFilles}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        scoreBonusFilles: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div
                className="rounded-xl p-3 text-xs"
                style={{
                  backgroundColor: "rgba(201,162,39,0.1)",
                  color: "#7a5c00",
                }}
              >
                💡 Recommandation : Bonus gagnant +5 pts, match nul +2 pts chacun. Le bonus ne doit jamais pouvoir inverser le score de mobilisation.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  🎯 Objectif Global (donneurs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  className="input-field text-2xl font-black text-center"
                  value={config.objectifGlobal}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      objectifGlobal: Number(e.target.value),
                    })
                  }
                />
              </div>

              {configMsg && (
                <div className="rounded-xl p-3 bg-green-50 border border-green-200 text-green-700 font-bold text-sm text-center">
                  {configMsg}
                </div>
              )}

              <button onClick={saveConfig} className="btn-primary w-full">
                💾 Enregistrer la Configuration
              </button>

              {/* Export CSV */}
              <div className="pt-4 border-t border-gray-100">
                <h3
                  className="font-bold text-sm mb-3"
                  style={{ color: "var(--cds-bleu-nuit)" }}
                >
                  📄 Export Rapport IB Bank / CRTS
                </h3>
                <a
                  href="/api/export"
                  download
                  className="btn-ghost w-full text-center block"
                >
                  ⬇️ Télécharger CSV
                </a>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Contient recruteurs, promesses, présences et donneurs spontanés
                </p>
              </div>
            </div>
          )}

          {/* ── TAB LITIGES ── */}
          {activeTab === "litiges" && (
            <div className="space-y-4 animate-slide-up">
              {litiges.length === 0 ? (
                <div className="card text-center py-10">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-bold text-gray-600">Aucun litige en cours</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Toutes les promesses sont résolues
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="rounded-xl p-3 text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(214,69,69,0.08)",
                      color: "var(--cds-alerte)",
                    }}
                  >
                    ⚠️ {litiges.length} promesse(s) requièrent un arbitrage manuel
                  </div>
                  {litiges.map((l) => (
                    <div key={l.id} className="card border-2 border-orange-200 space-y-3">
                      <div>
                        <p className="font-black text-lg">{l.nomPersonnePromise}</p>
                        <p className="text-sm text-gray-500 font-mono">
                          {formatPhoneDisplay(l.telephonePersonnePromise)}
                        </p>
                        {l.recruteur && (
                          <p className="text-xs text-gray-400 mt-1">
                            Recruteur :{" "}
                            <span className="font-semibold">
                              {l.recruteur.genre === "M" ? "🧑" : "👩"}{" "}
                              {l.recruteur.nom}
                            </span>{" "}
                            (Équipe{" "}
                            {l.recruteur.genre === "M" ? "Garçons" : "Filles"})
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Enregistré le{" "}
                          {new Date(l.timestampEnregistrement).toLocaleString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => resolveListige(l.id, "valider")}
                          className="btn-primary text-sm"
                          style={{ minHeight: "44px" }}
                        >
                          ✅ Valider
                        </button>
                        <button
                          onClick={() => resolveListige(l.id, "rejeter")}
                          className="btn-danger text-sm"
                          style={{ minHeight: "44px" }}
                        >
                          ❌ Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── TAB BÉNÉVOLES ── */}
          {activeTab === "benevoles" && (
            <div className="space-y-5 animate-slide-up">
              {/* Ajouter un bénévole */}
              <div className="card space-y-4">
                <h3
                  className="font-bold text-sm uppercase tracking-wide"
                  style={{ color: "var(--cds-bleu-nuit)" }}
                >
                  ➕ Ajouter un Bénévole
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Prénom du bénévole"
                    value={newBenevole.prenom}
                    onChange={(e) =>
                      setNewBenevole({ ...newBenevole, prenom: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Code PIN (4-6 chiffres)
                  </label>
                  <input
                    type="tel"
                    className="input-field font-mono"
                    placeholder="Ex : 5678"
                    value={newBenevole.pin}
                    onChange={(e) =>
                      setNewBenevole({ ...newBenevole, pin: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Rôle
                  </label>
                  <select
                    className="input-field"
                    value={newBenevole.role}
                    onChange={(e) =>
                      setNewBenevole({ ...newBenevole, role: e.target.value })
                    }
                  >
                    <option value="benevole">Bénévole</option>
                    <option value="organisateur">Organisateur</option>
                  </select>
                </div>
                {benevoleMsg && (
                  <div className="rounded-xl p-3 bg-green-50 border border-green-200 text-green-700 font-bold text-sm text-center">
                    {benevoleMsg}
                  </div>
                )}
                <button
                  onClick={addBenevole}
                  disabled={!newBenevole.prenom || !newBenevole.pin || addingBenevole}
                  className="btn-primary w-full"
                >
                  {addingBenevole ? "⏳ Ajout…" : "➕ Créer le Bénévole"}
                </button>
              </div>

              {/* Liste bénévoles */}
              <div className="card">
                <h3
                  className="font-bold text-sm uppercase tracking-wide mb-4"
                  style={{ color: "var(--cds-bleu-nuit)" }}
                >
                  👥 Bénévoles enregistrés ({benevoles.length})
                </h3>
                <div className="space-y-2">
                  {benevoles.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-sm">{b.prenom}</p>
                        <p className="text-xs text-gray-400 capitalize">
                          {b.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            b.role === "organisateur"
                              ? "badge-garcons"
                              : "badge-attente"
                          }
                        >
                          {b.role === "organisateur" ? "⚙️ Orga" : "🙋 Bénévole"}
                        </span>
                        {b.id !== user.id && (
                          <button
                            onClick={() => deleteBenevole(b)}
                            disabled={deletingId === b.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 p-2"
                            title={`Supprimer ${b.prenom}`}
                            aria-label={`Supprimer ${b.prenom}`}
                          >
                            {deletingId === b.id ? "⏳" : "🗑️"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AppShell>
      <AdminContent />
    </AppShell>
  );
}
