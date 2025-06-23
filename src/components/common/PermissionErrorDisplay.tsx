"use client";

import { useStore } from "@/lib/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PermissionErrorDisplay() {
  const { permissionError } = useStore();

  if (!permissionError) {
    return null;
  }
  
  const handleRefresh = () => {
    window.location.reload();
  }

  return (
    <div className="container my-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase 권한 오류</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>
              앱이 데이터베이스에 접근할 수 없습니다. 이 문제는 일반적으로 Firebase 보안 규칙 설정 때문에 발생합니다.
            </p>
            <p>
              아래 단계에 따라 Firestore 보안 규칙을 업데이트하여 이 문제를 해결해주세요.
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Firebase 콘솔(<a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.firebase.google.com</a>)을 엽니다.</li>
              <li>프로젝트를 선택하고 <strong>빌드 &gt; Firestore Database</strong>로 이동합니다.</li>
              <li>상단의 <strong>규칙(Rules)</strong> 탭을 선택합니다.</li>
              <li>편집기의 모든 내용을 아래 코드로 교체합니다.</li>
            </ol>
            <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 font-mono text-sm text-slate-50 overflow-x-auto">
              <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // 개발용: 누구나 데이터를 읽고 쓸 수 있도록 허용합니다.
      allow read, write: if true;
    }
  }
}`}
              </code>
            </pre>
            <p>
              <strong>게시(Publish)</strong> 버튼을 클릭하여 규칙을 저장한 후, 아래 버튼을 눌러 앱을 새로고침 하세요.
            </p>
             <Button onClick={handleRefresh} className="mt-2">규칙을 업데이트했습니다. 새로고침</Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
