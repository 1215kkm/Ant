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
        syncAuthCookie(true);
      } else {
        setClaims(null);
        syncAuthCookie(false);
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

/**
 * 미들웨어가 보호 라우트의 SSR/RSC HTML을 비로그인 사용자에게 보내지 않도록
 * 동기화하는 가벼운 플래그 쿠키. 실제 토큰 검증은 클라이언트 RequireAuth·
 * Firestore 규칙이 담당한다.
 */
function syncAuthCookie(loggedIn: boolean) {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; secure"
      : "";
  if (loggedIn) {
    document.cookie = `__ant_auth=1; path=/; max-age=86400; samesite=lax${secure}`;
  } else {
    document.cookie = `__ant_auth=; path=/; max-age=0; samesite=lax${secure}`;
  }
}

function extractClaims(raw: Record<string, unknown>): AuthClaims {
  return {
    role: typeof raw.role === "string" ? (raw.role as Role) : undefined,
    bIds: Array.isArray(raw.bIds) ? (raw.bIds as string[]) : undefined,
    sm: raw.sm === true,
  };
}
