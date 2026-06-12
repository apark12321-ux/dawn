import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 종목/시장 뉴스 (네이버 검색 API - news).
 * 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 * 문서: https://developers.naver.com/docs/serviceapi/search/news/news.md
 * 쿼리: /api/news?q=삼성전자
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = String(req.query.q || "코스피");
    const r = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=10&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET!,
        },
      }
    );
    const j = await r.json();
    res.status(200).json(j);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
