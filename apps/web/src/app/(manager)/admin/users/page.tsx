"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES, ROLE_LABEL_KO, type Role } from "@/lib/auth/roles";
import {
  callSetUserRole,
  callFindUserByContact,
  type FindUserResult,
} from "@/lib/firebase/functions";
import { Icon } from "@/components/ui/Icon";

/**
 * 슈퍼관리자 전용 사용자 역할 콘솔.
 * 이메일/휴대폰으로 회원을 검색(findUserByContact)한 뒤 역할을 변경한다.
 * UID 직접 입력은 사용성이 나빠 폐기했다.
 */

/** 입력값을 findUserByContact 인자로 변환. 이메일이면 그대로, 아니면 한국 E.164(+82)로. */
function normalizeContact(
  raw: string,
): { email: string } | { phoneNumber: string } | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.includes("@")) return { email: v };
  let digits = v.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return { phoneNumber: digits };
  if (digits.startsWith("0")) return { phoneNumber: "+82" + digits.slice(1) };
  if (digits.startsWith("82")) return { phoneNumber: "+" + digits };
  return null;
}

export default function AdminUsersPage() {
  const { claims } = useAuth();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<FindUserResult | null>(null);
  const [role, setRole] = useState<Role>("cleaning_manager");
  const [saving, setSaving] = useState(false);

  if (claims?.role !== "super_manager") {
    return (
      <main className="mx-auto max-w-screen-sm px-4 py-12 text-center">
        <Icon name="lock" size={32} className="text-brand-500" />
        <p className="mt-4 text-base text-brand-900">슈퍼관리자만 접근할 수 있습니다.</p>
      </main>
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const contact = normalizeContact(query);
    if (!contact) {
      toast.error("이메일 또는 휴대폰 번호를 정확히 입력해 주세요.");
      return;
    }
    setSearching(true);
    setFound(null);
    try {
      const res = await callFindUserByContact(contact);
      setFound(res.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "검색 중 오류가 발생했습니다.";
      toast.error(message);
    } finally {
      setSearching(false);
    }
  }

  async function changeRole() {
    if (!found) return;
    setSaving(true);
    try {
      await callSetUserRole({ uid: found.uid, role });
      const who = found.email ?? found.phoneNumber ?? found.uid;
      toast.success(`${who} 님의 역할을 ${ROLE_LABEL_KO[role]}(으)로 바꿨습니다.`);
      setFound(null);
      setQuery("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "오류가 발생했습니다.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-screen-sm px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold text-brand-900">회원 역할 바꾸기</h1>
      <p className="mt-2 text-sm text-brand-700">
        역할을 바꿀 회원을 이메일이나 휴대폰 번호로 찾은 뒤, 새 역할을 골라
        주세요.
      </p>

      <form onSubmit={search} className="mt-6 flex flex-col gap-2">
        <label className="block">
          <span className="mb-1 block text-sm text-brand-700">
            회원 이메일 또는 휴대폰 번호
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: hong@example.com 또는 010-1234-5678"
            className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            required
          />
        </label>
        <button
          type="submit"
          disabled={searching}
          className="inline-flex min-h-tap items-center justify-center rounded-xl border border-brand-500 px-4 py-3 text-base font-medium text-brand-600 active:bg-brand-50 disabled:opacity-50"
        >
          {searching ? "찾는 중…" : "회원 찾기"}
        </button>
      </form>

      {found && (
        <section className="mt-6 rounded-xl border border-brand-200 bg-white p-4">
          <p className="text-sm text-brand-500">찾은 회원</p>
          <p className="mt-1 text-base font-medium text-brand-900">
            {found.displayName ?? found.email ?? found.phoneNumber ?? "이름 없음"}
          </p>
          {found.email && (
            <p className="text-sm text-brand-700">{found.email}</p>
          )}
          {found.phoneNumber && (
            <p className="text-sm text-brand-700">{found.phoneNumber}</p>
          )}

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm text-brand-700">새 역할</legend>
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
            type="button"
            onClick={changeRole}
            disabled={saving}
            className="mt-4 inline-flex min-h-tap w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "처리 중…" : "역할 변경"}
          </button>
        </section>
      )}
    </main>
  );
}
