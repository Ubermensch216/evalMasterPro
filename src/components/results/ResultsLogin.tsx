"use client";

import { Trophy } from 'lucide-react';
import PasswordLoginCard from '@/components/common/PasswordLoginCard';

interface ResultsLoginProps {
  onLogin: (password: string) => boolean;
}

/**
 * Login form guarding access to the public evaluation results view.
 */
export default function ResultsLogin({ onLogin }: ResultsLoginProps) {
  return (
    <PasswordLoginCard
      title="접근 제한"
      description="결과를 확인하려면 결과 열람 비밀번호를 입력하세요."
      submitLabel="결과 보기"
      icon={<Trophy className="h-12 w-12 text-primary" />}
      onLogin={onLogin}
    />
  );
}
