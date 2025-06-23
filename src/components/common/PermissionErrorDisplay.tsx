"use client";

import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PermissionErrorDisplay() {
  const { permissionError } = useStore();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Dialog open={permissionError} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-3xl"
        hideCloseButton={true}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-destructive">
            <AlertTriangle className="h-8 w-8" />
            중요: Firebase 권한 설정 필요
          </DialogTitle>
        </DialogHeader>
        <div className="text-base pt-4 space-y-4 text-foreground">
          <p>
            앱이 데이터베이스에 접근할 수 없습니다. 이 문제를 해결하려면 Firebase 보안 규칙을 업데이트해야 합니다.
          </p>
          <p>
            아래 단계에 따라 Firestore 보안 규칙을 업데이트해주세요.
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Firebase 콘솔(<a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">console.firebase.google.com</a>)을 엽니다.</li>
            <li>프로젝트를 선택하고 <strong>빌드 &gt; Firestore Database</strong>로 이동합니다.</li>
            <li>상단의 <strong>규칙(Rules)</strong> 탭을 선택합니다.</li>
            <li>편집기의 모든 내용을 아래 코드로 <strong>완전히 교체</strong>합니다. (기존 내용을 모두 지우고 붙여넣으세요)</li>
          </ol>
          <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 font-mono text-sm text-slate-50 overflow-x-auto">
            <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read/write access for development.
      allow read, write: if true;
    }
  }
}`}
            </code>
          </pre>
          <p className="font-semibold">
            규칙을 게시(Publish)한 후, 아래 버튼을 눌러 앱을 새로고침 하세요.
          </p>
          <Button onClick={handleRefresh} className="mt-4 w-full text-lg p-6">
              규칙을 업데이트했습니다. 앱 새로고침
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
