import type { MetadataRoute } from "next";

// robots.txt の生成
// 検索エンジンにクロール許可・禁止ルールを伝える
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naoshi.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // ログイン必須ページ・APIはクロール不要
        disallow: ["/app", "/account", "/history", "/api/", "/auth/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
