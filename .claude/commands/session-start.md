# 세션 시작 — 프로젝트 현황 요약

팀 프로젝트 세션을 새로 시작할 때 호출합니다. 별도 인자 없음.

## 실행 순서

다음 파일들을 순서대로 읽습니다:

1. `C:\Users\kyjkm\llm-wiki-vault-template\LLM-Wiki\10-projects\investment-dashboard\work-criteria-card.md`
2. `C:\Users\kyjkm\llm-wiki-vault-template\LLM-Wiki\10-projects\investment-dashboard\progress.md`
3. `C:\Users\kyjkm\llm-wiki-vault-template\LLM-Wiki\10-projects\investment-dashboard\workflow-card.md`

그 다음 아래 bash 명령으로 최근 커밋 5개를 가져옵니다:

```bash
git -C "C:\Users\kyjkm\2026-kookmin-ai-workflow-team5" log --oneline -5
```

## 출력 형식

읽은 내용을 바탕으로 아래 형식으로 현황을 요약합니다. 각 섹션은 간결하게 — 없는 정보는 생략, 길게 쓰지 않음.

---

### 프로젝트 현황

- 스택: Next.js 15, TypeScript, App Router, mock data 기반
- 레포: `nxtcloud-edu/2026-kookmin-ai-workflow-team5` (main)
- 상태: [README status 필드 값]

### 완료 기준 체크

work-criteria-card.md의 체크박스를 그대로 옮겨 현재 완료/미완료 상태를 표시합니다.

| 기준 | 상태 |
|---|---|
| ... | ✅ / ⬜ |

### 마지막 작업 (progress.md 최신 엔트리 기준)

- 날짜: YYYY-MM-DD
- 한 일: (오늘 한 일 항목들)
- 남은 일: (남은 일 항목들 중 미완료)

### 최근 커밋

```
(git log --oneline -5 출력 그대로)
```

### 이어서 할 수 있는 것

남은 일과 완료 기준 미체크 항목을 합쳐, 지금 바로 시작 가능한 작업을 1~3개만 제안합니다.

---

요약 출력 후 "무엇부터 할까요?" 한 마디로 마칩니다.
