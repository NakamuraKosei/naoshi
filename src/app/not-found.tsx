import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

// 404 page
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lighter">
          <span className="text-2xl font-bold text-primary">404</span>
        </div>
        <h1 className="mt-5 text-xl font-bold text-text-primary">
          ページが見つかりません
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
          お探しのページは移動または削除された
          <br />
          可能性があります。
        </p>
        <div className="mt-7">
          <Link href="/">
            <Button variant="primary">トップページへ戻る</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
