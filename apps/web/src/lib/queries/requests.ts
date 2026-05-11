import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { db, storage } from "@/lib/firebase/client";
import type {
  RequestMedia,
  RequestStatus,
  RequestType,
  ServiceRequest,
} from "@/lib/types";

const requestsCol = collection(db, "requests");

export type CreateRequestInput = {
  type: RequestType;
  title: string;
  description: string;
  buildingId: string;
  unitId?: string;
  unitLabel?: string;
  residentId: string;
  residentName?: string;
  category?: string;
  priority?: "low" | "normal" | "high";
  media?: RequestMedia[];
};

export async function createRequest(
  uid: string,
  input: CreateRequestInput,
): Promise<string> {
  const ref = await addDoc(requestsCol, {
    type: input.type,
    title: input.title,
    description: input.description,
    buildingId: input.buildingId,
    unitId: input.unitId ?? null,
    unitLabel: input.unitLabel ?? null,
    residentId: input.residentId,
    residentName: input.residentName ?? null,
    category: input.category ?? null,
    priority: input.priority ?? "normal",
    status: "received" as RequestStatus,
    media: input.media ?? [],
    managerIds: [], // onRequestCreated가 building에서 복사
    countedForResident: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRequest(id: string): Promise<ServiceRequest | null> {
  const snap = await getDoc(doc(requestsCol, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<ServiceRequest, "id">) }) : null;
}

export async function listMyRequests(uid: string): Promise<ServiceRequest[]> {
  const snap = await getDocs(
    query(requestsCol, where("residentId", "==", uid), orderBy("createdAt", "desc"), limit(50)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRequest, "id">) }));
}

export async function listManagerRequests(filter: {
  managerId: string;
  status?: RequestStatus | "open";
}): Promise<ServiceRequest[]> {
  const constraints: QueryConstraint[] = [
    where("managerIds", "array-contains", filter.managerId),
    orderBy("createdAt", "desc"),
    limit(100),
  ];
  if (filter.status && filter.status !== "open") {
    constraints.splice(1, 0, where("status", "==", filter.status));
  }
  const snap = await getDocs(query(requestsCol, ...constraints));
  let docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRequest, "id">) }));
  if (filter.status === "open") {
    docs = docs.filter((r) => r.status !== "completed");
  }
  return docs;
}

export function watchRequest(id: string, cb: (r: ServiceRequest | null) => void): () => void {
  return onSnapshot(doc(requestsCol, id), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<ServiceRequest, "id">) }) : null);
  });
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  patch?: Partial<Pick<ServiceRequest, "assignedTo" | "priority">>,
): Promise<void> {
  await updateDoc(doc(requestsCol, id), {
    status,
    ...(patch ?? {}),
    updatedAt: serverTimestamp(),
    ...(status === "completed" ? { completedAt: serverTimestamp() } : {}),
  });
}

// ---------- 미디어 업로드 ----------

export type UploadProgress = {
  loaded: number;
  total: number;
};

export async function uploadRequestMedia(
  bid: string,
  uid: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<RequestMedia> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) {
    throw new Error("이미지 또는 영상 파일만 업로드할 수 있습니다.");
  }
  if (isVideo && file.size > 100 * 1024 * 1024) {
    throw new Error("영상은 100MB 이하만 가능합니다.");
  }
  if (isImage && file.size > 10 * 1024 * 1024) {
    // 자동 압축 시도
  }

  let toUpload: File = file;
  if (isImage) {
    try {
      toUpload = await imageCompression(file, {
        maxSizeMB: 4,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
    } catch {
      // 압축 실패 시 원본 사용
      toUpload = file;
    }
  }

  const ts = Date.now();
  const safeName = toUpload.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `requests/${bid}/_pending/${uid}/${ts}_${safeName}`;
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, toUpload, {
    contentType: toUpload.type,
    customMetadata: { uploaderUid: uid },
  });

  return new Promise<RequestMedia>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.({ loaded: snap.bytesTransferred, total: snap.totalBytes }),
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          kind: isVideo ? "video" : "image",
          path,
          url,
          sizeBytes: toUpload.size,
        });
      },
    );
  });
}
