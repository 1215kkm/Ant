"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listBuildings, createBuilding } from "@/lib/queries/buildings";
import type { Building } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default function BuildingsPage() {
  const { user, claims } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const isSuper = claims?.sm === true;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listBuildings(isSuper ? {} : { managerId: user.uid })
      .then(setBuildings)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [user, isSuper]);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title="건물 관리"
        subtitle={isSuper ? "전체 건물" : "담당 건물"}
        back={false}
        action={
          isSuper ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex min-h-tap items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm text-white"
            >
              <Icon name="add" size={20} />
              <span>추가</span>
            </button>
          ) : null
        }
      />

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : buildings.length === 0 ? (
        <EmptyState
          icon="apartment"
          title={isSuper ? "등록된 건물이 없습니다" : "담당 건물이 없습니다"}
          description={isSuper ? "오른쪽 상단 추가 버튼으로 시작하세요." : "슈퍼관리자에게 문의하세요."}
        />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {buildings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/buildings/${b.id}`}
                className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 active:bg-brand-50"
              >
                <Icon name="apartment" className="text-brand-500" />
                <div className="flex-1">
                  <p className="text-base text-brand-900">{b.name}</p>
                  <p className="text-sm text-brand-700">{b.address}</p>
                </div>
                <Icon name="chevron_right" className="text-brand-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <CreateBuildingSheet
          onClose={() => setCreating(false)}
          onCreated={(b) => {
            setBuildings((prev) => [b, ...prev]);
            setCreating(false);
          }}
        />
      )}
    </main>
  );
}

function CreateBuildingSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: Building) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const id = await createBuilding({ name, address });
      onCreated({
        id,
        name,
        address,
        ownerIds: [],
        managerIds: [],
        unitsCount: 0,
        residentsCount: 0,
      });
      toast.success("건물이 추가되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="w-full max-w-screen-sm rounded-t-2xl bg-white p-4 pb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">건물 추가</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg text-brand-700"
            aria-label="닫기"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-brand-700">건물 이름</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-brand-700">주소</span>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "추가 중…" : "추가"}
          </button>
        </form>
      </div>
    </div>
  );
}
