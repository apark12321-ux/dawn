import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 브리핑 통합 엔드포인트. 프론트(lib/api.ts)가 /api/briefing 을 호출합니다.
 * 여기서 키움(지수·종목·수급), 뉴스(네이버), 환율(ECOS/er-api), 공시(DART) 를
 * 병합해 Briefing 스키마(src/lib/types.ts)로 반환하세요.
 *
 * 키가 아직 없으면 501 을 반환 → 프론트가 자동으로 SAMPLE 폴백.
 * 운영 시 매일 06:20경 크론(Vercel Cron)으로 미리 생성·캐시하면 06:30 발송이 안정적입니다.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const ready = process.env.KIWOOM_APP_KEY && process.env.NAVER_CLIENT_ID;
  if (!ready) {
    res.status(501).json({ ok: false, note: "API 키 미설정 — 프론트가 SAMPLE로 폴백합니다." });
    return;
  }

  // TODO: 실제 집계 로직
  // const [quotes, news] = await Promise.all([ ...fetch /api 내부 함수..., ... ]);
  // const briefing: Briefing = mergeIntoBriefing(quotes, news, fx, ...);
  // res.status(200).json(briefing);

  res.status(501).json({ ok: false, note: "집계 로직 미구현 — TODO 참고." });
}
