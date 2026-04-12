/**
 * 外部依存なしの最小 classNames 合成ユーティリティ。
 * clsx 相当のAPIで、文字列・条件式・配列・オブジェクトを受け取れる。
 *
 * 使用例:
 *   cn("a", condition && "b", { c: true, d: false }) // => "a b c"
 */
type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: unknown };

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
      continue;
    }

    if (typeof input === "object") {
      for (const key in input) {
        if (input[key]) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}
