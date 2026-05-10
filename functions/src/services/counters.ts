import { adminDb } from "./admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * 트랜잭션으로 시퀀스 카운터를 증가시키고 사람이 읽는 번호를 발급한다.
 * 예: REQ-2026-0001
 */
export async function nextRequestNumber(year: number): Promise<string> {
  const ref = adminDb.doc(`counters/requests_${year}`);
  const value = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.exists ? (snap.data()?.value as number) : 0) || 0;
    const next = current + 1;
    tx.set(ref, { value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return next;
  });
  return `REQ-${year}-${String(value).padStart(4, "0")}`;
}
