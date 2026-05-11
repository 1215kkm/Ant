import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Report } from "@/lib/types";

const col = collection(db, "reports");

export async function listReportsForBuilding(bid: string): Promise<Report[]> {
  const snap = await getDocs(
    query(col, where("buildingId", "==", bid), orderBy("periodStart", "desc"), limit(50)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, "id">) }));
}

export async function getReport(id: string): Promise<Report | null> {
  const snap = await getDoc(doc(col, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Report, "id">) }) : null;
}
