import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { GoogleAuth } from "google-auth-library";

/**
 * Firestore 자동 백업 — 매일 03:00 KST, 지정한 GCS 버킷으로 전체 컬렉션 export.
 *
 * 필수:
 *  - Blaze(종량제) 플랜
 *  - GCS 버킷 사전 생성 (예: gs://ant-cleaning-backup, asia-northeast3)
 *  - 함수 서비스계정에 Datastore Import Export Admin, Storage Object Admin 권한 부여
 *
 * 환경:
 *  - FIRESTORE_BACKUP_BUCKET 시크릿: gs://bucket-name (gs:// 접두어 필수)
 *
 * 본 함수는 Firestore Admin REST API의 exportDocuments 엔드포인트를 호출한다.
 * 자세한 가이드: https://firebase.google.com/docs/firestore/solutions/schedule-export
 */
export const FIRESTORE_BACKUP_BUCKET = defineSecret("FIRESTORE_BACKUP_BUCKET");

export const firestoreBackupJob = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Asia/Seoul",
    secrets: [FIRESTORE_BACKUP_BUCKET],
    timeoutSeconds: 540,
  },
  async () => {
    const bucket = FIRESTORE_BACKUP_BUCKET.value();
    if (!bucket) {
      logger.warn("FIRESTORE_BACKUP_BUCKET secret missing, skipping backup");
      return;
    }
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) {
      logger.error("GCLOUD_PROJECT env missing");
      return;
    }

    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/datastore"],
    });
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;

    const today = new Date().toISOString().slice(0, 10);
    const outputUriPrefix = `${bucket.replace(/\/+$/, "")}/${today}`;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ outputUriPrefix }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error("Firestore export failed", { status: res.status, body: text });
      throw new Error(`Firestore export ${res.status}: ${text}`);
    }
    const body = await res.json();
    logger.info("Firestore export started", { outputUriPrefix, operation: body.name });
  },
);
