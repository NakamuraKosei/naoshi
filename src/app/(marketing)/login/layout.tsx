import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description:
    "Naoshi にメールアドレス��ログイン。パスワード不要、マジック��ンクで簡単にログインできます。",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
