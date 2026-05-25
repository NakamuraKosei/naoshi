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
const siteName = "AIヒューマナイザー Naoshi（ナオシ）| AI文章を自然な日本語に";
const siteDescription =
  "日本語特化のAIヒューマナイザー。AIで書いたレポートを貼り付けるだけで、人が書いたような自然な文章に仕上がります。";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | Naoshi（ナオシ）`,
  },
  description: siteDescription,
  applicationName: "Naoshi",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    locale: "ja_JP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Naoshi — AIで書いたレポートを自然な日本語に変換するツール",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og-image.png"],
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
