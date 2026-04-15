import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

// 日本語本文用フォント（design.md 3.1）
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// 英数字・ロゴ用フォント（design.md 3.1 / 8.1）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// サイト全体のメタデータ（design.md 9.1 のタグラインを採用）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naoshi.app";
const siteName = "Naoshi（ナオシ）";
const siteDescription =
  "AIが書いた日本語レポートを、自然な日本語に整えるツールです。";

export const metadata: Metadata = {
  title: {
    default: `${siteName} — AIで書いたレポートを、自然な日本語に。`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: "Naoshi",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName,
    title: "AIで書いたレポートを、自然な日本語に。",
    description: siteDescription,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naoshi — AIで書いたレポートを、自然な日本語に。",
    description: siteDescription,
  },
};

// 構造化データ（JSON-LD）— Google Rich Snippets 対応
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  offers: [
    {
      "@type": "Offer",
      name: "無料プラン",
      price: "0",
      priceCurrency: "JPY",
    },
    {
      "@type": "Offer",
      name: "ライトプラン（週）",
      price: "500",
      priceCurrency: "JPY",
      billingIncrement: "P1W",
    },
    {
      "@type": "Offer",
      name: "ヘビープラン（月）",
      price: "2980",
      priceCurrency: "JPY",
      billingIncrement: "P1M",
    },
    {
      "@type": "Offer",
      name: "ヘビープラン（年）",
      price: "24000",
      priceCurrency: "JPY",
      billingIncrement: "P1Y",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-text-primary">
        {children}
      </body>
    </html>
  );
}
