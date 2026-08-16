"use client";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "./AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError("");
    const result = await login(pin.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "PIN incorrect");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const appendDigit = (d: string) => {
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      // Auto-submit when 4 digits entered
      if (next.length === 4) {
        setTimeout(() => {
          // trigger submit via state update
        }, 50);
      }
    }
  };

  const deleteDigit = () => setPin((p) => p.slice(0, -1));

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ backgroundColor: "var(--cds-bleu-nuit)" }}
    >
      {/* Decorative background circles */}
      <div
        className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--cds-or), transparent)" }}
      />
      <div
        className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--cds-bleu-ciel), transparent)" }}
      />
      <div
        className="absolute top-1/3 left-[-40px] w-32 h-32 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
      />

      {/* Logo + branding */}
      <div className="mb-8 text-center animate-slide-up relative z-10">
        <div
          className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-5 border-4 border-yellow-400 animate-pulse-ring"
          style={{ boxShadow: "0 0 30px rgba(201, 162, 39, 0.4)" }}
        >
          {!imgError ? (
            <Image
              src="/cds-logo.png"
              alt="CDS"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl animate-heartbeat"
              style={{
                background: "linear-gradient(135deg, var(--cds-or), var(--cds-or-light))",
              }}
            >
              🩸
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">
          Le Match Continue
        </h1>
        <p className="font-bold mt-1.5" style={{ color: "var(--cds-or)" }}>
          Capital du Savoir
        </p>
        <p className="text-blue-300 text-sm mt-1 opacity-80">
          27–28 Août 2026 · Bobo-Dioulasso
        </p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-xs animate-slide-up relative z-10">
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2 className="text-white text-center font-bold text-base mb-5 tracking-wide">
            🔒 Connexion Bénévole
          </h2>

          {/* PIN dots */}
          <div className={`flex justify-center gap-3 mb-6 ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
            style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-200"
                style={{
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor:
                    pin.length > i
                      ? "var(--cds-or)"
                      : error
                      ? "rgba(214, 69, 69, 0.5)"
                      : "rgba(255,255,255,0.15)",
                  backgroundColor:
                    pin.length > i
                      ? "rgba(201,162,39,0.15)"
                      : "rgba(255,255,255,0.04)",
                  color: "white",
                  transform: pin.length === i + 1 ? "scale(1.05)" : "scale(1)",
                  boxShadow: pin.length > i ? "0 0 8px rgba(201,162,39,0.3)" : "none",
                }}
              >
                {pin.length > i ? "●" : ""}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm text-center animate-pop-in"
              style={{
                background: "rgba(214, 69, 69, 0.15)",
                border: "1px solid rgba(214, 69, 69, 0.3)",
                color: "#fca5a5",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* Numeric pad */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
              <button
                key={i}
                onClick={() => d === "⌫" ? deleteDigit() : d ? appendDigit(d) : null}
                disabled={d === ""}
                className={`h-14 rounded-xl text-xl font-bold transition-all duration-100 select-none ${
                  d === ""
                    ? "invisible"
                    : d === "⌫"
                    ? "active:scale-90"
                    : "active:scale-90"
                }`}
                style={
                  d === "⌫"
                    ? {
                        background: "rgba(214, 69, 69, 0.15)",
                        color: "#fca5a5",
                        border: "1px solid rgba(214,69,69,0.2)",
                      }
                    : d
                    ? {
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }
                    : {}
                }
                onMouseEnter={(e) => {
                  if (d && d !== "⌫") {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.16)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (d && d !== "⌫") {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={() => handleSubmit()}
            disabled={pin.length < 4 || loading}
            className="w-full btn-primary text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse-soft">🩸</span> Vérification…
              </span>
            ) : (
              "Se connecter →"
            )}
          </button>

          <p className="text-center text-blue-400 text-xs mt-4 opacity-70">
            Utilisez votre code PIN individuel fourni par l'organisateur
          </p>
        </div>

        {/* Demo codes */}
        <div
          className="mt-4 p-4 rounded-xl text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-blue-300 text-xs font-bold mb-2 uppercase tracking-wide">
            🔑 Codes démo
          </p>
          <div className="text-xs text-blue-200 space-y-1">
            <p>
              Kofi (organisateur) :{" "}
              <span className="font-mono font-bold" style={{ color: "var(--cds-or)" }}>
                1234
              </span>
            </p>
            <p>
              Aminata (bénévole) :{" "}
              <span className="font-mono font-bold" style={{ color: "var(--cds-or)" }}>
                2345
              </span>
            </p>
            <p>
              Seydou (bénévole) :{" "}
              <span className="font-mono font-bold" style={{ color: "var(--cds-or)" }}>
                3456
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
