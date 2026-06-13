import { useEffect, useRef, useState } from "react";
import { Briefing, Stock, NewsItem } from "./lib/types";
import { Live } from "./hooks/useLive";

type MItem = { name: string; group: string; unit: string; level: number; chg: number; spark?: number[] };
type NStock = { rank: number; name: string; code: string; market: string; price: number; chg: number; volume: string; turnover: string; marketcap: string; up: boolean };

const cc = (n: number) => (n >= 0 ? "u" : "d");
const sgn = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const comma = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

// 토스식 "이유 + 결과" 시그널 (쉬운 말)
const SIGNALS = [
  { tk: "나스닥", flag: "🇺🇸", reason: "AI 반도체 강세로", chg: 2.54 },
  { tk: "S&P 500", flag: "🇺🇸", reason: "평화합의 기대감으로", chg: 1.75 },
  { tk: "코스피", flag: "🇰🇷", reason: "외국인 순매수 전환으로", chg: 4.63 },
  { tk: "달러 환율", flag: "💵", reason: "지정학 리스크 완화로", chg: -0.21 },
  { tk: "비트코인", flag: "🪙", reason: "차익 실현 매물로", chg: -0.21 },
];
const SAMPLE_CHART: NStock[] = [
  { rank: 1, name: "SK하이닉스", code: "000660", market: "KP", price: 318000, chg: 2.9, volume: "4.2M", turnover: "8,420억", marketcap: "231조", up: true },
  { rank: 2, name: "삼성전자", code: "005930", market: "KP", price: 94300, chg: 8.5, volume: "12.9M", turnover: "1.07조", marketcap: "562조", up: true },
  { rank: 3, name: "한미반도체", code: "042700", market: "KP", price: 168500, chg: 4.8, volume: "6.1M", turnover: "6,980억", marketcap: "16조", up: true },
  { rank: 4, name: "알테오젠", code: "196170", market: "KQ", price: 384000, chg: 2.7, volume: "1.4M", turnover: "4,180억", marketcap: "20조", up: true },
  { rank: 5, name: "에코프로비엠", code: "247540", market: "KQ", price: 184000, chg: -3.7, volume: "2.1M", turnover: "2,870억", marketcap: "18조", up: false },
  { rank: 6, name: "현대차", code: "005380", market: "KP", price: 246500, chg: 1.2, volume: "1.6M", turnover: "3,610억", marketcap: "51조", up: true },
];
const CHART_TABS = [["turnover", "거래대금"], ["volume", "거래량"], ["up", "급상승"], ["down", "급하락"]];
const CAL = [
  { d: "오늘", t: "09:00", ev: "코스피·코스닥 정규장 개장", tag: "국내" },
  { d: "오늘밤", t: "21:30", ev: "美 5월 소매판매 발표", tag: "경제지표" },
  { d: "17일", t: "21:00", ev: "카맥스(KMX) 어닝콜", tag: "어닝콜" },
  { d: "17일", t: "21:30", ev: "자빌(JBL) 어닝콜", tag: "어닝콜" },
  { d: "19일", t: "08:00", ev: "한국 6월 수출입 잠정치", tag: "경제지표" },
];
const wd = ["일", "월", "화", "수", "목", "금", "토"];

export default function Lite({ b, live, onPro, openStock, openNews }: {
  b: Briefing; live: Live; onPro: () => void;
  openStock: (s: Stock) => void; openNews: (n: NewsItem) => void;
}) {
  const [markets, setMarkets] = useState<MItem[]>([]);
  const [nstocks, setNstocks] = useState<NStock[]>([]);
  const [tab, setTab] = useState("turnover");
  const cvRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/api/markets").then(r => r.json()).then(d => setMarkets(d.data || [])).catch(() => {});
    fetch("/api/naver-stocks?limit=12").then(r => r.json()).then(d => setNstocks(d.stocks || [])).catch(() => {});
  }, []);

  // 오늘의 시장 점수 (시장 전체 · 합법)
  const grp = (g: string) => markets.filter(m => m.group === g);
  const us = grp("미국"), kr = grp("국내"), ind = grp("지표");
  const avg = (a: MItem[]) => a.length ? a.reduce((x, m) => x + m.chg, 0) / a.length : 0;
  const usA = us.length ? avg(us) : 2.0, krA = kr.length ? avg(kr) : 3.9;
  const vix = ind.find(x => x.name.includes("VIX"))?.level ?? 17.7;
  const score = Math.max(3, Math.min(99, Math.round(50 + usA * 3.2 + krA * 2.2 + (18 - vix) + (live.btcChg ?? 0) * 0.3)));
  const mood = score >= 72 ? "분위기 좋아요 ☀️" : score >= 58 ? "맑은 편이에요 🌤️" : score >= 45 ? "보통이에요 ⛅" : score >= 32 ? "조심스러워요 🌧️" : "흐려요 ⛈️";

  const NS = nstocks.length ? nstocks : SAMPLE_CHART;
  const sorted = [...NS].sort((a, b) => {
    if (tab === "up") return b.chg - a.chg;
    if (tab === "down") return a.chg - b.chg;
    return 0;
  }).slice(0, 6);
  const news = (b.news && b.news.length) ? b.news : [];
  const now = new Date();

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return; const cx = cv.getContext("2d"); if (!cx) return;
    let W = 0, H = 0, raf = 0; const t0 = performance.now();
    const resize = () => { const d = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const frame = (nw: number) => {
      const t = (nw - t0) / 1000; cx.clearRect(0, 0, W, H);
      const cxp = W * 0.78, cyp = H * 0.5, R = Math.min(W, H) * 0.42;
      const g = cx.createRadialGradient(cxp, cyp, 0, cxp, cyp, R * 2);
      g.addColorStop(0, `rgba(255,180,110,${0.5 + 0.1 * Math.sin(t)})`); g.addColorStop(0.5, "rgba(255,120,150,.18)"); g.addColorStop(1, "rgba(120,80,200,0)");
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      const sg = cx.createLinearGradient(cxp, cyp - R, cxp, cyp + R); sg.addColorStop(0, "#FFD79A"); sg.addColorStop(1, "#FF8FB0");
      cx.fillStyle = sg; cx.beginPath(); cx.arc(cxp, cyp, R, 0, 7); cx.fill();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const openNS = (s: NStock) => openStock({ rank: s.rank, name: s.name, market: s.market, code: s.code, price: s.price, chg: s.chg, turnover: s.turnover, volume: s.volume, pos52: "", note: "", reason: `거래대금 ${s.turnover} · 시총 ${s.marketcap}`, spark: [], pro: false, profile: [], forecast: { trend: "", up: "", down: "" } } as Stock);

  return (
    <div className="lite">
      <header className="lt-top">
        <div className="lt-brand">DAWN <span>여명</span></div>
        <button className="lt-modebtn" onClick={onPro}>📊 고수 모드</button>
      </header>

      <div className="lt-scroll">
        {/* 인사 + 오늘의 점수 */}
        <section className="lt-hero">
          <canvas ref={cvRef} className="lt-cv" />
          <div className="lt-hi">{now.getMonth() + 1}월 {now.getDate()}일 {wd[now.getDay()]}요일 아침</div>
          <div className="lt-greet">예준님,<br />오늘 시장은 <b>{mood}</b></div>
          <div className="lt-score">
            <div className="lt-scnum">{score}<span>점</span></div>
            <div className="lt-scbar"><div className="lt-scfill" style={{ width: score + "%" }} /></div>
            <div className="lt-sccap">오늘의 시장 분위기 점수 · 높을수록 좋아요</div>
          </div>
          <div className="lt-oneline">밤사이 미국 증시가 올랐어요. 보통 미국이 오르면 우리 시장도 기분 좋게 출발하는 경우가 많아요. 🌅</div>
        </section>

        {/* AI 핵심 시그널 */}
        <section className="lt-sec">
          <div className="lt-h">✨ AI 핵심 시그널 <span>이유 + 결과를 한 줄로</span></div>
          <div className="lt-sigs">
            {SIGNALS.map((s, i) => (
              <div className="lt-sig" key={i}>
                <div className="lt-sigflag">{s.flag}</div>
                <div className="lt-sigbody"><div className="lt-sigtk">{s.tk}</div><div className="lt-sigr">{s.reason}</div></div>
                <div className={"lt-sigchg " + cc(s.chg)}>{s.chg >= 0 ? "▲" : "▼"} {Math.abs(s.chg).toFixed(2)}%<div className="lt-sigw">{s.chg >= 0 ? "상승" : "하락"}</div></div>
              </div>
            ))}
          </div>
        </section>

        {/* 실시간 차트 탭 */}
        <section className="lt-sec">
          <div className="lt-h">📈 실시간 차트</div>
          <div className="lt-tabs">{CHART_TABS.map(([k, label]) => (<button key={k} className={"lt-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{label}</button>))}</div>
          <div className="lt-rank">
            {sorted.map((s, i) => (
              <div className="lt-rrow" key={s.code} onClick={() => openNS(s)}>
                <span className="lt-rno">{i + 1}</span>
                <div className="lt-rbody"><div className="lt-rnm">{s.name}</div><div className="lt-rsub">{tab === "turnover" ? "거래대금 " + s.turnover : tab === "volume" ? "거래량 " + s.volume : s.market}</div></div>
                <div className="lt-rprice"><div>{comma(s.price)}원</div><div className={cc(s.chg)}>{sgn(s.chg)}</div></div>
              </div>
            ))}
          </div>
        </section>

        {/* 증시 캘린더 · 어닝콜 */}
        <section className="lt-sec">
          <div className="lt-h">🗓️ 증시 캘린더 · 어닝콜</div>
          <div className="lt-cal">
            {CAL.map((c, i) => (
              <div className="lt-cev" key={i}>
                <div className="lt-cd"><b>{c.d}</b><span>{c.t}</span></div>
                <div className="lt-cbody"><div className="lt-cttl">{c.ev}</div><span className={"lt-ctag tag-" + c.tag}>{c.tag}</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* 실시간 이슈 (뉴스) */}
        <section className="lt-sec">
          <div className="lt-h">📰 실시간 이슈</div>
          <div className="lt-news">
            {(news.length ? news.slice(0, 4) : [{ id: "n1", title: "외국인 24거래일 만에 순매수 전환… 반도체 집중", source: "네이버뉴스", ago: "32분", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" }, { id: "n2", title: "美 CPI 둔화 전망에 금리 인하 기대 확산", source: "네이버뉴스", ago: "1시간", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" }] as NewsItem[]).map(n => (
              <div className="lt-nrow" key={n.id} onClick={() => openNews(n)}>
                <div className="lt-ntt">{n.title}</div>
                <div className="lt-nmt">{n.source} · {n.ago}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="lt-fine">DAWN 여명 · 투자 참고용 정보입니다. 특정 종목 매수·매도 권유가 아니며, 최종 투자 판단과 책임은 본인에게 있습니다. 수치는 데모 예시입니다.</div>
        <button className="lt-promo" onClick={onPro}>📊 더 자세히 보고 싶다면 — 고수 모드 →</button>
      </div>
    </div>
  );
}
