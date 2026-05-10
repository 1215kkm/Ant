import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type AppNotification = {
  id: string;
  recipientUid: string;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
  payload?: Record<string, unknown> | null;
  read: boolean;
  createdAt?: Timestamp;
};

const col = collection(db, "notifications");

export function watchMyNotifications(
  uid: string,
  cb: (items: AppNotification[]) => void,
): () => void {
  return onSnapshot(
    query(col, where("recipientUid", "==", uid), orderBy("createdAt", "desc"), limit(50)),
    (snap) => {
      cb(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, "id">) })),
      );
    },
  );
}

export async function listMyNotifications(uid: string): Promise<AppNotification[]> {
  const snap = await getDocs(
    query(col, where("recipientUid", "==", uid), orderBy("createdAt", "desc"), limit(50)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, "id">) }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(col, id), { read: true });
}

export async function markAllRead(uid: string): Promise<void> {
  const snap = await getDocs(
    query(col, where("recipientUid", "==", uid), where("read", "==", false), limit(200)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
