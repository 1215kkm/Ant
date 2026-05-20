import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/queries/posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ant-cleaning.web.app";

// 요청 시점에 생성한다. 빌드 타임에 Firebase 미설정 상태로 실행되어
// 페이지 데이터 수집이 실패하는 것을 방지한다.
export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1시간

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await listPublishedPosts();
    postEntries = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt.toMillis()) : undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    /* 빌드 시 Firebase 미설정이면 비워둔다. */
  }
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.9 },
    ...postEntries,
  ];
}
