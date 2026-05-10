"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL_KO } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";

export default function ManagerDashboardPage() {
  const { user, claims } = useAuth();
  const isSuper = claims?.sm === true;

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title="관리자 홈"
        subtitle={claims?.role ? ROLE_LABEL_KO[claims.role] : undefined}
        back={false}
      />

      <section className="px-4">
        <div className="rounded-2xl bg-brand-50 p-5">
          <p className="text-base text-brand-900">
            안녕하세요, {user?.displayName || user?.email || "관리자"}님
          </p>
          <p className="mt-1 text-sm text-brand-700">
            오늘도 깨끗한 하루 되세요.
          </p>
        </div>
      </section>

      <section className="mt-6 px-4">
        <h2 className="mb-3 text-sm text-brand-700">빠른 메뉴</h2>
        <div className="grid grid-cols-2 gap-3">
          <Tile href="/buildings" name="apartment" label="건물 관리" />
          <Tile href="/requests" name="list_alt" label="요청 목록" />
          <Tile href="/blog/new" name="edit_note" label="블로그 작성" />
          {isSuper && <Tile href="/admin/users" name="admin_panel_settings" label="역할 관리" />}
        </div>
      </section>
    </main>
  );
}

function Tile({ href, name, label }: { href: string; name: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-tap items-center gap-3 rounded-xl border border-brand-100 bg-white px-4 py-4 text-base text-brand-900 transition active:bg-brand-50"
    >
      <Icon name={name} className="text-brand-500" />
      <span>{label}</span>
    </Link>
  );
}
