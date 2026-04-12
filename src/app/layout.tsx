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
  "日本の大学生のための、日本語特化ヒューマナイザー。AI特有の文体を自然な日本語に整えます。";

export const metadata: Metadata = {
  title: {
    default: `${siteName} — AIで書いたレポートを、ちゃんと人間の言葉に。`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: "Naoshi",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName,
    title: "AIで書いたレポートを、ちゃんと人間の言葉に。",
    description: siteDescription,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naoshi — AIで書いたレポートを、ちゃんと人間の言葉に。",
    description: siteDescription,
  },
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
      <body className="min-h-full flex flex-col bg-surface text-text-primary">
        {children}
      </body>
    </html>
  );
}
