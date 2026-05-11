"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  createPost,
  deletePost,
  updatePost,
  uploadPostImage,
} from "@/lib/queries/posts";
import type { BeforeAfter, BlogImage, BlogPost } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type Props = {
  /** 편집 모드일 때 기존 글 */
  initial?: BlogPost | null;
};

export function PostEditor({ initial }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [body, setBody] = useState(initial?.body || "");
  const [tags, setTags] = useState<string>(initial?.tags?.join(", ") || "");
  const [heroImage, setHeroImage] = useState<BlogImage | undefined>(initial?.heroImage || undefined);
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfter[]>(
    initial?.beforeAfter || [],
  );
  const [submitting, setSubmitting] = useState(false);
  const heroRef = useRef<HTMLInputElement>(null);

  function ensureSlug(v: string) {
    if (slug) return;
    setSlug(
      v
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80),
    );
  }

  async function pickHero(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    try {
      const img = await uploadPostImage(slug || "draft", user.uid, f);
      setHeroImage(img);
      toast.success("대표 이미지를 추가했습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      e.target.value = "";
    }
  }

  async function addBeforeAfter(beforeFile: File, afterFile: File, caption: string) {
    if (!user) return;
    try {
      const [b, a] = await Promise.all([
        uploadPostImage(slug || "draft", user.uid, beforeFile),
        uploadPostImage(slug || "draft", user.uid, afterFile),
      ]);
      setBeforeAfter((prev) => [...prev, { before: b, after: a, caption }]);
      toast.success("전·후 비교를 추가했습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드 실패");
    }
  }

  async function save(publish: boolean) {
    if (!user) return;
    if (!title.trim() || !slug.trim() || !body.trim()) {
      toast.error("제목, slug, 본문을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (initial) {
        await updatePost(initial.id, {
          title,
          slug,
          excerpt,
          body,
          tags: tagList,
          heroImage,
          beforeAfter,
          publish,
          authorId: user.uid,
        });
        toast.success("저장되었습니다.");
        router.replace("/manage/blog");
      } else {
        const id = await createPost({
          slug,
          title,
          excerpt,
          body,
          tags: tagList,
          heroImage,
          beforeAfter,
          authorId: user.uid,
          authorName: user.displayName || user.email || undefined,
          publish,
        });
        toast.success(publish ? "글이 공개되었습니다." : "임시저장되었습니다.");
        router.replace(`/manage/blog/edit/${id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!initial) return;
    if (!confirm("이 글을 삭제하시겠습니까?")) return;
    await deletePost(initial.id);
    toast.success("삭제되었습니다.");
    router.replace("/manage/blog");
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      <Field
        label="제목"
        value={title}
        onChange={(v) => {
          setTitle(v);
          ensureSlug(v);
        }}
        required
      />
      <Field label="slug (URL)" value={slug} onChange={setSlug} placeholder="cleaned-vip-lobby" />
      <Field label="요약 (선택)" value={excerpt} onChange={setExcerpt} />

      <label className="block">
        <span className="mb-1 block text-sm text-brand-700">본문</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="block w-full resize-y rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <Field label="태그 (쉼표로 구분)" value={tags} onChange={setTags} placeholder="입주청소, 사무실" />

      <div>
        <span className="mb-1 block text-sm text-brand-700">대표 이미지</span>
        {heroImage ? (
          <div className="relative">
            <img src={heroImage.url} alt="" className="h-40 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => setHeroImage(undefined)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="제거"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => heroRef.current?.click()}
            className="flex min-h-tap w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 text-sm text-brand-700"
          >
            <Icon name="image" />
            이미지 추가
          </button>
        )}
        <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={pickHero} />
      </div>

      <BeforeAfterPicker existing={beforeAfter} onAdd={addBeforeAfter} onRemove={(i) => setBeforeAfter((p) => p.filter((_, idx) => idx !== i))} />

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => save(false)}
          className="inline-flex min-h-tap flex-1 items-center justify-center rounded-xl border border-brand-200 px-4 py-3 text-sm font-medium text-brand-700 disabled:opacity-50"
        >
          임시저장
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => save(true)}
          className="inline-flex min-h-tap flex-1 items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "저장 중…" : "공개"}
        </button>
      </div>

      {initial && (
        <button
          type="button"
          onClick={remove}
          className="mt-2 inline-flex min-h-tap items-center justify-center gap-1 self-center text-sm text-danger"
        >
          <Icon name="delete" size={18} />
          글 삭제
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-brand-700">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </label>
  );
}

function BeforeAfterPicker({
  existing,
  onAdd,
  onRemove,
}: {
  existing: BeforeAfter[];
  onAdd: (b: File, a: File, caption: string) => Promise<void>;
  onRemove: (idx: number) => void;
}) {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  async function submit() {
    if (!beforeFile || !afterFile) {
      toast.error("Before / After 두 이미지를 모두 선택해 주세요.");
      return;
    }
    setUploading(true);
    try {
      await onAdd(beforeFile, afterFile, caption);
      setBeforeFile(null);
      setAfterFile(null);
      setCaption("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm text-brand-700">청소 전·후 비교</span>

      {existing.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {existing.map((ba, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white p-2"
            >
              <img src={ba.before.url} alt="" className="h-12 w-12 rounded object-cover" />
              <Icon name="east" size={18} className="text-brand-400" />
              <img src={ba.after.url} alt="" className="h-12 w-12 rounded object-cover" />
              <span className="flex-1 text-sm text-brand-700">{ba.caption || "—"}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="inline-flex min-h-tap min-w-tap items-center justify-center text-brand-700"
                aria-label="제거"
              >
                <Icon name="delete" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
        <div className="grid grid-cols-2 gap-2">
          <FilePicker label="Before" file={beforeFile} onChange={setBeforeFile} />
          <FilePicker label="After" file={afterFile} onChange={setAfterFile} />
        </div>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="설명 (선택)"
          className="mt-2 block w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="button"
          onClick={submit}
          disabled={uploading || !beforeFile || !afterFile}
          className="mt-2 inline-flex min-h-tap w-full items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : "비교 추가"}
        </button>
      </div>
    </div>
  );
}

function FilePicker({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const url = file ? URL.createObjectURL(file) : null;
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="relative flex h-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-dashed border-brand-200 bg-white text-xs text-brand-700"
    >
      {url ? (
        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <Icon name="add_photo_alternate" size={20} />
          <span>{label}</span>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}
