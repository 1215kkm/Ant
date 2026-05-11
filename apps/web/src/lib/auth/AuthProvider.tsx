"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { Role } from "@/lib/auth/roles";

export type AuthClaims = {
  role?: Role;
  bIds?: string[];
  /** super_manager 단축 플래그 */
  sm?: boolean;
};

export type AuthState = {
  /** 인증 상태 로딩 중 */
  loading: boolean;
  user: User | null;
  claims: AuthClaims | null;
  signOut: () => Promise<void>;
  /** Custom Claims를 강제로 새로고침 (서버에서 변경한 직후 호출) */
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const tokenResult = await u.getIdTokenResult();
        setClaims(extractClaims(tokenResult.claims));
      } else {
        setClaims(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      claims,
      signOut: async () => {
        await fbSignOut(auth);
      },
      refreshClaims: async () => {
        if (!auth.currentUser) return;
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        setClaims(extractClaims(tokenResult.claims));
      },
    }),
    [loading, user, claims],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function extractClaims(raw: Record<string, unknown>): AuthClaims {
  return {
    role: typeof raw.role === "string" ? (raw.role as Role) : undefined,
    bIds: Array.isArray(raw.bIds) ? (raw.bIds as string[]) : undefined,
    sm: raw.sm === true,
  };
}
