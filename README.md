# My Little Data — Notion Quick Entry App

Notion에 생활 데이터를 빠르게 쌓기 위한 Next.js + Vercel 앱입니다.

## 1. 현재 연결 대상

현재 Notion에서 실제로 확인된 데이터베이스는:

- 📅 Daily Log
- Data Source ID: `241f169d-dd17-478d-905c-a68ce4212711`

현재 만들어진 Notion 페이지/데이터베이스의 구조를 기준으로 앱은 **스키마를 자동으로 읽어 폼을 생성**합니다. 따라서 속성 이름이나 선택지가 바뀌어도 앱 코드를 다시 만들 필요가 없습니다.

## 2. Notion 준비

1. Notion Developers에서 Internal Integration을 만듭니다.
2. Integration Secret을 복사합니다.
3. 기록하려는 각 데이터베이스에서 `Share` → Integration을 연결합니다.
4. 앱은 `Data Source ID`를 사용합니다. 데이터베이스 URL 자체가 아니라 Data Source ID를 Vercel 환경변수에 넣습니다.

Notion API는 현재 `data_source_id`를 부모로 사용해 페이지를 만들 수 있습니다.

## 3. 앱에서 데이터 주소 연결

앱의 `⚙️ 연결 설정`에서 세 칸에 Notion 데이터베이스 URL을 붙여넣을 수 있습니다.

- ☀️ 오늘 기록
- 🌼 월간 기록
- 🔎 분석 메모

앱은 URL에서 UUID를 찾아 브라우저에 기억합니다.

다만 실제 Notion 쓰기 요청은 보안을 위해 Vercel의 환경변수에 등록된 Data Source ID만 허용하는 것을 권장합니다. 즉, 새 월간/분석 DB를 만들었다면 그 Data Source ID를 Vercel에도 등록하세요.

## 4. Vercel 환경변수

다음 4개를 등록합니다.

```env
NOTION_TOKEN=secret_xxx
NOTION_DAILY_DATA_SOURCE_ID=241f169d-dd17-478d-905c-a68ce4212711
NOTION_MONTHLY_DATA_SOURCE_ID=월간DB의_DATA_SOURCE_ID
NOTION_ANALYSIS_DATA_SOURCE_ID=분석DB의_DATA_SOURCE_ID
```

월간/분석 DB가 아직 없다면 해당 값을 비워도 됩니다. 그 메뉴는 연결 전 상태로 표시됩니다.

## 5. 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 6. Vercel 배포

GitHub에 올린 뒤 Vercel에서 Repository를 Import합니다.

- Framework: Next.js
- Build Command: `next build`
- Environment Variables: 위의 4개 등록

배포 후 `/`로 접속합니다.

## 7. 디자인 방향

첨부한 손그림/컬러링 이미지의 특징을 앱 UI에 적용했습니다.

- 따뜻한 크림/아이보리 종이색
- 손그림 느낌의 오렌지·머스터드 포인트
- 짙은 차콜 잉크 색
- 꽃/낙서 모티프
- 둥근 카드와 손글씨풍 제목
- 모바일에서도 한 손으로 입력하기 쉬운 큰 버튼
- 1분 기록을 목표로 한 짧은 입력 동선

## 8. 보안

`NOTION_TOKEN`은 절대 `NEXT_PUBLIC_` 변수로 만들지 않습니다.
토큰은 Vercel 서버에서만 사용하며 브라우저로 내려보내지 않습니다.

현재 구조는 **개인용 앱**에 적합합니다. 여러 사람이 각자의 Notion 계정을 연결하는 SaaS로 확장하려면 Notion OAuth를 추가하는 것이 좋습니다.
