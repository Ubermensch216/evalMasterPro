"use client";

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eraser, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog';

interface PasswordSettingCardProps {
  idPrefix: string;
  icon: ReactNode;
  title: string;
  description: string;
  hasPassword: boolean;
  configuredDescription: string;
  unconfiguredDescription: string;
  mismatchErrorMessage: string;
  changeSuccessMessage: string;
  changeErrorMessage: string;
  resetDialogTitle: string;
  resetDialogDescription: string;
  resetSuccessMessage: string;
  resetErrorMessage: string;
  onChangePassword: (password: string) => Promise<void>;
  onResetPassword: () => Promise<void>;
}

/**
 * Reusable settings card for updating and clearing a role-specific access password.
 */
export default function PasswordSettingCard({
  idPrefix,
  icon,
  title,
  description,
  hasPassword,
  configuredDescription,
  unconfiguredDescription,
  mismatchErrorMessage,
  changeSuccessMessage,
  changeErrorMessage,
  resetDialogTitle,
  resetDialogDescription,
  resetSuccessMessage,
  resetErrorMessage,
  onChangePassword,
  onResetPassword,
}: PasswordSettingCardProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: '오류', description: mismatchErrorMessage, variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await onChangePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: '성공', description: changeSuccessMessage });
    } catch (error) {
      console.error(`Failed to change password (${idPrefix}):`, error);
      toast({ title: '오류', description: changeErrorMessage, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetPassword();
      toast({ title: '성공', description: resetSuccessMessage });
    } catch (error) {
      console.error(`Failed to reset password (${idPrefix}):`, error);
      toast({ title: '오류', description: resetErrorMessage, variant: 'destructive' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPassword ? (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>비밀번호 설정됨</AlertTitle>
            <AlertDescription>{configuredDescription}</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>비밀번호 설정 안됨</AlertTitle>
            <AlertDescription>{unconfiguredDescription}</AlertDescription>
          </Alert>
        )}
        <div>
          <Label htmlFor={`new-${idPrefix}-password`}>새 비밀번호</Label>
          <Input
            id={`new-${idPrefix}-password`}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 입력"
          />
        </div>
        <div>
          <Label htmlFor={`confirm-${idPrefix}-password`}>새 비밀번호 확인</Label>
          <Input
            id={`confirm-${idPrefix}-password`}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 다시 입력"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? '변경 중...' : '비밀번호 변경'}
        </Button>
        <ConfirmActionDialog
          trigger={
            <Button variant="secondary" disabled={!hasPassword || isResetting}>
              <Eraser className="mr-2 h-4 w-4" />
              초기화
            </Button>
          }
          title={resetDialogTitle}
          description={resetDialogDescription}
          confirmLabel={isResetting ? '초기화 중...' : '초기화 진행'}
          destructive
          isLoading={isResetting}
          onConfirm={handleReset}
        />
      </CardFooter>
    </Card>
  );
}
