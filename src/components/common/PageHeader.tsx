
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/common/Logo";
import { useStore } from "@/lib/store";

export function PageHeader() {
  const { systemName } = useStore();

  useEffect(() => {
    if (systemName) {
      document.title = `${systemName} | 채점 및 집계 시스템`;
    }
  }, [systemName]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-3" aria-label="홈으로 이동">
          <Logo />
          <span className="text-xl font-bold tracking-tight text-primary">
            {systemName || "이발마스터 프로"}
          </span>
        </Link>
      </div>
    </header>
  );
}
