import { Briefing } from "./types";
import { SAMPLE } from "../data/sample";

/**
 * 브리핑 로드. 1순위 /api/briefing(서버리스), 폴백 SAMPLE.
 *
 * ▼ 실서비스에서 채울 API (시크릿은 서버리스에만):
 *   국내 지수·종목·수급·거래량상위·거래량프로파일 → 키움증권 REST API
 *       순위정보 /api/dostk/rkinfo (ka10030 당일거래량상위 등) + 실시간 체결 WebSocket(type 0B)
 *   미국 지수/선물/원자재 → yfinance 프록시 / Polygon / Twelve Data
 *   환율 → 한국은행 ECOS 또는 open.er-api.com
 *   뉴스 → 네이버 검색 API(news) / 언론사 RSS (+종목 연관 검색)
 *   공시 → DART OpenAPI
 *   캘린더 → 자체 큐레이션
 */
export async function fetchBriefing(): Promise<Briefing> {
  try {
    const r = await fetch("/api/briefing", { cache: "no-store" });
    if (!r.ok) throw new Error("no api");
    return (await r.json()) as Briefing;
  } catch {
    return SAMPLE;
  }
}

export async function fetchFX(): Promise<number | null> {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    const j = await r.json();
    return j?.rates?.KRW ?? null;
  } catch { return null; }
}

export async function fetchBTC(): Promise<{ price: number; chg: number } | null> {
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", { cache: "no-store" });
    const j = await r.json();
    const price = parseFloat(j.lastPrice), chg = parseFloat(j.priceChangePercent);
    if (isNaN(price)) return null;
    return { price, chg };
  } catch { return null; }
}
