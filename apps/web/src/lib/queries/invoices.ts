import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import type { Invoice, InvoiceAttachment, InvoiceStatus } from "@/lib/types";

const col = collection(db, "invoices");

export async function listInvoicesForBuilding(bid: string): Promise<Invoice[]> {
  const snap = await getDocs(
    query(col, where("buildingId", "==", bid), orderBy("period", "desc"), limit(100)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invoice, "id">) }));
}

export async function listInvoicesForOwner(uid: string): Promise<Invoice[]> {
  const snap = await getDocs(
    query(col, where("recipients.ownerUids", "array-contains", uid), orderBy("period", "desc"), limit(100)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invoice, "id">) }));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(col, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Invoice, "id">) }) : null;
}

export type CreateInvoiceInput = {
  buildingId: string;
  buildingName?: string;
  period: string; // YYYY-MM
  amount: number;
  attachments?: InvoiceAttachment[];
  ownerUids: string[];
  dueDate?: Date;
  createdBy: string;
};

export async function createInvoice(input: CreateInvoiceInput): Promise<string> {
  const ref = await addDoc(col, {
    buildingId: input.buildingId,
    buildingName: input.buildingName ?? null,
    period: input.period,
    amount: input.amount,
    currency: "KRW",
    attachments: input.attachments ?? [],
    recipients: { ownerUids: input.ownerUids },
    status: "issued" as InvoiceStatus,
    dueDate: input.dueDate ?? null,
    remindersSent: 0,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markInvoicePaid(id: string): Promise<void> {
  await updateDoc(doc(col, id), {
    status: "paid",
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  await updateDoc(doc(col, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadInvoiceAttachment(
  bid: string,
  uid: string,
  file: File,
): Promise<InvoiceAttachment> {
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    throw new Error("PDF 또는 이미지 파일만 업로드할 수 있습니다.");
  }
  const ts = Date.now();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `invoices/${bid}/_pending/${uid}/${ts}_${safe}`;
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, file, {
    contentType: file.type,
    customMetadata: { uploaderUid: uid },
  });
  await task;
  const url = await getDownloadURL(task.snapshot.ref);
  return {
    kind: isPdf ? "pdf" : "image",
    path,
    url,
    name: file.name,
  };
}
