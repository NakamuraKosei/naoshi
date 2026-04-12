// Next.js 16 プロキシ（旧 middleware.ts）
// ファイル名は `proxy.ts`。プロジェクトルートに配置して app と同階層にする。
// 主目的: Supabase セッションのリフレッシュ＋保護ルートのリダイレクト

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// プロキシ関数本体
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// マッチャ: 静的アセットや画像最適化・favicon を除外
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
