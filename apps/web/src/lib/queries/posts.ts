import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { db, storage } from "@/lib/firebase/client";
import type { BlogImage, BlogPost } from "@/lib/types";

const col = collection(db, "posts");

export async function listPublishedPosts(): Promise<BlogPost[]> {
  const snap = await getDocs(
    query(col, where("published", "==", true), orderBy("publishedAt", "desc"), limit(50)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) }));
}

export async function listAllPostsForManager(): Promise<BlogPost[]> {
  const snap = await getDocs(query(col, orderBy("updatedAt", "desc"), limit(100)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) }));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const snap = await getDocs(query(col, where("slug", "==", slug), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<BlogPost, "id">) };
}

export async function getPost(id: string): Promise<BlogPost | null> {
  const snap = await getDoc(doc(col, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<BlogPost, "id">) }) : null;
}

export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(col, id), { viewCount: increment(1) }).catch(() => null);
}

export type CreatePostInput = {
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  heroImage?: BlogImage;
  beforeAfter?: { before: BlogImage; after: BlogImage; caption?: string }[];
  tags?: string[];
  buildingId?: string;
  authorId: string;
  authorName?: string;
  publish?: boolean;
};

export async function createPost(input: CreatePostInput): Promise<string> {
  const ref = await addDoc(col, {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt ?? null,
    body: input.body,
    heroImage: input.heroImage ?? null,
    beforeAfter: input.beforeAfter ?? [],
    tags: input.tags ?? [],
    buildingId: input.buildingId ?? null,
    authorId: input.authorId,
    authorName: input.authorName ?? null,
    published: Boolean(input.publish),
    publishedAt: input.publish ? serverTimestamp() : null,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePost(
  id: string,
  patch: Partial<CreatePostInput> & { publish?: boolean },
): Promise<void> {
  const data: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.publish === true) {
    data.published = true;
    data.publishedAt = serverTimestamp();
  } else if (patch.publish === false) {
    data.published = false;
  }
  delete data.publish;
  await updateDoc(doc(col, id), data);
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(col, id));
}

export async function uploadPostImage(
  postSlug: string,
  uid: string,
  file: File,
): Promise<BlogImage> {
  if (!file.type.startsWith("image/")) throw new Error("이미지만 업로드 가능합니다.");
  let toUpload = file;
  try {
    toUpload = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
  } catch {
    /* 압축 실패는 무시 */
  }
  const ts = Date.now();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `posts/${postSlug}/${ts}_${safe}`;
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, toUpload, {
    contentType: toUpload.type,
    customMetadata: { uploaderUid: uid },
  });
  await task;
  const url = await getDownloadURL(task.snapshot.ref);
  return { path, url };
}
