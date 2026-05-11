"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES, ROLE_LABEL_KO, type Role } from "@/lib/auth/roles";
import { callSetUserRole } from "@/lib/firebase/functions";
import { Icon } from "@/components/ui/Icon";

/**
 * 슈퍼관리자 전용 사용자 역할 콘솔.
 * 본격적인 사용자 검색은 Phase 2에서 추가하고, 우선은 UID 직접 입력으로 처리한다.
 */
export default function AdminUsersPage() {
  const { claims } = useAuth();
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<Role>("cleaning_manager");
  const [loading, setLoading] = useState(false);

  if (claims?.role !== "super_manager") {
    return (
      <main className="mx-auto max-w-screen-sm px-4 py-12 text-center">
        <Icon name="lock" size={32} className="text-brand-500" />
        <p className="mt-4 text-base text-brand-900">슈퍼관리자만 접근할 수 있습니다.</p>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    setLoading(true);
    try {
      await callSetUserRole({ uid: uid.trim(), role });
      toast.success(`역할을 ${ROLE_LABEL_KO[role]}(으)로 변경했습니다.`);
      setUid("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-screen-sm px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold text-brand-900">사용자 역할 관리</h1>
      <p className="mt-2 text-sm text-brand-700">
        대상 사용자의 UID를 입력하고 역할을 선택하세요.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm text-brand-700">사용자 UID</span>
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            required
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm text-brand-700">역할</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <label
                key={r}
                className={
                  "flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm " +
                  (role === r
                    ? "border-brand-500 bg-brand-50 text-brand-900"
                    : "border-brand-200 bg-white text-brand-700")
                }
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="sr-only"
                />
                {ROLE_LABEL_KO[r]}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "처리 중…" : "역할 변경"}
        </button>
      </form>
    </main>
  );
}
