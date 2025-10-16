"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResultsLoginProps {
  onLogin: (password: string) => boolean;
}

export default function ResultsLogin({ onLogin }: ResultsLoginProps) {
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(password)) {
      toast({
        title: "로그인 실패",
        description: "비밀번호를 확인해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">접근 제한</CardTitle>
            <CardDescription>결과를 확인하려면 관리자 비밀번호를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              결과 보기
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
