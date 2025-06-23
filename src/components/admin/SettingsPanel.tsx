"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RotateCw, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPanel() {
  const { adminPassword, setAdminPassword, resetStore } = useStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleChangePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: "오류", description: "새 비밀번호가 일치하지 않습니다.", variant: "destructive" });
      return;
    }
    setAdminPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "성공", description: "관리자 비밀번호가 변경되었습니다." });
  };

  const handleReset = () => {
    resetStore();
    toast({ title: "시스템 초기화", description: "모든 데이터가 초기화되었습니다." });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5" />일반 비밀번호 변경</CardTitle>
          <CardDescription>관리자 일반 비밀번호를 변경합니다. 절대 비밀번호(0000)는 변경할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleChangePassword}>비밀번호 변경</Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive"><RotateCw className="mr-2 h-5 w-5" />시스템 초기화</CardTitle>
          <CardDescription>시스템의 모든 데이터를 영구적으로 삭제하고 초기 상태로 되돌립니다. 이 작업은 되돌릴 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">시스템 전체 데이터 초기화</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 시스템을 초기화하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  모든 평가위원, 대상자, 항목, 채점 결과가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">초기화 진행</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
