"use client";

import { useStore } from '@/lib/store';
import { Info } from 'lucide-react';

/**
 * Displays a subtle informational bar when running in offline Local Demo Mode.
 */
export default function DemoModeBanner() {
  const { isDemoMode, loading } = useStore();

  if (loading || !isDemoMode) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs sm:text-sm text-amber-900">
      <div className="container mx-auto flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>로컬 데모 모드</strong>로 실행 중입니다. 데이터는 현재 브라우저에 저장되며(동일 브라우저 탭 간 실시간 동기화), 초기 비밀번호는{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-semibold">1</code> (비상 관리자{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-semibold">0132</code>)입니다.
        </span>
      </div>
    </div>
  );
}
