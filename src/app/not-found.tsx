import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

// 404 page
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          ページが見つかりません
        </h1>
        <p className="mt-3 text-base text-text-secondary">
          お探しのページは移動または削除された可能性があります。
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button variant="primary">トップページへ戻る</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
