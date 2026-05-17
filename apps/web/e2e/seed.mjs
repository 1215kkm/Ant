/**
 * 역할별 E2E를 위한 에뮬레이터 시드.
 * firebase-admin 으로 4개 역할 사용자 + 건물/호실/거주자/관리비/보고서를 만든다.
 * adminAuth.createUser 가 blocking 트리거를 태우든 말든 결정적으로 동작하도록
 * 사용자 문서와 custom claims 를 명시적으로 덮어쓴다.
 *
 * 실행: node apps/web/e2e/seed.mjs   (에뮬레이터가 떠 있어야 함)
 * 출력: apps/web/e2e/seed-output.json
 */
import admin from "firebase-admin";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const PROJECT = "ant-cleaning";

admin.initializeApp({ projectId: PROJECT });
const auth = admin.auth();
const dbf = admin.firestore();
const { Timestamp, FieldValue } = admin.firestore;

const PASSWORD = "test1234";
const USERS = {
  super: { email: "e2e-super@example.com", role: "super_manager" },
  manager: { email: "e2e-manager@example.com", role: "cleaning_manager" },
  owner: { email: "e2e-owner@example.com", role: "building_owner" },
  resident: { email: "e2e-resident@example.com", role: "resident" },
  promote: { email: "e2e-promote@example.com", role: "resident" }, // setUserRole 대상
};

async function recreateUser(email) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.deleteUser(existing.uid);
  } catch {
    /* 없으면 무시 */
  }
  const u = await auth.createUser({ email, password: PASSWORD, emailVerified: true });
  return u.uid;
}

async function setUserDoc(uid, email, role, buildingIds) {
  await dbf.doc(`users/${uid}`).set(
    {
      uid,
      email,
      phoneNumber: null,
      displayName: email.split("@")[0],
      role,
      buildingIds,
      pushEnabled: false,
      locale: "ko-KR",
      createdAt: Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await auth.setCustomUserClaims(uid, {
    role,
    bIds: buildingIds.slice(0, 30),
    sm: role === "super_manager",
  });
}

async function main() {
  // 1) 사용자 생성
  const uids = {};
  for (const [k, v] of Object.entries(USERS)) {
    uids[k] = await recreateUser(v.email);
  }

  // 2) 건물 생성 (관리자/소유주 배정)
  const buildingRef = await dbf.collection("buildings").add({
    name: "E2E 테스트빌딩",
    address: "서울시 관악구 봉천로 100",
    addressDetail: "",
    ownerIds: [uids.owner],
    managerIds: [uids.manager],
    unitsCount: 1,
    residentsCount: 1,
    stats: { openRequests: 0, monthlyRequests: 0 },
    createdAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const bid = buildingRef.id;

  // 3) 역할별 user 문서 + claims (manager/owner/resident 는 해당 건물 권한)
  await setUserDoc(uids.super, USERS.super.email, "super_manager", []);
  await setUserDoc(uids.manager, USERS.manager.email, "cleaning_manager", [bid]);
  await setUserDoc(uids.owner, USERS.owner.email, "building_owner", [bid]);
  await setUserDoc(uids.resident, USERS.resident.email, "resident", [bid]);
  await setUserDoc(uids.promote, USERS.promote.email, "resident", []);

  // 4) 호실
  const unitRef = await dbf.collection(`buildings/${bid}/units`).add({
    label: "502",
    floor: 5,
    createdAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 5) 거주자 문서 — uid 연결 (new-request 페이지가 r.uid===user.uid 로 탐색)
  const residentRef = await dbf.collection(`buildings/${bid}/residents`).add({
    name: "김거주",
    phoneNumber: "010-1234-5678",
    unitId: unitRef.id,
    unitLabel: "502",
    uid: uids.resident,
    stats: { total: 0, completionRate: 0 },
    createdAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 6) 멤버십 (매니저)
  await dbf
    .doc(`buildings/${bid}/memberships/${uids.manager}_${bid}`)
    .set({
      userId: uids.manager,
      buildingId: bid,
      role: "cleaning_manager",
      permissions: { invoices: true, reports: true, memos: true },
      invitedBy: uids.super,
      status: "active",
      joinedAt: FieldValue.serverTimestamp(),
    });

  // 7) 관리비 (소유주 조회용)
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const invoiceRef = await dbf.collection("invoices").add({
    buildingId: bid,
    buildingName: "E2E 테스트빌딩",
    period,
    amount: 1200000,
    currency: "KRW",
    attachments: [],
    recipients: { ownerUids: [uids.owner] },
    status: "issued",
    dueDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 10)),
    remindersSent: 0,
    createdBy: uids.manager,
    createdAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 8) 보고서 (소유주 조회용)
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 7);
  const reportRef = await dbf.collection("reports").add({
    buildingId: bid,
    buildingName: "E2E 테스트빌딩",
    kind: "weekly",
    periodStart: Timestamp.fromDate(periodStart),
    periodEnd: Timestamp.fromDate(periodEnd),
    summary: {
      totalRequests: 3,
      completed: 2,
      pending: 1,
      byCategory: { "수도/누수": 2, 전기: 1 },
      byStatus: { completed: 2, in_progress: 1 },
      invoicesIssued: 1,
      invoicesPaid: 0,
      invoicesOverdue: 0,
    },
    generatedAt: Timestamp.now(),
    generatedBy: "system",
  });

  const out = {
    password: PASSWORD,
    users: Object.fromEntries(
      Object.entries(USERS).map(([k, v]) => [k, { email: v.email, uid: uids[k], role: v.role }]),
    ),
    buildingId: bid,
    unitId: unitRef.id,
    residentDocId: residentRef.id,
    invoiceId: invoiceRef.id,
    reportId: reportRef.id,
    period,
  };
  const outPath = join(__dirname, "seed-output.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("SEED OK →", outPath);
  console.log(JSON.stringify(out, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("SEED FAILED:", e);
    process.exit(1);
  });
