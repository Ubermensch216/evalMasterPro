import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/toaster";
import { PageHeader } from "@/components/common/PageHeader";
import PermissionErrorDisplay from "@/components/common/PermissionErrorDisplay";

export const metadata: Metadata = {
  title: "이발마스터 프로 | EvalMaster Pro",
  description: "채점 및 집계 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <StoreProvider>
          <div className="flex min-h-screen w-full flex-col">
            <PageHeader />
            <PermissionErrorDisplay />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
