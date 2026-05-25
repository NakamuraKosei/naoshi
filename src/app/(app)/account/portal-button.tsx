"use client";

// 料金ページへの誘導ボタン（全ユーザー共通）
// プラン変更・解約は /pricing 経由で行う

import { Button } from "@/components/ui/button";

export function PortalButton() {
  return (
    <Button
      variant="primary"
      onClick={() => {
        window.location.href = "/pricing";
      }}
    >
      プランを選ぶ
    </Button>
  );
}
