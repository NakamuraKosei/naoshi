// プランごとの制限定義（requirements.md 第7章・第3.4章）
//
// ■ 制限方式
//   - 無料プラン: 回数制限（300字/回 × 3回/月）
//   - 有料プラン: 期間文字数制限（1回あたり上限 + 期間合計文字数上限）
//
// ■ リセット: 全プラン共通、毎月1日 JST 0:00

export type PlanKey = "free" | "light" | "heavy_monthly" | "heavy_yearly";

// 制限の種類
export type LimitType = "count" | "chars";

// リセット周期
export type ResetCycle = "monthly" | "weekly";

export type PlanRule = {
  // 1回あたりの最大入力文字数
  maxChars: number;
  // 制限方式: count=回数ベース、chars=文字数ベース
  limitType: LimitType;
  // 期間上限（回数 or 文字数、limitType に対応）
  periodLimit: number;
  // リセット周期
  resetCycle: ResetCycle;
  // 表示用ラベル
  label: string;
};

// プラン別ルール
export const PLAN_RULES: Record<PlanKey, PlanRule> = {
  free: {
    maxChars: 300,
    limitType: "count",
    periodLimit: 3,
    resetCycle: "monthly",
    label: "無料",
  },
  light: {
    maxChars: 2000,
    limitType: "chars",
    periodLimit: 17_500,
    resetCycle: "weekly",
    label: "ライト（週）",
  },
  heavy_monthly: {
    maxChars: 5000,
    limitType: "chars",
    periodLimit: 150_000,
    resetCycle: "monthly",
    label: "ヘビー（月）",
  },
  heavy_yearly: {
    maxChars: 10000,
    limitType: "chars",
    periodLimit: 150_000,
    resetCycle: "monthly",
    label: "ヘビー（年）",
  },
};

// 指定プランのルールを取得。未知のプランは free 扱い
export function getPlanRule(plan: string | null | undefined): PlanRule {
  if (plan && plan in PLAN_RULES) {
    return PLAN_RULES[plan as PlanKey];
  }
  return PLAN_RULES.free;
}

// JST は UTC+9 固定
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 今月1日 JST 0:00 を UTC Date として返す
export function getMonthStart(): Date {
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  jstNow.setUTCDate(1);
  jstNow.setUTCHours(0, 0, 0, 0);
  return new Date(jstNow.getTime() - JST_OFFSET_MS);
}

// 今週月曜日 JST 0:00 を UTC Date として返す（週プラン用）
export function getWeekStart(): Date {
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  // 曜日を取得（0=日, 1=月, ..., 6=土）→ 月曜起点に変換
  const day = jstNow.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // 日曜は6日前の月曜
  jstNow.setUTCDate(jstNow.getUTCDate() - diff);
  jstNow.setUTCHours(0, 0, 0, 0);
  return new Date(jstNow.getTime() - JST_OFFSET_MS);
}

// プランに応じたリセット起点を返す
export function getPeriodStart(resetCycle: ResetCycle): Date {
  return resetCycle === "weekly" ? getWeekStart() : getMonthStart();
}
