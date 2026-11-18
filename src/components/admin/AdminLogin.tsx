"use client";

import { Shield } from 'lucide-react';
import PasswordLoginCard from '@/components/common/PasswordLoginCard';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

/**
 * Login form for administrators.
 */
export default function AdminLogin({ onLogin }: AdminLoginProps) {
  return (
    <PasswordLoginCard
      title="관리자 로그인"
      description="관리자 비밀번호를 입력하여 접속하세요."
      submitLabel="로그인"
      icon={<Shield className="h-12 w-12 text-primary" />}
      onLogin={onLogin}
    />
  );
}
