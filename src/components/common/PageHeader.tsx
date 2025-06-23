import Link from "next/link";
import { Logo } from "@/components/common/Logo";

export function PageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-3" aria-label="홈으로 이동">
          <Logo />
          <span className="text-xl font-bold tracking-tight text-primary">
            이발마스터 프로
          </span>
        </Link>
      </div>
    </header>
  );
}
