import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ant-cleaning.web.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/manage/", "/settings"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
