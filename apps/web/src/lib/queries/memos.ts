import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Memo, Resident } from "@/lib/types";

export async function listMemosForResident(
  buildingId: string,
  residentId: string,
): Promise<Memo[]> {
  const snap = await getDocs(
    query(
      collection(db, "buildings", buildingId, "memos"),
      where("residentId", "==", residentId),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Memo, "id">) }));
}

export async function createMemo(
  buildingId: string,
  input: {
    residentId: string;
    residentName: string;
    body: string;
    tags: string[];
    authorId: string;
    authorName?: string;
  },
): Promise<string> {
  const ref = await addDoc(collection(db, "buildings", buildingId, "memos"), {
    residentId: input.residentId,
    residentName: input.residentName,
    body: input.body,
    tags: input.tags,
    authorId: input.authorId,
    authorName: input.authorName ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMemo(
  buildingId: string,
  memoId: string,
  patch: Partial<Pick<Memo, "body" | "tags">>,
): Promise<void> {
  await updateDoc(doc(db, "buildings", buildingId, "memos", memoId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMemo(buildingId: string, memoId: string): Promise<void> {
  await deleteDoc(doc(db, "buildings", buildingId, "memos", memoId));
}

export async function getResident(
  buildingId: string,
  residentId: string,
): Promise<Resident | null> {
  const snap = await getDoc(doc(db, "buildings", buildingId, "residents", residentId));
  return snap.exists()
    ? { id: snap.id, buildingId, ...(snap.data() as Omit<Resident, "id" | "buildingId">) }
    : null;
}
