// 利用制限チェックユーティリティ
// /api/humanize から呼び出し、ユーザーが利用可能かを判定する。
//
// ■ 制限方式（requirements.md 第3.4章）
//   - 無料: 回数制限（3回/月）
//   - ライト: 週間文字数制限（17,500字/週）
//   - ヘビー: 月間文字数制限（150,000字/月）
// ■ リセット: 無料・ヘビー=毎月1日 JST 0:00、ライト=毎週月曜 JST 0:00

import { createClient } from "@/lib/supabase/server";
import { getPlanRule, getPeriodStart, type PlanKey, type LimitType, type ResetCycle } from "@/lib/usage/plans";

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
  // 期間上限（回数 or 文字数）
  periodLimit: number;
  // リセット周期
  resetCycle: ResetCycle;
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
        periodLimit: 3,
        resetCycle: "monthly" as ResetCycle,
        used: 0,
        remaining: 0,
        reason: "unauthenticated",
      };
    }
    uid = user.id;
  }

  // プロフィールからプラン・プラン変更日を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_changed_at")
    .eq("id", uid)
    .maybeSingle();

  const plan = (profile?.plan ?? "free") as PlanKey;
  const rule = getPlanRule(plan);

  // プランに応じたリセット起点（週次 or 月次）
  const periodStart = getPeriodStart(rule.resetCycle);

  // プラン変更日以降の使用量のみカウント（プラン変更でリセット）
  const planChangedAt = profile?.plan_changed_at ? new Date(profile.plan_changed_at) : null;
  const effectiveStart = planChangedAt && planChangedAt > periodStart ? planChangedAt : periodStart;

  // 制限方式に応じて使用量を計算
  let used: number;

  if (rule.limitType === "count") {
    // 回数ベース（無料プラン）: 期間内の使用回数をカウント
    const { count } = await supabase
      .from("usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .gte("used_at", effectiveStart.toISOString());

    used = count ?? 0;
  } else {
    // 文字数ベース（有料プラン）: 期間内の入力文字数合計
    const { data } = await supabase
      .from("usage")
      .select("input_chars")
      .eq("user_id", uid)
      .gte("used_at", effectiveStart.toISOString());

    used = (data ?? []).reduce((sum, row) => sum + (row.input_chars ?? 0), 0);
  }

  const remaining = Math.max(0, rule.periodLimit - used);
  const allowed = remaining > 0;

  return {
    allowed,
    plan,
    maxChars: rule.maxChars,
    limitType: rule.limitType,
    periodLimit: rule.periodLimit,
    resetCycle: rule.resetCycle,
    used,
    remaining,
    reason: allowed ? undefined : "quota_exceeded",
  };
}
