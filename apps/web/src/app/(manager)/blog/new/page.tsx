"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { PostEditor } from "@/components/feature/blog/PostEditor";

export default function NewPostPage() {
  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title="새 글" subtitle="청소 전후 사진과 함께" />
      <PostEditor />
    </main>
  );
}
