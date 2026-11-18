"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { KeyRound, Loader2, Lock, RotateCw, Save, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog';
import PasswordSettingCard from '@/components/admin/PasswordSettingCard';

export default function SettingsPanel() {
  const {
    systemName,
    adminPassword,
    resultsPassword,
    allowScoreModification,
    setSystemName,
    setAdminPassword,
    resetAdminPassword,
    setResultsPassword,
    resetResultsPassword,
    resetStore,
    setAllowScoreModification,
  } = useStore();

  const [systemNameInput, setSystemNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isResettingSystem, setIsResettingSystem] = useState(false);
  const [isSavingModification, setIsSavingModification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (systemName) {
      setSystemNameInput(systemName);
    }
  }, [systemName]);

  const handleSaveSystemName = async () => {
    const trimmedName = systemNameInput.trim();
    if (!trimmedName) {
      toast({ title: '오류', description: '시스템 이름을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setIsSavingName(true);
    try {
      await setSystemName(trimmedName);
      toast({ title: '성공', description: '시스템 이름이 변경되었습니다.' });
    } catch (error) {
      console.error('Failed to save system name:', error);
      toast({ title: '오류', description: '시스템 이름 변경에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleResetSystem = async () => {
    setIsResettingSystem(true);
    try {
      await resetStore();
      toast({ title: '시스템 초기화', description: '모든 데이터가 초기화되고 기본값으로 복원되었습니다.' });
    } catch (error) {
      console.error('Failed to reset store:', error);
      toast({ title: '오류', description: '초기화에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsResettingSystem(false);
    }
  };

  const handleToggleScoreModification = async (allow: boolean) => {
    setIsSavingModification(true);
    try {
      await setAllowScoreModification(allow);
      toast({
        title: '성공',
        description: `전체 평가위원의 채점 상태가 일괄적으로 ${allow ? '해제(수정 가능)' : '잠금(수정 불가)'} 상태로 변경되었습니다.`,
      });
    } catch (error) {
      console.error('Failed to save modification setting:', error);
      toast({ title: '오류', description: '설정 변경에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSavingModification(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Save className="mr-2 h-5 w-5" />
            시스템 이름 설정
          </CardTitle>
          <CardDescription>앱 전체에 표시될 시스템의 이름을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="system-name">시스템 이름</Label>
            <Input
              id="system-name"
              value={systemNameInput}
              onChange={(e) => setSystemNameInput(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSystemName} disabled={isSavingName}>
            {isSavingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSavingName ? '저장 중...' : '이름 저장'}
          </Button>
        </CardFooter>
      </Card>

      <PasswordSettingCard
        idPrefix="admin"
        icon={<KeyRound className="mr-2 h-5 w-5" />}
        title="관리자 비밀번호 관리"
        description="일반 관리자 비밀번호를 변경하거나 초기화합니다."
        hasPassword={Boolean(adminPassword)}
        configuredDescription="일반 관리자 비밀번호가 설정되어 있습니다."
        unconfiguredDescription="일반 관리자 비밀번호가 없습니다. 절대 비밀번호로만 로그인이 가능합니다."
        mismatchErrorMessage="새 관리자 비밀번호가 일치하지 않습니다."
        changeSuccessMessage="관리자 비밀번호가 변경되었습니다."
        changeErrorMessage="관리자 비밀번호 변경에 실패했습니다."
        resetDialogTitle="정말 관리자 비밀번호를 초기화하시겠습니까?"
        resetDialogDescription="이 작업은 되돌릴 수 없습니다. 일반 관리자 비밀번호가 영구적으로 삭제되며, 이후에는 절대 비밀번호로만 관리자 페이지에 접근할 수 있습니다."
        resetSuccessMessage="관리자 비밀번호가 초기화되었습니다. 이제 절대 비밀번호로만 로그인할 수 있습니다."
        resetErrorMessage="관리자 비밀번호 초기화에 실패했습니다."
        onChangePassword={setAdminPassword}
        onResetPassword={resetAdminPassword}
      />

      <PasswordSettingCard
        idPrefix="results"
        icon={<Trophy className="mr-2 h-5 w-5" />}
        title="결과 페이지 비밀번호"
        description="'채점 결과' 페이지 접근 전용 비밀번호를 설정합니다."
        hasPassword={Boolean(resultsPassword)}
        configuredDescription="결과 페이지 전용 비밀번호가 설정되어 있습니다."
        unconfiguredDescription="결과 페이지 전용 비밀번호가 없습니다. 절대 비밀번호로만 로그인이 가능합니다."
        mismatchErrorMessage="새 결과 페이지 비밀번호가 일치하지 않습니다."
        changeSuccessMessage="채점 결과 페이지 비밀번호가 변경되었습니다."
        changeErrorMessage="채점 결과 페이지 비밀번호 변경에 실패했습니다."
        resetDialogTitle="정말 결과 페이지 비밀번호를 초기화하시겠습니까?"
        resetDialogDescription="이 작업은 되돌릴 수 없습니다. 결과 페이지 비밀번호가 영구적으로 삭제되며, 이후에는 절대 비밀번호로만 접근할 수 있습니다."
        resetSuccessMessage="채점 결과 페이지 비밀번호가 초기화되었습니다. 이제 절대 비밀번호로만 로그인할 수 있습니다."
        resetErrorMessage="채점 결과 페이지 비밀번호 초기화에 실패했습니다."
        onChangePassword={setResultsPassword}
        onResetPassword={resetResultsPassword}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            채점 수정 권한
          </CardTitle>
          <CardDescription>전체 평가위원의 채점 가능 상태를 일괄적으로 제어합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmActionDialog
            trigger={
              <div className="flex items-center justify-between rounded-lg border p-4 cursor-pointer">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-modification-switch" className="text-base cursor-pointer">
                    수정 권한 활성화
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {allowScoreModification
                      ? '현재 활성화됨. 클릭하여 모든 평가위원의 채점을 잠급니다.'
                      : '현재 비활성화됨. 클릭하여 모든 평가위원의 채점을 해제합니다.'}
                  </p>
                </div>
                <Switch
                  id="allow-modification-switch"
                  checked={allowScoreModification}
                  disabled={isSavingModification}
                  aria-label="채점 수정 허용 토글"
                />
              </div>
            }
            title="정말 변경하시겠습니까?"
            description={
              allowScoreModification
                ? "이 작업을 수행하면 모든 평가위원의 채점이 즉시 '잠금' 상태로 변경되어 더 이상 수정할 수 없게 됩니다."
                : "이 작업을 수행하면 모든 평가위원의 채점이 즉시 '해제' 상태로 변경되어 다시 수정할 수 있게 됩니다."
            }
            confirmLabel={isSavingModification ? '변경 중...' : '확인'}
            isLoading={isSavingModification}
            onConfirm={() => handleToggleScoreModification(!allowScoreModification)}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <RotateCw className="mr-2 h-5 w-5" />
            시스템 초기화
          </CardTitle>
          <CardDescription>
            시스템의 모든 데이터를 영구적으로 삭제하고 초기 상태로 되돌립니다. 이 작업은 되돌릴 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmActionDialog
            trigger={
              <Button variant="destructive" className="w-full">
                시스템 전체 데이터 초기화
              </Button>
            }
            title="정말 시스템을 초기화하시겠습니까?"
            description="모든 평가위원, 대상자, 항목, 채점 결과가 영구적으로 삭제되고, 시스템이 초기 샘플 데이터로 복원됩니다. 이 작업은 되돌릴 수 없습니다."
            confirmLabel={isResettingSystem ? '초기화 중...' : '초기화 진행'}
            destructive
            isLoading={isResettingSystem}
            onConfirm={handleResetSystem}
          />
        </CardContent>
      </Card>
    </div>
  );
}
