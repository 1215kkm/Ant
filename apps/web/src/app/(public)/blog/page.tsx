"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPublishedPosts } from "@/lib/queries/posts";
import type { BlogPost } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="청소 이야기" subtitle="깨끗해진 순간들을 모았습니다" back={false} />

      {loading ? (
        <p className="px-4 text-sm text-brand-700">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <EmptyState icon="auto_stories" title="아직 게시된 글이 없습니다" />
      ) : (
        <ul className="flex flex-col gap-3 px-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/${p.slug}`}
                className="flex gap-3 overflow-hidden rounded-2xl border border-brand-100 bg-white active:bg-brand-50"
              >
                {p.heroImage ? (
                  <img
                    src={p.heroImage.url}
                    alt=""
                    className="h-24 w-24 shrink-0 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-brand-50">
                    <Icon name="cleaning_services" className="text-brand-500" />
                  </div>
                )}
                <div className="flex-1 p-3">
                  <p className="text-base font-semibold text-brand-900">{p.title}</p>
                  {p.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-brand-700">{p.excerpt}</p>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
