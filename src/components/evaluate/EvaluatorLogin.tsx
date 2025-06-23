"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EvaluatorLoginProps {
  onLogin: (evaluatorId: string, password: string) => boolean;
}

export default function EvaluatorLogin({ onLogin }: EvaluatorLoginProps) {
  const { evaluators, loading } = useStore();
  const [selectedEvaluator, setSelectedEvaluator] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvaluator) {
      toast({
        title: "로그인 오류",
        description: "평가 위원을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!onLogin(selectedEvaluator, password)) {
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
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">평가 위원 로그인</CardTitle>
            <CardDescription>이름을 선택하고 비밀번호를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evaluator">평가 위원</Label>
              <Select onValueChange={setSelectedEvaluator} value={selectedEvaluator} disabled={loading}>
                <SelectTrigger id="evaluator">
                  <SelectValue placeholder={loading ? "위원 목록 로딩 중..." : "이름을 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {evaluators.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "로딩 중..." : "채점 페이지로 이동"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
