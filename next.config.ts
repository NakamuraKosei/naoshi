import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // セキュリティヘッダー（OWASP推奨ベース）
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // MIMEスニッフィング防止
        { key: "X-Content-Type-Options", value: "nosniff" },
        // クリックジャッキング防止
        { key: "X-Frame-Options", value: "DENY" },
        // XSSフィルター有効化（レガシーブラウザ向け）
        { key: "X-XSS-Protection", value: "1; mode=block" },
        // リファラー情報の制限
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // HTTPS強制（Vercelはデフォルトで対応済みだが明示）
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        // 権限ポリシー（不要なAPIへのアクセスを制限）
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        // CSP（Content Security Policy）— XSSインジェクション防止
        // 'unsafe-inline': Next.jsがインラインstyleを使用するため必要
        // connect-src: Supabase / Stripe の外部API通信を許可
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' https: data:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co https://api.stripe.com",
            "frame-src https://js.stripe.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
