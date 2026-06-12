import { Briefing } from "./types";
import { SAMPLE } from "../data/sample";
import { EMPTY } from "./empty";

/**
 * 브리핑 로드.
 *  - 기본: /api/briefing (서버에서 키움·네이버·TwelveData 집계한 실데이터)
 *  - 실패: EMPTY (가짜 숫자 없이 빈 상태 → 화면은 "연동 중" 표기)
 *  - ?demo=1: SAMPLE (쇼케이스용)
 * 환율·BTC·ETH 는 useLive 에서 실시간 직접 수신.
 */
export async function fetchBriefing(): Promise<Briefing> {
  if (new URLSearchParams(location.search).has("demo")) return SAMPLE;
  try {
    const r = await fetch("/api/briefing", { cache: "no-store" });
    if (!r.ok) throw new Error("no api");
    const j = await r.json();
    return { ...EMPTY, ...j } as Briefing;
  } catch {
    return EMPTY;
  }
}

export async function fetchFX(): Promise<number | null> {
  try { const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" }); const j = await r.json(); return j?.rates?.KRW ?? null; } catch { return null; }
}
export async function fetchBTC(): Promise<{ price: number; chg: number } | null> {
  try { const r = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", { cache: "no-store" }); const j = await r.json(); const price = parseFloat(j.lastPrice), chg = parseFloat(j.priceChangePercent); if (isNaN(price)) return null; return { price, chg }; } catch { return null; }
}
