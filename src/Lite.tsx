import { useEffect, useState } from "react";
import { Briefing, Stock, NewsItem } from "./lib/types";
import { Live } from "./hooks/useLive";

type MItem = { name: string; group: string; unit: string; level: number; chg: number; spark?: number[] };
type NStock = { rank: number; name: string; code: string; market: string; price: number; chg: number; volume: string; turnover: string; marketcap: string; up: boolean; spark?: number[] };

const cc = (n: number) => (n >= 0 ? "u" : "d");
const sgn = (n: number) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(2) + "%";
const comma = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const wd = ["일", "월", "화", "수", "목", "금", "토"];
const LOGO_C = ["#E03E3E", "#1E4DD8", "#0B7", "#7A3FF2", "#F0820F", "#0AA"];
const logoColor = (s: string) => LOGO_C[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_C.length];
const mkSpark = (up: boolean) => { let v = 50; return Array.from({ length: 12 }, () => { v += (Math.random() - (up ? 0.42 : 0.58)) * 9; return Math.max(10, Math.min(90, v)); }); };

const SIGNALS = [
  { tk: "나스닥", flag: "🇺🇸", reason: "AI 반도체가 끌어올려서", chg: 2.54 },
  { tk: "코스피", flag: "🇰🇷", reason: "외국인이 다시 사들여서", chg: 4.63 },
  { tk: "S&P 500", flag: "🇺🇸", reason: "지정학 긴장이 풀려서", chg: 1.75 },
  { tk: "원/달러", flag: "💵", reason: "위험 회피가 잦아들어서", chg: -0.21 },
];
const SAMPLE_CHART: NStock[] = [
  { rank: 1, name: "SK하이닉스", code: "000660", market: "코스피", price: 318000, chg: 2.9, volume: "420만", turnover: "8,420억", marketcap: "231조", up: true },
  { rank: 2, name: "삼성전자", code: "005930", market: "코스피", price: 94300, chg: 8.5, volume: "1,290만", turnover: "1.07조", marketcap: "562조", up: true },
  { rank: 3, name: "한미반도체", code: "042700", market: "코스피", price: 168500, chg: 4.8, volume: "610만", turnover: "6,980억", marketcap: "16조", up: true },
  { rank: 4, name: "알테오젠", code: "196170", market: "코스닥", price: 384000, chg: 2.7, volume: "140만", turnover: "4,180억", marketcap: "20조", up: true },
  { rank: 5, name: "에코프로비엠", code: "247540", market: "코스닥", price: 184000, chg: -3.7, volume: "210만", turnover: "2,870억", marketcap: "18조", up: false },
  { rank: 6, name: "현대차", code: "005380", market: "코스피", price: 246500, chg: 1.2, volume: "160만", turnover: "3,610억", marketcap: "51조", up: true },
];
const FLOW_TABS = [["turnover", "거래대금"], ["volume", "거래량"], ["up", "급상승"], ["down", "급하락"]];
const CAL = [
  { d: "오늘", t: "09:00", ev: "코스피·코스닥 개장", tag: "장" },
  { d: "오늘 밤", t: "21:30", ev: "미국 5월 소매판매 발표", tag: "지표" },
  { d: "17일", t: "21:00", ev: "카맥스 실적 발표", tag: "실적" },
  { d: "19일", t: "08:00", ev: "한국 6월 수출입 잠정치", tag: "지표" },
];
const NAV = [["today", "오늘", "☀️"], ["chart", "차트", "📈"], ["cal", "캘린더", "🗓️"], ["more", "더보기", "≡"]];

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 62},${28 - ((v - min) / r) * 24 - 2}`).join(" ");
  return <svg className="dl-spark" viewBox="0 0 62 30" preserveAspectRatio="none"><polyline fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth="1.8" points={pts} /></svg>;
}

export default function Lite({ b, live, onPro, openStock, openNews }: {
  b: Briefing; live: Live; onPro: () => void;
  openStock: (s: Stock) => void; openNews: (n: NewsItem) => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [markets, setMarkets] = useState<MItem[]>([]);
  const [nstocks, setNstocks] = useState<NStock[]>([]);
  const [tab, setTab] = useState("today");
  const [flow, setFlow] = useState("turnover");

  useEffect(() => {
    fetch("/api/markets").then(r => r.json()).then(d => setMarkets(d.data || [])).catch(() => {});
    fetch("/api/naver-stocks?limit=12").then(r => r.json()).then(d => setNstocks(d.stocks || [])).catch(() => {});
  }, []);

  const grp = (g: string) => markets.filter(m => m.group === g);
  const us = grp("미국"), kr = grp("국내"), ind = grp("지표");
  const avg = (a: MItem[]) => a.length ? a.reduce((x, m) => x + m.chg, 0) / a.length : 0;
  const vix = ind.find(x => x.name.includes("VIX"))?.level ?? 17.7;
  const score = Math.max(3, Math.min(99, Math.round(50 + (us.length ? avg(us) : 2.0) * 3.2 + (kr.length ? avg(kr) : 3.9) * 2.2 + (18 - vix) + (live.btcChg ?? 0) * 0.3)));
  const mood = score >= 72 ? "활짝 갭니다" : score >= 58 ? "맑게 갭니다" : score >= 45 ? "구름 조금" : score >= 32 ? "흐립니다" : "비 소식";

  const NS = (nstocks.length ? nstocks : SAMPLE_CHART).map(s => ({ ...s, spark: s.spark || mkSpark(s.up) }));
  const flows = [...NS].sort((a, b) => flow === "up" ? b.chg - a.chg : flow === "down" ? a.chg - b.chg : 0).slice(0, 6);
  const news = (b.news && b.news.length) ? b.news : ([
    { id: "n1", title: "외국인 24거래일 만에 순매수 전환… 반도체로 자금 집중", source: "네이버뉴스", ago: "32분 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
    { id: "n2", title: "미국 물가 둔화 전망에 금리 인하 기대 커져", source: "네이버뉴스", ago: "1시간 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
    { id: "n3", title: "반도체 특별법 통과… 투자 세액공제 확대", source: "네이버뉴스", ago: "2시간 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
  ] as NewsItem[]);

  const idxBar = [
    { n: "코스피", ...(kr[0] || { level: 8123.62, chg: 4.63 }) },
    { n: "나스닥", ...(us.find(x => x.name.includes("나스닥")) || { level: 25888, chg: 0.3 }) },
    { n: "VIX", level: vix, chg: -9.0 },
  ];
  const now = new Date();
  const openNS = (s: NStock) => openStock({ rank: s.rank, name: s.name, market: s.market, code: s.code, price: s.price, chg: s.chg, turnover: s.turnover, volume: s.volume, pos52: "", note: "", reason: `거래대금 ${s.turnover} · 시총 ${s.marketcap}`, spark: [], pro: false, profile: [], forecast: { trend: "", up: "", down: "" } } as Stock);

  return (
    <div className="dl" data-theme={theme}>
      <header className="dl-top">
        <div className="dl-wm">여명</div>
        <div className="dl-idx">
          {idxBar.map(x => <span key={x.n}>{x.n} <b>{comma(x.level)}</b> <em className={cc(x.chg)}>{sgn(x.chg)}</em></span>)}
        </div>
        <button className="dl-theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} aria-label="테마 전환">{theme === "dark" ? "☀️" : "🌙"}</button>
      </header>

      <main className="dl-main">
        {tab === "today" && <>
          <div className="dl-today">
            <div className="dl-greet">{now.getMonth() + 1}월 {now.getDate()}일 {wd[now.getDay()]} · 장 열리기 전</div>
            <div className="dl-scrow"><div className="dl-scnum">{score}</div><div className="dl-scmood">오늘 시장은<br />{mood}</div></div>
            <div className="dl-scbar"><i style={{ width: score + "%" }} /></div>
            <p className="dl-lede">밤사이 미국 증시가 올랐어요. 보통 미국이 오르면 우리 시장도 기분 좋게 출발하는 경우가 많아요. 🌅</p>
            <div className="dl-ai" onClick={() => setTab("more")}><b>✨ AI 실시간 이슈</b><span>호르무즈 긴장 재고조 — 에너지·방산 영향</span><span className="u">▲</span></div>
          </div>
          <section className="dl-sec">
            <div className="dl-st">먼저 볼 것</div>
            <div className="dl-sigs">
              {SIGNALS.map((s, i) => (
                <div className="dl-sig" key={i}><span className="dl-flag">{s.flag}</span><div className="dl-sigb"><div className="dl-sigt">{s.tk}</div><div className="dl-sigr">{s.reason}</div></div><span className={"dl-badge " + cc(s.chg)}>{sgn(s.chg)}</span></div>
              ))}
            </div>
          </section>
        </>}

        {tab === "chart" && <section className="dl-sec">
          <div className="dl-st">돈이 몰리는 곳</div>
          <div className="dl-tabs">{FLOW_TABS.map(([k, l]) => <button key={k} className={flow === k ? "on" : ""} onClick={() => setFlow(k)}>{l}</button>)}</div>
          <div className="dl-rank">
            {flows.map(s => (
              <div className="dl-row" key={s.code} onClick={() => openNS(s)}>
                <span className="dl-logo" style={{ background: logoColor(s.name) }}>{s.name[0]}</span>
                <div className="dl-rb"><div className="dl-rn">{s.name}</div><div className="dl-rs">{flow === "volume" ? "거래량 " + s.volume : "거래대금 " + s.turnover}</div></div>
                <Spark data={s.spark!} up={s.chg >= 0} />
                <div className="dl-rp"><b>{comma(s.price)}</b><span className={"dl-badge " + cc(s.chg)}>{sgn(s.chg)}</span></div>
              </div>
            ))}
          </div>
        </section>}

        {tab === "cal" && <section className="dl-sec">
          <div className="dl-st">오늘 일정 · 캘린더</div>
          <div className="dl-cal">{CAL.map((c, i) => (
            <div className="dl-cev" key={i}><div className="dl-cwhen"><b>{c.d}</b><span>{c.t}</span></div><div className="dl-cb">{c.ev}</div><span className="dl-ctag">{c.tag}</span></div>
          ))}</div>
        </section>}

        {tab === "more" && <section className="dl-sec">
          <div className="dl-st">지금 이슈</div>
          <div className="dl-news">{news.slice(0, 5).map(n => (
            <div className="dl-nrow" key={n.id} onClick={() => openNews(n)}><div className="dl-ntt">{n.title}</div><div className="dl-nmt">{n.source} · {n.ago}</div></div>
          ))}</div>
          <button className="dl-pro" onClick={onPro}>📊 지수·수급·섹터까지 — 고수 모드로 보기</button>
          <p className="dl-fine">여명 · 투자 참고용 정보입니다. 특정 종목 매수·매도 권유가 아니며, 최종 판단과 책임은 본인에게 있어요. 수치는 데모 예시입니다.</p>
        </section>}
      </main>

      <nav className="dl-nav">
        {NAV.map(([k, label, ic]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><span className="ic">{ic}</span>{label}</button>
        ))}
      </nav>
    </div>
  );
}
