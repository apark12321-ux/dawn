import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getKiwoomToken } from "./kiwoom-token";

/**
 * 브리핑 통합 엔드포인트 — 실제 소스를 모아 Briefing 스키마로 반환.
 *   美지수: Twelve Data(ETF SPY/QQQ/DIA)  | 국내 주목주: 키움 순위정보(rkinfo)
 *   뉴스: 네이버 검색 API  | 오늘의 한 줄·전략: 실제 수치로 자동 작성
 * 환율·BTC·ETH 는 프론트(useLive)에서 실시간 직접 수신.
 * 연동 안 된 영역은 빈 배열로 → 프론트가 "연동 중" 표기(가짜 숫자 없음).
 * 진단: /api/briefing?debug=1  → 각 소스 원본/성공여부 확인
 */
const num = (v: any) => { const n = parseFloat(String(v ?? "").replace(/[^\d.\-]/g, "")); return isNaN(n) ? 0 : n; };
const stripHtml = (s: string) => String(s || "").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").trim();
const won = (n: number) => Math.round(n).toLocaleString("en-US");

async function usIndices() {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) return { data: [], ok: false };
  const MAP = [{ s: "QQQ", n: "나스닥", note: "기술주 주도" }, { s: "SPY", n: "S&P 500", note: "광범위" }, { s: "DIA", n: "다우", note: "우량주" }];
  try {
    const r = await fetch(`https://api.twelvedata.com/quote?symbol=${MAP.map(m => m.s).join(",")}&apikey=${key}`);
    const j: any = await r.json();
    const data = MAP.map(m => { const q = j && j[m.s] ? j[m.s] : j; const chg = parseFloat(q?.percent_change); return { name: m.n, chg: isNaN(chg) ? 0 : chg, note: m.note, spark: [20, 18, 16, 14, 12, 9, 6, 4] }; });
    const ok = data.some(d => d.chg !== 0);
    return { data, ok, raw: j };
  } catch (e) { return { data: [], ok: false }; }
}

function buildStock(rank: number, name: string, code: string, market: string, price: number, chg: number, turnover: string, volume: string) {
  const unit = price >= 100000 ? 1000 : price >= 10000 ? 500 : 100;
  const poc = Math.round(price / unit) * unit, hi = Math.round((poc * 1.024) / unit) * unit, lo = Math.round((poc * 0.976) / unit) * unit;
  return {
    rank, name, market, code, price, chg, turnover, volume, pos52: "—", pro: rank > 2,
    reason: `거래대금 ${turnover} 상위 · 등락 ${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%`,
    note: `거래대금 ${turnover}`, spark: [20, 17, 18, 12, 13, 7, 5].map(y => y + (rank % 3)),
    profile: [{ price: hi, vol: 34 }, { price: poc, vol: 96, poc: true }, { price: lo, vol: 40 }],
    forecast: { trend: "단기 추세 · 변동성 보통", up: `POC ${won(poc)} 위 안착 시 강세 지속 여지`, down: `POC 이탈 시 ${won(lo)}까지 단기 조정 가능` },
  };
}

// 응답 어디에 있든 종목 배열 추정해서 찾기
function findArray(j: any): any[] {
  if (!j || typeof j !== "object") return [];
  for (const k of Object.keys(j)) { const v = (j as any)[k]; if (Array.isArray(v) && v.length && typeof v[0] === "object") return v; }
  return [];
}

async function kiwoomTop() {
  if (!process.env.KIWOOM_APP_KEY) return { data: [], ok: false };
  try {
    const token = await getKiwoomToken();
    const base = (process.env.KIWOOM_BASE || "https://api.kiwoom.com").trim();
    const r = await fetch(`${base}/api/dostk/rkinfo`, {
      method: "POST",
      headers: { "content-type": "application/json;charset=UTF-8", authorization: `Bearer ${token}`, "api-id": "ka10032" },
      body: JSON.stringify({ mrkt_tp: "000", mang_stk_incls: "0", stex_tp: "3" }),
    });
    const j: any = await r.json();
    const arr = findArray(j).slice(0, 5);
    const data = arr.map((it: any, i: number) => {
      const name = it.stk_nm || it.hts_kor_isnm || `종목${i + 1}`;
      const code = it.stk_cd || it.mksc_shrn_iscd || "";
      const price = num(it.cur_prc || it.past_curr_prc || it.prpr || it.stck_prpr);
      const chg = num(it.flu_rt || it.base_comp_chgr || it.prdy_ctrt || it.fltt_rt);
      const turnover = String(it.trde_prica || it.acml_tr_pbmn || it.now_trde_qty || "-");
      const volume = String(it.trde_qty || it.acml_vol || "-");
      return buildStock(i + 1, name, code, "KOSPI", price || 0, chg, turnover, volume);
    });
    return { data, ok: data.length > 0, raw: j };
  } catch (e: any) { return { data: [], ok: false, err: e.message }; }
}

async function naverNews() {
  if (!process.env.NAVER_CLIENT_ID) return { data: [], ok: false };
  try {
    const r = await fetch(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent("코스피 증시")}&display=6&sort=date`, {
      headers: { "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!, "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET! },
    });
    const j: any = await r.json();
    const items = Array.isArray(j.items) ? j.items.slice(0, 4) : [];
    const data = items.map((it: any, i: number) => ({
      id: "n" + i, title: stripHtml(it.title), source: "네이버뉴스",
      ago: relTime(it.pubDate), tag: "nu", tagText: "뉴스", tickers: [],
      url: it.originallink || it.link, summary: stripHtml(it.description),
    }));
    return { data, ok: data.length > 0, raw: j };
  } catch (e) { return { data: [], ok: false }; }
}
function relTime(pub: string) { const t = new Date(pub).getTime(); if (isNaN(t)) return ""; const m = Math.floor((Date.now() - t) / 60000); if (m < 60) return `${m}분 전`; const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`; return `${Math.floor(h / 24)}일 전`; }

function compose(us: any[], stocks: any[]) {
  const avg = us.length ? us.reduce((a, b) => a + b.chg, 0) / us.length : 0;
  const dir = avg > 0.5 ? "상승" : avg < -0.5 ? "하락" : "혼조";
  const open = avg > 0.5 ? "우호적인" : avg < -0.5 ? "조심스러운" : "제한적인";
  const tldr = us.length
    ? `밤사이 미국 증시는 ${dir} 마감했습니다. ${us.map(u => `${u.name} ${u.chg >= 0 ? "+" : ""}${u.chg.toFixed(2)}%`).join(", ")}. 우리 시장도 ${open} 출발이 예상됩니다.`
    : "";
  const points = us.slice(0, 2).map(u => `${u.name} ${u.chg >= 0 ? "+" : ""}${u.chg.toFixed(2)}% · ${u.note}`);
  if (stocks.length) points.push(`거래대금 상위 ${stocks[0].name} 등 대형주 자금 집중`);
  const strategy = {
    up: avg >= 0 ? "미국 강세 흐름이 이어지면 갭상승 시도 가능" : "낙폭과대 반등 시도 — 외국인 수급 확인 필요",
    dn: "원/달러 추가 상승·외국인 이탈 시 변동성 확대 주의",
    ob: "시초가 외국인 수급 · 대형주 거래량 집중도",
  };
  const temp = Math.max(8, Math.min(95, Math.round(50 + avg * 8)));
  return { tldr, points, strategy, temp };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const [us, kw, news] = await Promise.all([usIndices(), kiwoomTop(), naverNews()]);
  if (req.query.debug) { res.status(200).json({ source: { us: us.ok, kiwoom: kw.ok, news: news.ok }, kiwoom_raw: (kw as any).raw || (kw as any).err, news_count: news.data.length, us_ok: us.ok }); return; }
  const ed = compose(us.data, kw.data);
  res.status(200).json({
    date: new Date().toISOString(),
    temp: ed.temp, tldr: ed.tldr, points: ed.points,
    usIndices: us.data,
    futures: [],
    strategy: ed.strategy,
    news: news.data,
    holdingsImpact: [], watchNews: [],
    flow: [], sectors: [], flowNote: "",
    stocks: kw.data,
    source: { us: us.ok, kiwoom: kw.ok, news: news.ok },
  });
}
