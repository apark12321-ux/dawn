import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * KIS OpenAPI 접근토큰 발급 (서버 전용).
 * 환경변수(Vercel → Settings → Environment Variables):
 *   KIS_APP_KEY, KIS_APP_SECRET
 *   KIS_BASE = https://openapivts.koreainvestment.com:29443  (모의투자)
 *            = https://openapi.koreainvestment.com:9443       (실전)
 * 토큰은 24시간 유효 → 실제로는 KV/Redis 등에 캐시해서 재사용하세요.
 */
let cache: { token: string; exp: number } | null = null;

export async function getKisToken(): Promise<string> {
  if (cache && cache.exp > Date.now()) return cache.token;
  const base = process.env.KIS_BASE!;
  const r = await fetch(`${base}/oauth2/tokenP`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("KIS token failed");
  cache = { token: j.access_token, exp: Date.now() + 23 * 3600 * 1000 };
  return cache.token;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const token = await getKisToken();
    res.status(200).json({ ok: true, token: token.slice(0, 8) + "…" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
