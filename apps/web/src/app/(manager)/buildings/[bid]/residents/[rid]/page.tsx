"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  createMemo,
  deleteMemo,
  getResident,
  listMemosForResident,
} from "@/lib/queries/memos";
import type { Memo, Resident } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  MemoTagBadge,
  SUGGESTED_TAGS,
} from "@/components/feature/memos/MemoTagBadge";
import { ResidentStatsCard } from "@/components/feature/stats/ResidentStatsCard";

export default function ResidentDetailPage({
  params,
}: {
  params: Promise<{ bid: string; rid: string }>;
}) {
  const { bid, rid } = use(params);
  const { user } = useAuth();
  const [resident, setResident] = useState<Resident | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"memos" | "stats">("memos");

  useEffect(() => {
    setLoading(true);
    Promise.all([getResident(bid, rid), listMemosForResident(bid, rid)])
      .then(([r, m]) => {
        setResident(r);
        setMemos(m);
      })
      .finally(() => setLoading(false));
  }, [bid, rid]);

  if (loading) return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  if (!resident) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="거주자" />
        <EmptyState icon="error" title="거주자를 찾을 수 없습니다" />
      </main>
    );
  }

  async function addMemo(body: string, tags: string[]) {
    if (!user || !resident) return;
    const id = await createMemo(bid, {
      residentId: resident.id,
      residentName: resident.name,
      body,
      tags,
      authorId: user.uid,
      authorName: user.displayName || user.email || undefined,
    });
    setMemos((prev) => [
      {
        id,
        residentId: resident.id,
        residentName: resident.name,
        body,
        tags,
        authorId: user.uid,
        authorName: user.displayName || user.email || undefined,
      },
      ...prev,
    ]);
  }

  async function removeMemo(id: string) {
    await deleteMemo(bid, id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title={resident.name}
        subtitle={resident.unitLabel || resident.phoneNumber || undefined}
      />

      <nav className="mx-4 mt-2 flex rounded-xl bg-brand-50 p-1 text-sm">
        <TabButton active={tab === "memos"} onClick={() => setTab("memos")} label="메모" />
        <TabButton active={tab === "stats"} onClick={() => setTab("stats")} label="통계" />
      </nav>

      <div className="mt-4 px-4">
        {tab === "memos" ? (
          <MemosTab memos={memos} onCreate={addMemo} onDelete={removeMemo} />
        ) : (
          <ResidentStatsCard resident={resident} />
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={
        "flex min-h-tap flex-1 items-center justify-center rounded-lg px-3 py-2 transition " +
        (active ? "bg-white text-brand-900 shadow-sm" : "text-brand-700/70")
      }
    >
      {label}
    </button>
  );
}

function MemosTab({
  memos,
  onCreate,
  onDelete,
}: {
  memos: Memo[];
  onCreate: (body: string, tags: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(body.trim(), tags);
      setBody("");
      setTags([]);
      toast.success("메모를 저장했습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="mb-4 rounded-xl border border-brand-100 bg-white p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="관리자끼리만 보이는 메모를 작성하세요."
          className="block w-full resize-y rounded-lg border border-brand-200 px-3 py-2 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={
                "rounded-full px-3 py-1 text-xs transition " +
                (tags.includes(t)
                  ? "bg-brand-500 text-white"
                  : "bg-brand-50 text-brand-700")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-tap items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "저장 중…" : "메모 저장"}
          </button>
        </div>
      </form>

      {memos.length === 0 ? (
        <EmptyState icon="sticky_note_2" title="등록된 메모가 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2">
          {memos.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-brand-100 bg-white p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {m.tags.length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <MemoTagBadge key={t} tag={t} />
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-line text-base text-brand-900">{m.body}</p>
                  <p className="mt-1 text-xs text-brand-700/70">
                    {m.authorName || m.authorId}
                    {m.createdAt
                      ? " · " + new Date(m.createdAt.toMillis()).toLocaleString("ko-KR")
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg text-brand-700"
                  aria-label="메모 삭제"
                >
                  <Icon name="delete" size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
