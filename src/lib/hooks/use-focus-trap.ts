"use client";

import { useEffect, useRef } from "react";

/**
 * モーダル内にフォーカスを閉じ込めるカスタムフック
 * - モーダルが開いた時に最初のフォーカス可能な要素にフォーカス
 * - Tabキーでモーダル内を循環（外に出ない）
 * - Escapeキーで閉じるコールバックを呼び出し
 */
export function useFocusTrap(isOpen: boolean, onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const el = ref.current;

    // フォーカス可能な要素を取得する関数
    function getFocusable(): HTMLElement[] {
      if (!el) return [];
      return Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    // モーダルが開いた時に最初の要素にフォーカス
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Escapeで閉じる
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Tabキーでフォーカスを循環させる
      if (e.key === "Tab") {
        const items = getFocusable();
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: 最初の要素から戻ったら最後へ
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: 最後の要素から進んだら最初へ
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return ref;
}
