"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setEmail(data?.user?.email ?? null);
      } catch {
        // ignore; UI-only enhancement
      }
    })();

    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("click", onDocClick);
    return () => {
      mounted = false;
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  const initial = email ? email.charAt(0).toUpperCase() : "?";

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore errors for UI-only
    }
    window.location.href = "/";
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-md flex items-center justify-center focus:outline-none"
        title={email ?? "Utilisateur"}
      >
        <span className="select-none">{initial}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black/5 z-50">
          <div className="py-1">
            <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Profil
            </Link>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
