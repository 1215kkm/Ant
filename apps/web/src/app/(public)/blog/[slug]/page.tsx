"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getPostBySlug, incrementViewCount } from "@/lib/queries/posts";
import type { BlogPost } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { BeforeAfterSlider } from "@/components/feature/blog/BeforeAfterSlider";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostBySlug(slug)
      .then((p) => {
        setPost(p);
        if (p?.id) incrementViewCount(p.id);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  if (!post || !post.published) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="청소 이야기" />
        <EmptyState
          icon="auto_stories"
          title="글을 찾을 수 없습니다"
          description="삭제되었거나 비공개 상태일 수 있습니다."
          action={
            <Link
              href="/blog"
              className="inline-flex min-h-tap items-center rounded-lg bg-brand-500 px-3 py-2 text-sm text-white"
            >
              목록으로
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="청소 이야기" />

      <article className="px-4">
        {post.heroImage && (
          <img
            src={post.heroImage.url}
            alt=""
            className="mb-4 aspect-[4/3] w-full rounded-2xl object-cover"
          />
        )}
        <h1 className="text-2xl font-semibold text-brand-900">{post.title}</h1>
        <p className="mt-1 text-xs text-brand-700/70">
          {post.authorName || "개미청소"}
          {post.publishedAt
            ? " · " + new Date(post.publishedAt.toMillis()).toLocaleDateString("ko-KR")
            : ""}
          {typeof post.viewCount === "number" ? ` · 조회 ${post.viewCount}` : ""}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {post.excerpt && (
          <p className="mt-4 text-base text-brand-700">{post.excerpt}</p>
        )}

        <div className="mt-6 whitespace-pre-line text-base text-brand-900">
          {post.body}
        </div>

        {post.beforeAfter && post.beforeAfter.length > 0 && (
          <section className="mt-6 space-y-6">
            <h2 className="flex items-center gap-2 text-sm text-brand-700">
              <Icon name="compare" />
              청소 전후 비교
            </h2>
            {post.beforeAfter.map((ba, i) => (
              <BeforeAfterSlider key={i} {...ba} />
            ))}
          </section>
        )}

        <div className="mt-8 rounded-2xl bg-brand-50 p-4 text-center">
          <p className="text-sm text-brand-700">
            깨끗한 공간을 만들고 싶으신가요?
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
          >
            개미청소 문의하기
          </Link>
        </div>
      </article>
    </main>
  );
}
