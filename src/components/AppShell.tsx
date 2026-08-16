"use client";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginScreen from "./LoginScreen";
import AppHeader from "./AppHeader";

function Inner({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--cds-bleu-nuit)" }}
      >
        <div className="text-white text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-heartbeat">🩸</div>
          <p className="font-bold text-lg tracking-wide">Le Match Continue</p>
          <p className="text-blue-300 text-sm mt-1 opacity-70">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cds-fond)" }}>
      <AppHeader user={user} onLogout={logout} />
      <main className="max-w-2xl mx-auto px-4 py-5 pb-8">{children}</main>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Inner>{children}</Inner>
    </AuthProvider>
  );
}
