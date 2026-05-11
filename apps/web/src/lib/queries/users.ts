import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AppUser } from "@/lib/types";

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid, ...(snap.data() as Omit<AppUser, "uid">) }) : null;
}
