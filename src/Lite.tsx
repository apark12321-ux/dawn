import { useEffect, useState, ReactNode } from "react";
import { Briefing, Stock, NewsItem } from "./lib/types";
import { Live } from "./hooks/useLive";

type MItem = { name: string; group: string; unit: string; level: number; chg: number; spark?: number[] };
type NStock = { rank: number; name: string; code: string; market: string; price: number; chg: number; volume: string; turnover: string; marketcap: string; up: boolean; spark?: number[] };

const cc = (n: number) => (n >= 0 ? "u" : "d");
const sgn = (n: number) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(2) + "%";
const comma = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const wd = ["일", "월", "화", "수", "목", "금", "토"];
const LOGO_C = ["#0EA5C4", "#2F86F0", "#12B886", "#7A6FF0", "#F0820F", "#E64980"];
const logoColor = (s: string) => LOGO_C[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_C.length];
const mkSpark = (up: boolean) => { let v = 50; return Array.from({ length: 12 }, () => { v += (Math.random() - (up ? 0.42 : 0.58)) * 9; return Math.max(10, Math.min(90, v)); }); };

const SIGNALS = [
  { tk: "나스닥", flag: "🇺🇸", reason: "AI 반도체가 끌어올려서", chg: 2.54 },
  { tk: "코스피", flag: "🇰🇷", reason: "외국인이 다시 사들여서", chg: 4.63 },
  { tk: "S&P 500", flag: "🇺🇸", reason: "지정학 긴장이 풀려서", chg: 1.75 },
  { tk: "원/달러", flag: "💵", reason: "위험 회피가 잦아들어서", chg: -0.21 },
];
const INDICES = [
  { n: "코스피", v: 8123.62, c: 4.63 }, { n: "코스닥", v: 1029.05, c: 3.22 },
  { n: "나스닥", v: 25888.84, c: 0.3 }, { n: "S&P 500", v: 7394.30, c: 1.75 },
  { n: "다우", v: 50848.75, c: 1.86 }, { n: "니케이225", v: 64024.60, c: -0.24 },
];
const MACRO = [
  { n: "원/달러", v: "1,517원", c: -0.21 }, { n: "원/엔(100)", v: "947원", c: 0.1 },
  { n: "美 10년물", v: "4.18%", c: -0.03 }, { n: "WTI 유가", v: "$78.4", c: 1.2 },
  { n: "금", v: "$4,222", c: 0.6 }, { n: "VIX", v: "17.68", c: -9.0 },
];
const SAMPLE_CHART: NStock[] = [
  { rank: 1, name: "SK하이닉스", code: "000660", market: "코스피", price: 318000, chg: 2.9, volume: "420만", turnover: "8,420억", marketcap: "231조", up: true },
  { rank: 2, name: "삼성전자", code: "005930", market: "코스피", price: 94300, chg: 8.5, volume: "1,290만", turnover: "1.07조", marketcap: "562조", up: true },
  { rank: 3, name: "한미반도체", code: "042700", market: "코스피", price: 168500, chg: 4.8, volume: "610만", turnover: "6,980억", marketcap: "16조", up: true },
  { rank: 4, name: "알테오젠", code: "196170", market: "코스닥", price: 384000, chg: 2.7, volume: "140만", turnover: "4,180억", marketcap: "20조", up: true },
  { rank: 5, name: "에코프로비엠", code: "247540", market: "코스닥", price: 184000, chg: -3.7, volume: "210만", turnover: "2,870억", marketcap: "18조", up: false },
  { rank: 6, name: "현대차", code: "005380", market: "코스피", price: 246500, chg: 1.2, volume: "160만", turnover: "3,610억", marketcap: "51조", up: true },
];
const FLOW_TABS = [["turnover", "거래대금"], ["volume", "거래량"], ["up", "급상승"], ["down", "급하락"], ["pop", "인기"]];
const EARNINGS = [
  { name: "카맥스", tk: "KMX", logo: "#1B4DDB", when: "17일 21:00", q: "주요기업" },
  { name: "자빌", tk: "JBL", logo: "#2B2F36", when: "17일 21:30", q: "주요기업" },
  { name: "엔비디아", tk: "NVDA", logo: "#76B900", when: "26일 06:00", q: "관심급증" },
  { name: "마이크론", tk: "MU", logo: "#0A4E9B", when: "27일 21:00", q: "반도체" },
];
const REPORTS = [
  { t: "스페이스X, 어떤 종목이지? 핵심만", tag: "지금 뜨는 이슈", c: "#1E2633" },
  { t: "2026 북중미 월드컵, 투자 아이디어는?", tag: "지금 뜨는 이슈", c: "#0E7C42" },
  { t: "외국인 순매수 전환, 무엇을 담았나", tag: "리서치센터", c: "#7A1F2B" },
];
const SECTORS = [
  { name: "반도체", chg: 5.8, view: "긍정" }, { name: "바이오", chg: 4.2, view: "긍정" },
  { name: "방산", chg: 3.1, view: "긍정" }, { name: "2차전지", chg: -1.4, view: "관망" },
  { name: "자동차", chg: 0.8, view: "중립" }, { name: "금융", chg: -0.6, view: "중립" },
];
const SUPPLY = [["외국인", "+3,260억", true], ["기관", "−2,390억", false], ["개인", "−870억", false]] as [string, string, boolean][];
const CAL = [
  { d: "오늘", t: "09:00", ev: "코스피·코스닥 개장", tag: "장" },
  { d: "오늘 밤", t: "21:30", ev: "미국 5월 소매판매 발표", tag: "지표" },
  { d: "17일", t: "21:00", ev: "카맥스 실적 발표", tag: "실적" },
  { d: "19일", t: "08:00", ev: "한국 6월 수출입 잠정치", tag: "지표" },
];
const VALUE = [
  { name: "기업은행", per: "5.2", div: "6.8%", note: "저PER·고배당" },
  { name: "현대차", per: "5.1", div: "4.5%", note: "PBR 0.58 저평가" },
  { name: "KB금융", per: "6.0", div: "5.0%", note: "ROE 9.5%" },
];
const REPORT = [
  "밤사이 미국 증시가 강세로 마감했어요. 보통 미국이 오르면 우리 시장도 기분 좋게 출발하는 경우가 많아요.",
  "외국인이 다시 사기 시작했어요. 주로 삼성전자·SK하이닉스 같은 큰 종목에 힘이 실려요.",
  "환율이 안정적이고 변동성(VIX)도 낮아 시장은 차분한 편이에요. 단기 급등 뒤 조정은 주의하세요.",
];
const NAV = [["today", "오늘", "🌊"], ["chart", "차트", "📈"], ["sector", "섹터", "🧭"], ["cal", "캘린더", "🗓️"], ["more", "더보기", "≡"]];

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 62},${28 - ((v - min) / r) * 24 - 2}`).join(" ");
  return <svg className="dl-spark" viewBox="0 0 62 30" preserveAspectRatio="none"><polyline fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth="1.8" points={pts} /></svg>;
}
const Bars = ({ items }: { items: { name: string; chg: number }[] }) => (
  <div className="dl-secbars">{items.map(s => { const w = Math.min(100, Math.abs(s.chg) * 14 + 8); return (
    <div className="dl-bar" key={s.name}><span className="dl-barn">{s.name}</span><div className="dl-bart"><i className={cc(s.chg)} style={{ width: w + "%" }} /></div><span className={"dl-barv " + cc(s.chg)}>{sgn(s.chg)}</span></div>
  ); })}</div>
);

export default function Lite({ b, live, onPro, pro = false, openStock, openNews }: {
  b: Briefing; live: Live; onPro: () => void; pro?: boolean;
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
  const vix = ind.find(x => x.name.includes("VIX"))?.level ?? 17.68;
  const score = Math.max(3, Math.min(99, Math.round(50 + (us.length ? avg(us) : 2.0) * 3.2 + (kr.length ? avg(kr) : 3.9) * 2.2 + (18 - vix) + (live.btcChg ?? 0) * 0.3)));
  const mood = score >= 72 ? "활짝 갭니다" : score >= 58 ? "맑게 갭니다" : score >= 45 ? "구름 조금" : score >= 32 ? "흐립니다" : "비 소식";

  const NS = (nstocks.length ? nstocks : SAMPLE_CHART).map(s => ({ ...s, spark: s.spark || mkSpark(s.up) }));
  const flows = [...NS].sort((a, b) => flow === "up" ? b.chg - a.chg : flow === "down" ? a.chg - b.chg : 0).slice(0, pro ? 10 : 6);
  const news = (b.news && b.news.length) ? b.news : ([
    { id: "n1", title: "외국인 24거래일 만에 순매수 전환… 반도체로 자금 집중", source: "네이버뉴스", ago: "32분 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
    { id: "n2", title: "미국 물가 둔화 전망에 금리 인하 기대 커져", source: "네이버뉴스", ago: "1시간 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
    { id: "n3", title: "반도체 특별법 통과… 투자 세액공제 확대", source: "네이버뉴스", ago: "2시간 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
    { id: "n4", title: "기관·외국인 4.5조 동반 매수, 대형주 쏠림", source: "네이버뉴스", ago: "3시간 전", tag: "nu", tagText: "", tickers: [], summary: "", url: "#" },
  ] as NewsItem[]);
  const idxBar = [{ n: "코스피", l: comma(kr[0]?.level || 8123.62), c: kr[0]?.chg ?? 4.63 }, { n: "나스닥", l: comma(us.find(x => x.name.includes("나스닥"))?.level || 25888), c: us.find(x => x.name.includes("나스닥"))?.chg ?? 0.3 }, { n: "VIX", l: String(vix), c: -9.0 }];
  const now = new Date();
  const openNS = (s: NStock) => openStock({ rank: s.rank, name: s.name, market: s.market, code: s.code, price: s.price, chg: s.chg, turnover: s.turnover, volume: s.volume, pos52: "", note: "", reason: `거래대금 ${s.turnover} · 시총 ${s.marketcap}`, spark: [], pro: false, profile: [], forecast: { trend: "", up: "", down: "" } } as Stock);

  const Sec = ({ t, sub, children }: { t: string; sub?: string; children: ReactNode }) => (
    <section className="dl-sec"><div className="dl-st">{t}{sub && <span>{sub}</span>}</div>{children}</section>
  );
  const Rows = ({ items }: { items: { n: string; v?: string; l?: string; c: number }[] }) => (
    <div className="dl-card2">{items.map(x => <div className="dl-irow" key={x.n}><span className="dl-in">{x.n}</span><span className="dl-iv">{x.v || x.l}</span><span className={"dl-badge " + cc(x.c)}>{sgn(x.c)}</span></div>)}</div>
  );

  return (
    <div className="dl" data-theme={theme}>
      <header className="dl-top">
        <div className="dl-wm">여명{pro && <i className="dl-pill">PRO</i>}</div>
        <div className="dl-idx">{idxBar.map(x => <span key={x.n}>{x.n} <b>{x.l}</b> <em className={cc(x.c)}>{sgn(x.c)}</em></span>)}</div>
        <button className="dl-theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️" : "🌙"}</button>
      </header>

      <main className="dl-main">
        {tab === "today" && <>
          <div className="dl-today">
            <div className="dl-greet">{now.getMonth() + 1}월 {now.getDate()}일 {wd[now.getDay()]} · 장 열리기 전 · v28</div>
            <div className="dl-scrow"><div className="dl-scnum">{score}</div><div className="dl-scmood">오늘 시장은<br />{mood}</div></div>
            <div className="dl-scbar"><i style={{ width: score + "%" }} /></div>
            <p className="dl-lede">밤사이 미국 증시가 올랐어요. 보통 미국이 오르면 우리 시장도 기분 좋게 출발하는 경우가 많아요. 🌊</p>
            <div className="dl-ai" onClick={() => setTab("more")}><b>✨ AI 실시간 이슈</b><span>호르무즈 긴장 재고조 — 에너지·방산 영향</span><span className="u">▲</span></div>
          </div>
          <Sec t="먼저 볼 것" sub="왜 움직였는지부터">
            <div className="dl-card2">{SIGNALS.map((s, i) => <div className="dl-sig" key={i}><span className="dl-flag">{s.flag}</span><div className="dl-sigb"><div className="dl-sigt">{s.tk}</div><div className="dl-sigr">{s.reason}</div></div><span className={"dl-badge " + cc(s.chg)}>{sgn(s.chg)}</span></div>)}</div>
          </Sec>
          <Sec t="오늘의 전망 리포트" sub="🔰 쉽게 풀이">
            <div className="dl-report">
              <p className="dl-rlead">오늘 아침, <mark>밤사이 미국이 오르고 외국인이 돌아왔어요.</mark> 출발은 우호적입니다.</p>
              {REPORT.map((r, i) => <p key={i}>{r}</p>)}
            </div>
          </Sec>
        </>}

        {tab === "chart" && <>
          <Sec t="국내·해외 지수"><Rows items={INDICES.map(x => ({ n: x.n, v: comma(x.v), c: x.c }))} /></Sec>
          <Sec t="환율·금리·원자재"><Rows items={MACRO.map(x => ({ n: x.n, v: x.v, c: x.c }))} /></Sec>
          <Sec t="돈이 몰리는 곳">
            <div className="dl-tabs">{FLOW_TABS.map(([k, l]) => <button key={k} className={flow === k ? "on" : ""} onClick={() => setFlow(k)}>{l}</button>)}</div>
            <div className="dl-rank">{flows.map(s => (
              <div className="dl-row" key={s.code} onClick={() => openNS(s)}>
                <span className="dl-logo" style={{ background: logoColor(s.name) }}>{s.name[0]}</span>
                <div className="dl-rb"><div className="dl-rn">{s.name}</div><div className="dl-rs">{flow === "volume" ? "거래량 " + s.volume : "거래대금 " + s.turnover}</div></div>
                <Spark data={s.spark!} up={s.chg >= 0} />
                <div className="dl-rp"><b>{comma(s.price)}</b><span className={"dl-badge " + cc(s.chg)}>{sgn(s.chg)}</span></div>
              </div>))}</div>
          </Sec>
        </>}

        {tab === "sector" && <>
          <Sec t="섹터·테마 전망" sub="자금 흐름"><Bars items={SECTORS} /></Sec>
          <Sec t="업종 전망 한눈에">
            <div className="dl-card2">{SECTORS.map(s => <div className="dl-irow" key={s.name}><span className="dl-in">{s.name}</span><span className={"dl-vb " + (s.view === "긍정" ? "vp" : s.view === "관망" ? "vm" : "vn")}>{s.view}</span><span className={"dl-badge " + cc(s.chg)}>{sgn(s.chg)}</span></div>)}</div>
          </Sec>
          <Sec t="외국인·기관 수급" sub="순매수 · 억원">
            <div className="dl-card2">{SUPPLY.map(([n, v, up]) => <div className="dl-irow" key={n}><span className="dl-in">{n}</span><span className={"dl-iv " + (up ? "u" : "d")}>{v}</span></div>)}</div>
          </Sec>
          {pro && <Sec t="가치주 스크리너" sub="저평가 · 객관 지표">
            <div className="dl-card2">{VALUE.map(x => <div className="dl-irow" key={x.name}><span className="dl-in">{x.name}<em className="dl-sub2">{x.note}</em></span><span className="dl-iv">PER {x.per}</span><span className="dl-badge u">{x.div}</span></div>)}</div>
          </Sec>}
        </>}

        {tab === "cal" && <>
          <Sec t="다가오는 어닝콜" sub="실적 발표 모아보기">
            <div className="dl-ecards">{EARNINGS.map(e => (
              <div className="dl-ecard" key={e.tk}><span className="dl-elogo" style={{ background: e.logo }}>{e.tk[0]}</span><div className="dl-en">{e.name}</div><div className="dl-eq">{e.q}</div><div className="dl-edate">{e.when}</div></div>
            ))}</div>
          </Sec>
          <Sec t="오늘 일정 · 캘린더">
            <div className="dl-card2">{CAL.map((c, i) => <div className="dl-cev" key={i}><div className="dl-cwhen"><b>{c.d}</b><span>{c.t}</span></div><div className="dl-cb">{c.ev}</div><span className="dl-ctag">{c.tag}</span></div>)}</div>
          </Sec>
          <Sec t="이번 주 핵심 일정" sub="실적·지표·공모주">
            <div className="dl-card2">
              <div className="dl-irow"><span className="dl-in">미국 CPI 발표</span><span className="dl-iv">17일</span></div>
              <div className="dl-irow"><span className="dl-in">삼성전자 잠정실적</span><span className="dl-iv">18일</span></div>
              <div className="dl-irow"><span className="dl-in">신규 IPO 청약 (○○텍)</span><span className="dl-iv">19일</span></div>
            </div>
          </Sec>
        </>}

        {tab === "more" && <>
          <Sec t="리서치 리포트" sub="에디터가 쉽게 풀이">
            <div className="dl-rcards">{REPORTS.map((r, i) => (
              <div className="dl-rcard" key={i}><div className="dl-rthumb" style={{ background: r.c }}>📑</div><div className="dl-rb"><div className="dl-rtt">{r.t}</div><div className="dl-rtag">📈 {r.tag}</div></div></div>
            ))}</div>
          </Sec>
          <Sec t="지금 이슈" sub="시장 영향 뉴스">
            <div className="dl-card2">{news.slice(0, pro ? 8 : 5).map(n => <div className="dl-nrow" key={n.id} onClick={() => openNews(n)}><div className="dl-ntt">{n.title}</div><div className="dl-nmt">{n.source} · {n.ago}</div></div>)}</div>
          </Sec>
          {pro && <Sec t="AI 종목 스크리너" sub="구글 검색 연동">
            <a href="/finder" className="dl-finder">🔎 종목 입력해 관찰 포인트 분석하기 →</a>
          </Sec>}
          <Sec t="설정">
            <div className="dl-card2">
              <button className="dl-mrow" onClick={onPro}>{pro ? "🔰 초보 모드로 보기" : "📊 고수 모드 — 정보 더 많이 보기"}</button>
              <button className="dl-mrow" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️ 라이트 테마" : "🌙 다크 테마"}</button>
            </div>
          </Sec>
          <p className="dl-fine">여명 · 투자 참고용 정보입니다. 특정 종목 매수·매도 권유가 아니며, 최종 판단과 책임은 본인에게 있어요. 수치는 데모 예시입니다.</p>
        </>}
      </main>

      <nav className="dl-nav">{NAV.map(([k, label, ic]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><span className="ic">{ic}</span>{label}</button>)}</nav>
    </div>
  );
}
