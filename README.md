# akkija

개인 가계부 모바일 웹앱 (PWA). React + Vite + Tailwind CSS, Supabase(Postgres), GitHub → Render Static Site 자동 배포.

## 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 **새 프로젝트** 생성 (Region: Northeast Asia (Seoul) 권장)
2. **SQL Editor** → `supabase/schema.sql` 전체를 붙여넣고 **Run**
3. **Authentication → Sign In / Providers → Email**
   - **Allow new users to sign up** 끄기 (다른 사람이 가입하지 못하게)
4. **Authentication → Users → Add user → Create new user**
   - Email: 로그인용 이메일 (예: `me@akkija.app`, 실제 메일함이 없어도 됨)
   - Password: 앱에서 입력할 비밀번호 (길게 설정 권장)
   - **Auto Confirm User** 체크
5. **Project Settings → API**에서 아래 두 값 복사
   - Project URL
   - `anon` public key (또는 `publishable` key)

## 2. 로컬 실행 (선택)

```bash
cp .env.example .env      # 값 채우기
npm install
npm run dev
```

## 3. GitHub 업로드

```bash
git init
git add .
git commit -m "feat: akkija 가계부 초기 버전"
git branch -M main
git remote add origin https://github.com/<아이디>/akkija.git
git push -u origin main
```

`.env`는 `.gitignore`에 포함되어 올라가지 않습니다.

## 4. Render 배포

1. Render → **New → Static Site** → GitHub의 `akkija` 저장소 선택
2. 설정
   - Name: `akkija` (→ `https://akkija.onrender.com`, 이미 사용 중이면 다른 이름)
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. **Environment Variables**
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon(publishable) key
   - `VITE_LOGIN_EMAIL` = 4단계에서 만든 이메일
   - `NODE_VERSION` = `22`
4. **Create Static Site** → 이후 `main`에 push할 때마다 자동 배포

> 환경변수를 바꾼 뒤에는 **Manual Deploy → Clear build cache & deploy**로 다시 빌드해야 반영됩니다 (빌드 시점에 값이 들어감).

## 5. 휴대폰 홈 화면에 추가

- iPhone(Safari): 공유 버튼 → **홈 화면에 추가**
- Android(Chrome): 메뉴 → **홈 화면에 추가 / 앱 설치**

## 구조

```
src/
  App.jsx                 탭 구성, 월 선택, 데이터 로드
  screens/                로그인 · 내역 · 통계 · 고정 · 설정
  components/             입력 시트, 공통 UI
  lib/api.js              Supabase 호출
  lib/recurring.js        고정지출 '이번 달 예정' 계산
  lib/export.js           월별 엑셀 내보내기
supabase/schema.sql       테이블 · RLS 정책
public/                   아이콘 · manifest · 서비스워커
```

## 참고

- 데이터는 로그인한 본인만 읽고 쓸 수 있도록 RLS로 막혀 있습니다.
- 카테고리·카드·고정지출은 삭제 대신 숨김 처리되어 기존 내역이 보존됩니다.
- Supabase 무료 프로젝트는 **7일간 요청이 없으면 일시정지**될 수 있습니다. 대시보드에서 Resume 하면 데이터는 그대로입니다.
