"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Shield, Trophy, ArrowRight } from "lucide-react";

export default function Home() {
  const menuItems = [
    {
      href: "/evaluate",
      title: "평가 위원",
      description: "채점을 진행하고 결과를 제출합니다.",
      icon: <Users className="h-8 w-8 text-primary" />,
    },
    {
      href: "/admin",
      title: "관리자",
      description: "시스템 설정을 관리하고 결과를 집계합니다.",
      icon: <Shield className="h-8 w-8 text-primary" />,
    },
    {
      href: "/results",
      title: "채점 결과",
      description: "종합 채점 결과를 확인합니다.",
      icon: <Trophy className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">이발마스터 프로</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          정확하고 효율적인 채점 및 집계 시스템
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.href} legacyBehavior>
            <a className="block group">
              <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:border-primary">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {item.icon}
                    <div>
                      <CardTitle className="text-2xl font-bold">{item.title}</CardTitle>
                      <CardDescription className="mt-1">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-end text-sm font-semibold text-primary">
                    이동하기
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
