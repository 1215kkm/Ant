"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getBuilding } from "@/lib/queries/buildings";
import {
  createInvoice,
  uploadInvoiceAttachment,
} from "@/lib/queries/invoices";
import type { Building, InvoiceAttachment } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";

export default function NewInvoicePage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const bid = params.get("bid") || "";

  const [building, setBuilding] = useState<Building | null>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(defaultDueDate());
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<InvoiceAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bid) getBuilding(bid).then(setBuilding);
  }, [bid]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !building) return;
    if (submitting) return;
    const amt = Number(amount.replace(/[^0-9]/g, ""));
    if (!amt) {
      toast.error("금액을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const attachments: InvoiceAttachment[] = [...uploaded];
      for (const f of files) {
        attachments.push(await uploadInvoiceAttachment(building.id, user.uid, f));
      }
      const id = await createInvoice({
        buildingId: building.id,
        buildingName: building.name,
        period,
        amount: amt,
        attachments,
        ownerUids: building.ownerIds,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: user.uid,
      });
      toast.success("관리비가 발행되었습니다.");
      router.replace(`/invoices/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "발행 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-12">
      <PageHeader title="관리비 발행" subtitle={building?.name} />

      <form onSubmit={submit} className="flex flex-col gap-4 px-4">
        <Field
          label="기간 (YYYY-MM)"
          value={period}
          onChange={setPeriod}
          placeholder="2026-05"
          required
        />
        <Field
          label="금액 (원)"
          inputMode="numeric"
          value={amount}
          onChange={(v) => setAmount(formatNumber(v))}
          placeholder="1,200,000"
          required
        />
        <label className="block">
          <span className="mb-1 block text-sm text-brand-700">납부 기한</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <div>
          <span className="mb-1 block text-sm text-brand-700">청구서 첨부 (PDF/이미지)</span>
          <label className="flex min-h-tap items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 px-4 py-3 text-sm text-brand-700">
            <Icon name="upload_file" />
            <span>파일 선택</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="hidden"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-brand-700">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Icon name="description" size={18} />
                  {f.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "발행 중…" : "발행"}
        </button>
      </form>
    </main>
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

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultDueDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(10);
  return d.toISOString().slice(0, 10);
}

function formatNumber(v: string): string {
  const digits = v.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}
