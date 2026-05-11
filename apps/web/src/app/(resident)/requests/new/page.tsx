"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getUser } from "@/lib/queries/users";
import { listResidents } from "@/lib/queries/buildings";
import {
  createRequest,
  uploadRequestMedia,
  type UploadProgress,
} from "@/lib/queries/requests";
import type { Resident, RequestType } from "@/lib/types";
import { REQUEST_TYPE_LABEL_KO } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";

const CATEGORIES = ["수도/누수", "전기", "엘리베이터", "공용부", "소음", "기타"];

export default function NewRequestPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [type, setType] = useState<RequestType>("repair");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [buildingId, setBuildingId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 사용자가 속한 첫 번째 건물에서 본인의 resident 레코드를 찾는다.
  useEffect(() => {
    if (!user) return;
    getUser(user.uid).then(async (u) => {
      if (!u || u.buildingIds.length === 0) return;
      const bid = u.buildingIds[0];
      setBuildingId(bid);
      const residents = await listResidents(bid);
      const me = residents.find((r) => r.uid === user.uid);
      if (me) setResident(me);
    });
  }, [user]);

  function pickFiles() {
    fileRef.current?.click();
  }

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...list].slice(0, 8));
    e.target.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !user) return;
    if (!buildingId) {
      toast.error("배정된 건물이 없습니다. 관리자에게 문의하세요.");
      return;
    }
    if (!resident) {
      toast.error("등록된 거주자 정보가 없습니다. 관리자에게 문의하세요.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("제목과 내용을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const media = [];
      for (const f of files) {
        const m = await uploadRequestMedia(buildingId, user.uid, f, (p) =>
          setProgress((prev) => ({ ...prev, [f.name]: p })),
        );
        media.push(m);
      }
      const id = await createRequest(user.uid, {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        buildingId,
        unitId: resident.unitId,
        unitLabel: resident.unitLabel,
        residentId: resident.id,
        residentName: resident.name,
        media,
      });
      toast.success("요청이 접수되었습니다.");
      router.replace(`/requests/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "전송 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-12">
      <PageHeader title="새 요청" subtitle="수리 또는 문의 사항을 보내주세요" />

      <form onSubmit={submit} className="flex flex-col gap-4 px-4">
        <div className="flex rounded-xl bg-brand-50 p-1 text-sm">
          {(["repair", "inquiry"] as RequestType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={
                "flex min-h-tap flex-1 items-center justify-center rounded-lg px-3 py-2 transition " +
                (type === t ? "bg-white text-brand-900 shadow-sm" : "text-brand-700/70")
              }
            >
              {REQUEST_TYPE_LABEL_KO[t]}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-brand-700">분류</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-brand-700">제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 화장실 수도꼭지 누수"
            maxLength={80}
            className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-brand-700">상세 내용</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="발생 시점, 위치, 빈도 등을 자세히 적어주시면 도움이 됩니다."
            className="block w-full resize-y rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            required
          />
        </label>

        <div>
          <span className="mb-1 block text-sm text-brand-700">사진/영상 (선택)</span>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <FileChip
                key={i}
                file={f}
                progress={progress[f.name]}
                onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            {files.length < 8 && (
              <button
                type="button"
                onClick={pickFiles}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 text-brand-500"
                aria-label="파일 추가"
              >
                <Icon name="add_photo_alternate" />
                <span className="text-xs">추가</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={onFilesPicked}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "전송 중…" : "요청 보내기"}
        </button>
      </form>
    </main>
  );
}

function FileChip({
  file,
  progress,
  onRemove,
}: {
  file: File;
  progress?: UploadProgress;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const url = URL.createObjectURL(file);
  const pct = progress ? Math.round((progress.loaded / progress.total) * 100) : 0;
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-brand-200">
      {isImage ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-brand-50">
          <Icon name="movie" className="text-brand-500" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
        aria-label="삭제"
      >
        <Icon name="close" size={18} />
      </button>
      {progress && pct > 0 && pct < 100 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
          <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
