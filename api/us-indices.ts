import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 미국 지수(나스닥/S&P/다우) — Twelve Data (무료 키).
 * 가입: https://twelvedata.com  → API Key
 * env: TWELVEDATA_API_KEY   (무료 800req/day, 8req/min — 일일 브리핑엔 충분)
 * 대안: Finnhub, Polygon, yfinance 프록시 등.
 * 키가 없으면 501 → 프론트는 기존 SAMPLE 지수를 그대로 사용.
 */
const MAP = [
  { sym: "IXIC", name: "나스닥", note: "기술주" },
  { sym: "SPX", name: "S&P 500", note: "대형주" },
  { sym: "DJI", name: "다우", note: "" },
];

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const key = process.env.TWELVEDATA_API_KEY;
    if (!key) { res.status(501).json({ ok: false, note: "TWELVEDATA_API_KEY 미설정" }); return; }
    const symbols = MAP.map((m) => m.sym).join(",");
    const r = await fetch(`https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${key}`);
    const j: any = await r.json();
    const out = MAP.map((m) => {
      const q = j && j[m.sym] ? j[m.sym] : j; // 다중심볼=객체, 단일=평면
      const chg = parseFloat(q?.percent_change);
      const close = parseFloat(q?.close);
      return {
        name: m.name,
        chg: isNaN(chg) ? 0 : chg,
        note: m.note || (isNaN(close) ? "" : Math.round(close).toLocaleString("en-US")),
        spark: [20, 18, 16, 14, 12, 9, 6, 4],
      };
    });
    res.status(200).json(out);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
