"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllPostsForManager } from "@/lib/queries/posts";
import type { BlogPost } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default function ManagerBlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllPostsForManager()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader
        title="블로그 관리"
        back={false}
        action={
          <Link
            href="/blog/new"
            className="inline-flex min-h-tap items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm text-white"
          >
            <Icon name="add" size={20} />
            <span>새 글</span>
          </Link>
        }
      />

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <EmptyState icon="edit_note" title="작성된 글이 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/edit/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 active:bg-brand-50"
              >
                <Icon
                  name={p.published ? "visibility" : "visibility_off"}
                  className={p.published ? "text-success" : "text-brand-400"}
                />
                <div className="flex-1">
                  <p className="text-base text-brand-900">{p.title}</p>
                  <p className="text-xs text-brand-700/70">
                    {p.published ? "공개" : "비공개"} ·{" "}
                    {p.updatedAt
                      ? new Date(p.updatedAt.toMillis()).toLocaleDateString("ko-KR")
                      : "—"}
                  </p>
                </div>
                <Icon name="chevron_right" className="text-brand-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
