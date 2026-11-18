import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isDemoMode = process.argv.includes('--demo');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const version = packageJson.version || '0.1.0';

const DIST_ROOT = path.join(ROOT_DIR, 'dist');
const BUNDLE_NAME = isDemoMode ? `evalmaster-pro-v${version}-demo` : `evalmaster-pro-v${version}`;
const BUNDLE_DIR = path.join(DIST_ROOT, BUNDLE_NAME);
const ZIP_PATH = path.join(DIST_ROOT, `${BUNDLE_NAME}.zip`);

function ensureCleanDir(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
}

function copyDirIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

function createStartBat() {
  return `@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [오류] Node.js가 설치되어 있지 않습니다.
  echo https://nodejs.org 에서 Node.js v20 이상을 설치한 뒤 다시 실행해주세요.
  pause
  exit /b 1
)

set PORT=9002
set HOSTNAME=127.0.0.1

echo ==================================================
echo   EvalMaster Pro 서버를 시작합니다...
echo   접속 주소: http://localhost:9002
echo   종료하려면 이 창을 닫거나 Ctrl+C를 누르세요.
echo ==================================================

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:9002"
node server.js
`;
}

function createStartSh() {
  return `#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[오류] Node.js가 설치되어 있지 않습니다. Node.js v20 이상을 설치해주세요."
  exit 1
fi

export PORT="\${PORT:-9002}"
export HOSTNAME="\${HOSTNAME:-127.0.0.1}"

echo "=================================================="
echo "  EvalMaster Pro 서버를 시작합니다..."
echo "  접속 주소: http://localhost:\${PORT}"
echo "  종료하려면 Ctrl+C를 누르세요."
echo "=================================================="

(
  sleep 2
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:\${PORT}" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:\${PORT}" >/dev/null 2>&1 || true
  fi
) &

exec node server.js
`;
}

function createJudgeGuide() {
  const modeSection = isDemoMode
    ? `> **로컬 데모 모드 패키지 안내**
> 이 패키지는 외부 DB 설정이나 인터넷 연결 없이도 즉시 심사 테스트가 가능하도록 **로컬 데모 모드**로 빌드되었습니다.
> 모든 데이터는 브라우저(\`localStorage\`)에 저장되며, **초기화·비밀번호 변경·채점 잠금** 등 모든 기능을 다른 심사위원과 충돌 없이 자유롭게 테스트하실 수 있습니다. (같은 브라우저의 여러 탭 간 실시간 동기화 지원)`
    : `> **Firebase 연동 패키지 안내**
> 이 패키지는 빌드 시점의 \`.env.local\` Firebase 설정을 포함하고 있습니다.
> 여러 PC·모바일 기기 간 실시간 Firestore 동기화를 즉시 테스트할 수 있습니다.`;

  return `# EvalMaster Pro 심사위원용 실행 가이드

${modeSection}

---

## 1. 빠른 실행 방법 (별도 \`npm install\` 불필요)

### 사전 요구사항
- **Node.js v20 이상** (미설치 시 https://nodejs.org 에서 LTS 버전 설치)

### Windows 실행
1. 압축 해제한 폴더 안의 **\`start.bat\`** 파일을 더블 클릭합니다.
2. 터미널 창이 열리며 잠시 후 기본 브라우저로 \`http://localhost:9002\`가 자동으로 열립니다.

### macOS / Linux 실행
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

---

## 2. 초기 접속 정보 (로컬 데모 / 초기 시드 기준)

| 역할 / 메뉴 | 경로 | 초기 계정 / 선택값 | 초기 비밀번호 |
| :--- | :--- | :--- | :--- |
| **평가위원** | \`/evaluate\` | \`김평가\`, \`이평가\`, \`박평가\` 중 선택 | \`1\` |
| **관리자** | \`/admin\` | - | \`1\` (또는 비상 마스터 \`0132\`) |
| **채점 결과** | \`/results\` | - | \`1\` (또는 비상 마스터 \`0132\`) |

*(참고: Firebase 연동 모드에서는 운영 DB에 설정된 비밀번호가 적용되며, 관리자/결과 페이지는 비상 마스터 비밀번호 \`0132\`로 항상 접속 가능합니다.)*

---

## 3. 3분 핵심 기능 테스트 시나리오

1. **평가위원 채점 테스트 (\`/evaluate\`)**
   - \`김평가\` 선택 후 비밀번호 입력 → 대상자(\`최대상\`, \`강대상\`, \`조대상\`)를 펼쳐 슬라이더로 점수 조절 및 기타 의견 입력 → **저장하기** 클릭
   - 하단 **채점 내역 확인** 버튼으로 전체 점수 요약 팝업 확인
   - **최종 평가 완료** 클릭 시 수정 잠금 전환 확인
2. **관리자 집계 · 잠금 · 인쇄 테스트 (\`/admin\`)**
   - \`결과 집계\` 탭에서 실시간 순위 확인 및 **상세보기(눈 아이콘)** 클릭
   - 하단 \`평가위원별 보고서 출력\`에서 위원 선택 → **보고서 보기** → 서명란이 포함된 A4 보고서 확인 및 **인쇄** 테스트
   - \`평가 위원\` / \`평가 대상자\` / \`평가 항목\` / \`시스템 설정\` 탭에서 추가·수정·잠금 해제·비밀번호 관리·시스템 초기화 테스트
3. **채점 결과 확인 (\`/results\`)**
   - 결과 열람 비밀번호 입력 후 최종 순위·총점·평균 표 확인
`;
}

function createZipArchive() {
  if (fs.existsSync(ZIP_PATH)) {
    fs.rmSync(ZIP_PATH, { force: true });
  }

  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path '${BUNDLE_DIR}' -DestinationPath '${ZIP_PATH}' -Force`,
      ],
      { stdio: 'inherit' },
    );
  } else {
    execFileSync('zip', ['-rq', ZIP_PATH, BUNDLE_NAME], {
      cwd: DIST_ROOT,
      stdio: 'inherit',
    });
  }
}

console.log(`[1/4] Building Next.js standalone bundle (mode: ${isDemoMode ? 'demo' : 'default'})...`);
const buildEnv = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  ...(isDemoMode ? { NEXT_PUBLIC_DEMO_MODE: 'true' } : {}),
};

execSync('npm run build', {
  cwd: ROOT_DIR,
  env: buildEnv,
  stdio: 'inherit',
});

const standaloneDir = path.join(ROOT_DIR, '.next', 'standalone');
const staticDir = path.join(ROOT_DIR, '.next', 'static');
const serverJsPath = path.join(standaloneDir, 'server.js');

if (!fs.existsSync(serverJsPath)) {
  throw new Error('Standalone server.js not found. Ensure output: "standalone" is set in next.config.ts.');
}

console.log(`[2/4] Assembling distribution folder at ${BUNDLE_DIR}...`);
ensureCleanDir(BUNDLE_DIR);
copyDirIfExists(standaloneDir, BUNDLE_DIR);
copyDirIfExists(staticDir, path.join(BUNDLE_DIR, '.next', 'static'));
copyDirIfExists(path.join(ROOT_DIR, 'public'), path.join(BUNDLE_DIR, 'public'));

const envExample = path.join(ROOT_DIR, '.env.local.example');
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(BUNDLE_DIR, '.env.local.example'));
}

console.log('[3/4] Writing launcher scripts and judge guide...');
fs.writeFileSync(path.join(BUNDLE_DIR, 'start.bat'), createStartBat(), 'utf8');
const startShPath = path.join(BUNDLE_DIR, 'start.sh');
fs.writeFileSync(startShPath, createStartSh(), { encoding: 'utf8', mode: 0o755 });
fs.writeFileSync(path.join(BUNDLE_DIR, 'JUDGE_GUIDE.md'), createJudgeGuide(), 'utf8');

console.log(`[4/4] Creating zip archive at ${ZIP_PATH}...`);
createZipArchive();

const zipStats = fs.statSync(ZIP_PATH);
const sizeMb = (zipStats.size / (1024 * 1024)).toFixed(2);
console.log(`\nPackaging complete!`);
console.log(`- Folder : ${BUNDLE_DIR}`);
console.log(`- Archive: ${ZIP_PATH} (${sizeMb} MB)`);
