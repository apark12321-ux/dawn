import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 키움증권 REST API 접근토큰 발급 (서버 전용).
 * 신청: https://openapi.kiwoom.com  (PC에서만, HTS ID 연결 필요 / 국내주식·ETF·ETN)
 * 환경변수:
 *   KIWOOM_APP_KEY, KIWOOM_SECRET_KEY
 *   KIWOOM_BASE = https://api.kiwoom.com      (실전)
 *               = https://mockapi.kiwoom.com  (모의투자)
 *
 * POST /oauth2/token
 *   body: { grant_type:"client_credentials", appkey, secretkey }
 *   res : { token, token_type:"bearer", expires_dt:"YYYYMMDDHHmmss" }
 * ※ 응답 토큰 필드명은 access_token 이 아니라 "token" 입니다.
 */
let cache: { token: string; exp: number } | null = null;

export async function getKiwoomToken(): Promise<string> {
  if (cache && cache.exp > Date.now()) return cache.token;
  const base = process.env.KIWOOM_BASE || "https://api.kiwoom.com";
  const r = await fetch(`${base}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/json;charset=UTF-8" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: process.env.KIWOOM_APP_KEY,
      secretkey: process.env.KIWOOM_SECRET_KEY,
    }),
  });
  const j = await r.json();
  if (!j.token) throw new Error("Kiwoom token failed: " + JSON.stringify(j));
  // expires_dt(만료시각)까지지만, 보수적으로 6시간 캐시
  cache = { token: j.token, exp: Date.now() + 6 * 3600 * 1000 };
  return j.token;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const token = await getKiwoomToken();
    res.status(200).json({ ok: true, token: token.slice(0, 8) + "…" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
