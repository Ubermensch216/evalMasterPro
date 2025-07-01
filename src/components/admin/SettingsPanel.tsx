
"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RotateCw, KeyRound, Loader2, Save, Eraser, ShieldCheck, ShieldAlert, ShieldLock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export default function SettingsPanel() {
  const { 
    systemName, 
    adminPassword, 
    allowScoreModification,
    setSystemName, 
    setAdminPassword, 
    resetAdminPassword, 
    resetStore,
    setAllowScoreModification
  } = useStore();
  
  const [systemNameInput, setSystemNameInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isResetingPassword, setIsResetingPassword] = useState(false);
  const [isResetingSystem, setIsResetingSystem] = useState(false);
  const [isSavingModification, setIsSavingModification] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (systemName) {
      setSystemNameInput(systemName);
    }
  }, [systemName]);

  const handleSaveSystemName = async () => {
    if (!systemNameInput) {
      toast({ title: "오류", description: "시스템 이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    setIsSavingName(true);
    try {
      await setSystemName(systemNameInput);
      toast({ title: "성공", description: "시스템 이름이 변경되었습니다." });
    } catch (error) {
      console.error("Failed to save system name:", error);
      toast({ title: "오류", description: "시스템 이름 변경에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: "오류", description: "새 비밀번호가 일치하지 않습니다.", variant: "destructive" });
      return;
    }
    setIsSavingPassword(true);
    try {
      await setAdminPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "성공", description: "관리자 비밀번호가 변경되었습니다." });
    } catch (error) {
      console.error("Failed to change password:", error);
      toast({ title: "오류", description: "비밀번호 변경에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  };
  
  const handleResetPassword = async () => {
    setIsResetingPassword(true);
    try {
      await resetAdminPassword();
      toast({ title: "성공", description: "관리자 비밀번호가 초기화되었습니다. 이제 절대 비밀번호로만 로그인할 수 있습니다." });
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast({ title: "오류", description: "비밀번호 초기화에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsResetingPassword(false);
    }
  };

  const handleResetSystem = async () => {
    setIsResetingSystem(true);
    try {
      await resetStore();
      toast({ title: "시스템 초기화", description: "모든 데이터가 초기화되고 기본값으로 복원되었습니다." });
    } catch(error) {
      console.error("Failed to reset store:", error);
      toast({ title: "오류", description: "초기화에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsResetingSystem(false);
    }
  };

  const handleToggleScoreModification = async (allow: boolean) => {
    setIsSavingModification(true);
    try {
      await setAllowScoreModification(allow);
      toast({ title: "성공", description: `채점 수정 권한이 ${allow ? '허용' : '차단'}되었습니다.` });
    } catch (error) {
      console.error("Failed to save modification setting:", error);
      toast({ title: "오류", description: "설정 변경에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSavingModification(false);
    }
  };


  return (
    <div className="grid gap-6 md:grid-cols-2">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Save className="mr-2 h-5 w-5" />시스템 이름 설정</CardTitle>
          <CardDescription>앱 전체에 표시될 시스템의 이름을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="system-name">시스템 이름</Label>
            <Input id="system-name" value={systemNameInput} onChange={(e) => setSystemNameInput(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSystemName} disabled={isSavingName}>
            {isSavingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSavingName ? "저장 중..." : "이름 저장"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5" />관리자 비밀번호 관리</CardTitle>
          <CardDescription>일반 관리자 비밀번호를 변경하거나 초기화합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminPassword ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>비밀번호 설정됨</AlertTitle>
              <AlertDescription>일반 관리자 비밀번호가 설정되어 있습니다.</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>비밀번호 설정 안됨</AlertTitle>
              <AlertDescription>일반 관리자 비밀번호가 없습니다. 절대 비밀번호로만 로그인이 가능합니다.</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 입력" />
          </div>
          <div>
            <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="새 비밀번호 다시 입력"/>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleChangePassword} disabled={isSavingPassword}>
            {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSavingPassword ? "변경 중..." : "비밀번호 변경"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" disabled={!adminPassword || isResetingPassword}>
                <Eraser className="mr-2 h-4 w-4" />
                초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 관리자 비밀번호를 초기화하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 일반 관리자 비밀번호가 영구적으로 삭제되며, 이후에는 절대 비밀번호로만 관리자 페이지에 접근할 수 있습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetingPassword}>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPassword} disabled={isResetingPassword} className="bg-destructive hover:bg-destructive/90">
                   {isResetingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {isResetingPassword ? "초기화 중..." : "초기화 진행"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldLock className="mr-2 h-5 w-5" />채점 수정 권한</CardTitle>
          <CardDescription>평가위원이 제출 완료 후 점수를 수정할 수 있는지 여부를 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="allow-modification-switch" className="text-base">
                제출 후 수정 허용
              </Label>
              <p className="text-sm text-muted-foreground">
                이 기능이 꺼지면, 채점 완료 후에는 점수를 수정할 수 없습니다.
              </p>
            </div>
            <Switch
              id="allow-modification-switch"
              checked={allowScoreModification}
              onCheckedChange={handleToggleScoreModification}
              disabled={isSavingModification}
              aria-label="채점 수정 허용 토글"
            />
          </div>
        </CardContent>
      </Card>


      <Card className="border-destructive md:col-span-2">
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
                  모든 평가위원, 대상자, 항목, 채점 결과가 영구적으로 삭제되고, 시스템이 초기 샘플 데이터로 복원됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetingSystem}>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSystem} className="bg-destructive hover:bg-destructive/90" disabled={isResetingSystem}>
                   {isResetingSystem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {isResetingSystem ? "초기화 중..." : "초기화 진행"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
