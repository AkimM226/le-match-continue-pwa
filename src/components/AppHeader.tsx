"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Props {
  user?: { prenom: string; role: string } | null;
  onLogout?: () => void;
}

export default function AppHeader({ user, onLogout }: Props) {
  const pathname = usePathname();
  const [imgError, setImgError] = useState(false);

  return (
    <header
      style={{
        background: "linear-gradient(135deg, var(--cds-bleu-nuit) 0%, #0e2d5c 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
      className="sticky top-0 z-50 shadow-xl"
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Titre */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-yellow-400 transition-transform group-hover:scale-105"
            style={{ boxShadow: "0 0 12px rgba(201, 162, 39, 0.4)" }}
          >
            {!imgError ? (
              <Image
                src="/cds-logo.png"
                alt="CDS"
                width={40}
                height={40}
                className="object-cover w-full h-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-lg font-black"
                style={{
                  background: "linear-gradient(135deg, var(--cds-or), var(--cds-or-light))",
                  color: "var(--cds-bleu-nuit)",
                }}
              >
                🩸
              </div>
            )}
          </div>
          <div>
            <p
              className="font-black text-sm leading-none tracking-wide transition-colors"
              style={{ color: "var(--cds-or)" }}
            >
              LE MATCH CONTINUE
            </p>
            <p className="text-xs text-blue-300 leading-tight mt-0.5 opacity-80">
              Capital du Savoir · Bobo-Dioulasso
            </p>
          </div>
        </Link>

        {/* User info + Logout */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                style={{
                  background: "linear-gradient(135deg, var(--cds-or), var(--cds-or-light))",
                  color: "var(--cds-bleu-nuit)",
                }}
              >
                {user.prenom[0].toUpperCase()}
              </div>
              <span className="text-xs text-blue-200 font-medium">{user.prenom}</span>
            </div>
          )}
          {user && onLogout && (
            <button
              onClick={onLogout}
              className="text-xs text-blue-300 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              Déco.
            </button>
          )}
        </div>
      </div>

      {/* Nav tabs */}
      {user && (
        <nav style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
          <div className="max-w-2xl mx-auto px-2 flex gap-0.5 overflow-x-auto scrollbar-none">
            <NavLink href="/" current={pathname} label="🏠 Accueil" />
            <NavLink href="/saisie" current={pathname} label="✏️ Saisie J1" />
            <NavLink href="/pointage" current={pathname} label="✅ Pointage J2" />
            {user.role === "organisateur" && (
              <NavLink href="/admin" current={pathname} label="⚙️ Admin" />
            )}
            <NavLink href="/public" current={pathname} label="📺 Public" />
          </div>
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  current,
  label,
}: {
  href: string;
  current: string;
  label: string;
}) {
  const isActive = current === href;
  return (
    <Link
      href={href}
      className="whitespace-nowrap py-2.5 px-3 text-xs font-semibold relative transition-colors"
      style={{
        color: isActive ? "var(--cds-or)" : "rgba(147, 197, 253, 0.8)",
        borderBottom: isActive ? "2px solid var(--cds-or)" : "2px solid transparent",
        textDecoration: "none",
      }}
    >
      {label}
      {isActive && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
          style={{
            background: "linear-gradient(90deg, transparent, var(--cds-or), transparent)",
          }}
        />
      )}
    </Link>
  );
}
