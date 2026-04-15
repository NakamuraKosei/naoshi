// 変換完了後の使用実績記録ユーティリティ
// /api/humanize の末尾から呼び出す想定。
//
// 使い方（C 担当への引き継ぎ）:
//   import { recordUsage } from "@/lib/usage/record-usage";
//   await recordUsage({
//     userId: user.id,
//     inputChars: input.length,
//     outputChars: output.length,
//     style: "dearu" | "desumasu",
//     durationMs: Date.now() - startedAt,
//   });

import { createClient } from "@/lib/supabase/server";

export type RecordUsageInput = {
  // ユーザー ID（省略時はセッションから取得）
  userId?: string;
  // 入力文字数
  inputChars: number;
  // 出力文字数
  outputChars: number;
  // 文体
  style: "dearu" | "desumasu";
  // 変換モード（標準 / AI対策強化）
  mode?: "standard" | "evasion";
  // 変換にかかった時間（ミリ秒）
  durationMs: number;
};

// usage テーブルに 1 行 INSERT する
// 入力テキスト本文は保存しない（プライバシー保護、requirements.md 4.2）
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const supabase = await createClient();

  let userId = input.userId;
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    userId = user.id;
  }

  await supabase.from("usage").insert({
    user_id: userId,
    used_at: new Date().toISOString(),
    input_chars: input.inputChars,
    output_chars: input.outputChars,
    style: input.style,
    mode: input.mode ?? "standard",
    duration_ms: input.durationMs,
  });
}
