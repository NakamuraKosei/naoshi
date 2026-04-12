// 利用制限チェックユーティリティ
// /api/humanize から呼び出し、ユーザーが利用可能かを判定する。
//
// ■ 制限方式（requirements.md 第3.4章）
//   - 無料: 回数制限（3回/月）
//   - 有料: 月間文字数制限（入力文字数の合計）
// ■ リセット: 毎月1日 JST 0:00

import { createClient } from "@/lib/supabase/server";
import { getPlanRule, getMonthStart, type PlanKey, type LimitType } from "@/lib/usage/plans";

// 制限チェック結果
export type LimitCheckResult = {
  // 使用可能かどうか
  allowed: boolean;
  // プラン名
  plan: PlanKey;
  // 1回あたりの文字数上限
  maxChars: number;
  // 制限方式
  limitType: LimitType;
  // 月間上限（回数 or 文字数）
  monthlyLimit: number;
  // 今月の使用量（回数 or 文字数、limitType に対応）
  used: number;
  // 残り（回数 or 文字数）
  remaining: number;
  // 不許可の場合の理由
  reason?: "unauthenticated" | "quota_exceeded";
};

// userId を省略すると現在セッションから取得する
export async function checkLimit(
  userId?: string,
): Promise<LimitCheckResult> {
  const supabase = await createClient();

  // userId 未指定ならセッションから取得
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        allowed: false,
        plan: "free",
        maxChars: 300,
        limitType: "count",
        monthlyLimit: 3,
        used: 0,
        remaining: 0,
        reason: "unauthenticated",
      };
    }
    uid = user.id;
  }

  // プロフィールからプラン取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", uid)
    .maybeSingle();

  const plan = (profile?.plan ?? "free") as PlanKey;
  const rule = getPlanRule(plan);

  // 今月1日のリセット起点
  const monthStart = getMonthStart();

  // 制限方式に応じて使用量を計算
  let used: number;

  if (rule.limitType === "count") {
    // 回数ベース（無料プラン）: 今月の使用回数をカウント
    const { count } = await supabase
      .from("usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .gte("used_at", monthStart.toISOString());

    used = count ?? 0;
  } else {
    // 文字数ベース（有料プラン）: 今月の入力文字数合計
    const { data } = await supabase
      .from("usage")
      .select("input_chars")
      .eq("user_id", uid)
      .gte("used_at", monthStart.toISOString());

    used = (data ?? []).reduce((sum, row) => sum + (row.input_chars ?? 0), 0);
  }

  const remaining = Math.max(0, rule.monthlyLimit - used);
  const allowed = remaining > 0;

  return {
    allowed,
    plan,
    maxChars: rule.maxChars,
    limitType: rule.limitType,
    monthlyLimit: rule.monthlyLimit,
    used,
    remaining,
    reason: allowed ? undefined : "quota_exceeded",
  };
}
