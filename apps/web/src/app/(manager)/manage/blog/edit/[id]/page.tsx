"use client";

import { use, useEffect, useState } from "react";
import { getPost } from "@/lib/queries/posts";
import type { BlogPost } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostEditor } from "@/components/feature/blog/PostEditor";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPost(id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  if (!post) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="블로그" />
        <EmptyState icon="error" title="글을 찾을 수 없습니다" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="글 편집" subtitle={post.title} />
      <PostEditor initial={post} />
    </main>
  );
}
