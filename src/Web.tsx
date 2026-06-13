import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";
import { Briefing, Stock, NewsItem } from "./lib/types";
import { Live } from "./hooks/useLive";

type MItem = { name: string; group: string; unit: string; level: number; chg: number; spark?: number[] };
type NStock = { rank: number; name: string; code: string; market: string; price: number; chg: number; volume: string; turnover: string; marketcap: string; up: boolean };

const wd = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const fmtDate = () => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${wd[d.getDay()]}`; };
const cc = (n: number) => (n >= 0 ? "u" : "d");
const ar = (n: number) => (n >= 0 ? "▲" : "▼") + Math.abs(n).toFixed(2) + "%";
const comma = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtLevel = (m: MItem) => m.unit === "%" ? m.level.toFixed(2) + "%" : m.unit === "$" ? "$" + comma(m.level) : comma(m.level);

function Spark({ data, up }: { data?: number[]; up: boolean }) {
  if (!data || data.length < 2) return <div className="empty">—</div>;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${34 - ((v - min) / r) * 30 - 2}`).join(" ");
  return <svg className="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline className={up ? "u" : "d"} points={pts} /></svg>;
}
const Soon = ({ txt }: { txt: string }) => <div className="empty" style={{ margin: "auto", padding: 24 }}>{txt}</div>;

// ===== 목업 데이터 (라이브 미수신 시 폴백) =====
const SAMPLE_MARKETS: MItem[] = [
  { name: "코스피", group: "국내", unit: "", level: 8123.62, chg: 4.63 }, { name: "코스닥", group: "국내", unit: "", level: 1029.05, chg: 3.22 }, { name: "코스피200", group: "국내", unit: "", level: 1231.54, chg: 0.36 },
  { name: "나스닥", group: "미국", unit: "", level: 25809.66, chg: 2.54, spark: [248, 250, 249, 253, 255, 256, 258, 258] }, { name: "S&P 500", group: "미국", unit: "", level: 7394.30, chg: 1.75 }, { name: "다우", group: "미국", unit: "", level: 50848.75, chg: 1.86 }, { name: "필라델피아반도체", group: "미국", unit: "", level: 6842.10, chg: 3.40 },
  { name: "니케이225", group: "아시아", unit: "", level: 64024.60, chg: -0.24 }, { name: "항셍", group: "아시아", unit: "", level: 24657.06, chg: 1.02 }, { name: "상하이종합", group: "아시아", unit: "", level: 3959.34, chg: -0.85 }, { name: "대만 가권", group: "아시아", unit: "", level: 24112.00, chg: 1.95 },
  { name: "유로스톡스50", group: "유럽", unit: "", level: 6062.29, chg: 0.87 }, { name: "독일 DAX", group: "유럽", unit: "", level: 24616.22, chg: 1.74 }, { name: "영국 FTSE100", group: "유럽", unit: "", level: 10373.20, chg: 1.15 }, { name: "프랑스 CAC40", group: "유럽", unit: "", level: 8199.29, chg: 0.46 },
  { name: "美 10년물", group: "금리", unit: "%", level: 4.18, chg: -0.03 }, { name: "美 5년물", group: "금리", unit: "%", level: 4.05, chg: -0.02 }, { name: "美 30년물", group: "금리", unit: "%", level: 4.39, chg: -0.04 }, { name: "美 13주", group: "금리", unit: "%", level: 4.30, chg: -0.01 },
  { name: "WTI 원유", group: "원자재", unit: "$", level: 78.4, chg: 1.2 }, { name: "브렌트유", group: "원자재", unit: "$", level: 82.1, chg: 1.0 }, { name: "금", group: "원자재", unit: "$", level: 4222.62, chg: 0.6 }, { name: "은", group: "원자재", unit: "$", level: 29.8, chg: 1.1 }, { name: "구리", group: "원자재", unit: "$", level: 4.32, chg: 0.9 }, { name: "천연가스", group: "원자재", unit: "$", level: 2.41, chg: -1.8 },
  { name: "VIX 변동성", group: "지표", unit: "", level: 14.2, chg: -7.2 }, { name: "달러인덱스", group: "지표", unit: "", level: 103.4, chg: -0.21 },
];
const SAMPLE_STOCKS: NStock[] = [
  { rank: 1, name: "삼성전자", code: "005930", market: "KP", price: 94300, chg: 1.9, volume: "12.9M", turnover: "1.07조", marketcap: "562.8조", up: true },
  { rank: 2, name: "SK하이닉스", code: "000660", market: "KP", price: 318000, chg: 3.2, volume: "4.2M", turnover: "8,420억", marketcap: "231.5조", up: true },
  { rank: 3, name: "한미반도체", code: "042700", market: "KP", price: 168500, chg: 4.8, volume: "6.1M", turnover: "6,980억", marketcap: "16.4조", up: true },
  { rank: 4, name: "LG에너지솔루션", code: "373220", market: "KP", price: 412000, chg: 2.1, volume: "1.8M", turnover: "5,210억", marketcap: "96.4조", up: true },
  { rank: 5, name: "알테오젠", code: "196170", market: "KQ", price: 384000, chg: 2.7, volume: "1.4M", turnover: "4,180억", marketcap: "20.5조", up: true },
  { rank: 6, name: "리가켐바이오", code: "141080", market: "KQ", price: 142500, chg: 5.1, volume: "2.9M", turnover: "3,920억", marketcap: "5.1조", up: true },
  { rank: 7, name: "현대차", code: "005380", market: "KP", price: 246500, chg: 1.2, volume: "1.6M", turnover: "3,610억", marketcap: "51.7조", up: true },
  { rank: 8, name: "셀트리온", code: "068270", market: "KP", price: 198400, chg: -0.8, volume: "1.9M", turnover: "3,280억", marketcap: "43.2조", up: false },
  { rank: 9, name: "HD현대일렉트릭", code: "267260", market: "KP", price: 428800, chg: 8.9, volume: "0.9M", turnover: "3,140억", marketcap: "15.4조", up: true },
  { rank: 10, name: "에코프로비엠", code: "247540", market: "KQ", price: 184000, chg: -3.7, volume: "2.1M", turnover: "2,870억", marketcap: "18.0조", up: false },
  { rank: 11, name: "두산에너빌리티", code: "034020", market: "KP", price: 41250, chg: 2.2, volume: "8.4M", turnover: "2,460억", marketcap: "26.4조", up: true },
  { rank: 12, name: "NAVER", code: "035420", market: "KP", price: 254000, chg: 1.2, volume: "0.7M", turnover: "1,980억", marketcap: "38.2조", up: true },
];
const SAMPLE_NEWS: NewsItem[] = [
  { id: "s1", title: "외국인 24거래일 만에 순매수 전환… 반도체 주도", source: "네이버뉴스", ago: "32분", tag: "nu", tagText: "뉴스", summary: "", tickers: [], url: "#" },
  { id: "s2", title: "노무라 \"반도체 슈퍼사이클 시작, 코스피 11,000 간다\"", source: "네이버뉴스", ago: "1시간", tag: "nu", tagText: "뉴스", summary: "", tickers: [], url: "#" },
  { id: "s3", title: "HBM 신규 공급계약 기대에 장전 매수세 급증", source: "네이버뉴스", ago: "2시간", tag: "nu", tagText: "뉴스", summary: "", tickers: [], url: "#" },
  { id: "s4", title: "코스닥 반도체 소부장주 급등… 신고가 종목 95% 차지", source: "네이버뉴스", ago: "3시간", tag: "nu", tagText: "뉴스", summary: "", tickers: [], url: "#" },
  { id: "s5", title: "기관·외국인 4.5조 폭풍 매수 동행", source: "네이버뉴스", ago: "4시간", tag: "nu", tagText: "뉴스", summary: "", tickers: [], url: "#" },
];
const SAMPLE_STRAT = { up: "美 강세 연장 시 갭상승 후 눌림 매물 소화 관찰", ob: "시초 외국인 수급·대형주 거래대금 집중도 확인", dn: "과열(72)·VIX 저점 — 추격 변동성 리스크 상존" };
const SAMPLE_SECTORS = [{ name: "반도체", chg: 5.8 }, { name: "바이오", chg: 4.2 }, { name: "2차전지", chg: -1.4 }, { name: "방산", chg: 3.1 }, { name: "전력·원자력", chg: 2.9 }, { name: "자동차", chg: 0.8 }, { name: "인터넷", chg: 1.6 }, { name: "금융", chg: -0.6 }];
const SUPPLY = [["외국인", 3260, true], ["기관계", -2390, false], ["└ 연기금", 1210, true], ["└ 금융투자", -1320, false], ["개인", -870, false]] as [string, number, boolean][];
const CAL = [["08:00", "NXT 장전 시간외 개시"], ["09:00", "정규장 개장"], ["08:30", "美 5월 CPI 발표(밤)"], ["10:00", "삼성전자 컨퍼런스콜"], ["16:00", "SK하이닉스 수주 공시 예정"], ["21:30", "美 신규 실업수당 청구"]] as [string, string][];

// 섹터 전망 (종목추천 X · 업종 방향성만 · 주린이용 쉬운 설명)
const SECTOR_OUTLOOK = [
  { name: "반도체", view: "긍정", note: "AI 메모리(HBM) 수요가 강해요. 외국인 매수도 이쪽에 몰리는 중." },
  { name: "바이오", view: "긍정", note: "기술수출 기대감이 살아있어요. 다만 뉴스에 따라 출렁임이 큰 편." },
  { name: "2차전지", view: "관망", note: "전기차 성장 둔화 우려로 한동안 등락을 반복하고 있어요." },
  { name: "방산", view: "긍정", note: "해외 수출 수주가 계속 나오면서 흐름이 좋습니다." },
  { name: "자동차", view: "중립", note: "환율은 유리하지만 관세 리스크가 섞여 방향이 애매해요." },
  { name: "금융", view: "중립", note: "금리 인하 기대와 실적 사이에서 눈치보기 장세." },
] as { name: string; view: string; note: string }[];

// 시장에 영향 주는 국내외 이슈 (경제·금융·사회)
const SAMPLE_ISSUES = [
  { cat: "금융", title: "외국인 24거래일 만에 순매수 전환… 반도체 집중", impact: "긍정" },
  { cat: "경제", title: "美 5월 CPI 둔화 전망 — 연내 금리 인하 기대 확산", impact: "긍정" },
  { cat: "경제", title: "원/달러 환율 안정세, 외국인 자금 유입 우호적", impact: "긍정" },
  { cat: "사회", title: "반도체 특별법 국회 통과… 투자 세액공제 확대", impact: "긍정" },
  { cat: "금융", title: "기관·외국인 4.5조 동반 매수, 대형주 쏠림", impact: "중립" },
  { cat: "경제", title: "국제유가 소폭 상승 — 정유·화학 원가 부담 변수", impact: "부정" },
] as { cat: string; title: string; impact: string }[];

// 오늘의 전망 리포트 (주린이용 · 쉬운 말 · 매수/매도 권유 없음)
const REPORT = [
  "밤사이 미국 증시가 강세로 마감했어요. 보통 미국이 오르면 다음 날 우리 시장도 기분 좋게 출발하는 경우가 많습니다.",
  "외국인이 다시 사기 시작했어요. 외국인 매수는 주로 삼성전자·SK하이닉스 같은 큰 종목에 힘을 실어줍니다.",
  "환율(원/달러)이 안정적이에요. 환율이 내려가면 외국인이 한국 주식을 사기 편해집니다.",
  "변동성 지수(VIX)가 낮아 시장은 차분한 편이에요. 다만 단기간에 많이 오른 뒤에는 쉬어가는 조정도 올 수 있어 무리한 추격은 주의가 필요합니다.",
];

// 섹터 → 상위종목·관련종목 (정보 제공용 · 추천 아님)
const SECTOR_STOCKS: Record<string, string[]> = {
  "반도체": ["삼성전자", "SK하이닉스", "한미반도체"],
  "바이오": ["알테오젠", "리가켐바이오", "셀트리온"],
  "2차전지": ["LG에너지솔루션", "에코프로비엠", "포스코퓨처엠"],
  "방산": ["한화에어로스페이스", "LIG넥스원", "현대로템"],
  "자동차": ["현대차", "기아", "현대모비스"],
  "금융": ["KB금융", "신한지주", "메리츠금융"],
};
// 스크리너 카테고리 (객관적 재무지표 · 추천 아님 · 확장 가능한 카테고리 구조)
type ScrItem = { name: string; code: string; sector: string; per: number; pbr: number; roe: number; div: number; sales: string; op: string; why: string };
const SCREENERS: { key: string; label: string; desc: string; items: ScrItem[] }[] = [
  {
    key: "value", label: "가치주 · 저평가", desc: "PER·PBR은 낮은데 매출·이익은 꾸준히 느는 기업 (적립식·가치투자용 객관 지표)",
    items: [
      { name: "기업은행", code: "024110", sector: "금융", per: 5.2, pbr: 0.42, roe: 9.1, div: 6.8, sales: "3년↑", op: "+12%", why: "PER 5.2배로 은행업 평균(약 6.5배)보다 낮고, 순이익이 3년 연속 증가. 배당수익률 6.8%로 적립식에 유리한 구조." },
      { name: "현대차", code: "005380", sector: "자동차", per: 5.1, pbr: 0.58, roe: 12.3, div: 4.5, sales: "3년↑", op: "+9%", why: "글로벌 판매 견조로 매출 3년 연속 증가, PBR 0.58배로 자산가치 대비 저평가 구간." },
      { name: "KB금융", code: "105560", sector: "금융", per: 6.0, pbr: 0.52, roe: 9.5, div: 5.0, sales: "3년↑", op: "+7%", why: "ROE 9.5%·PBR 0.52배. 이익 성장과 배당 확대를 동시에 보이는 저PER 금융주." },
      { name: "삼성화재", code: "000810", sector: "금융", per: 8.2, pbr: 1.0, roe: 11.5, div: 5.4, sales: "3년↑", op: "+15%", why: "보험이익 성장으로 영업이익 +15%, 배당수익률 5.4%. 안정적 현금흐름." },
      { name: "HD현대", code: "267250", sector: "지주", per: 6.8, pbr: 0.70, roe: 10.2, div: 3.8, sales: "3년↑", op: "+18%", why: "조선·정유 자회사 실적 개선으로 이익 급증, PER 6.8배 저평가." },
      { name: "POSCO홀딩스", code: "005490", sector: "철강", per: 9.1, pbr: 0.50, roe: 6.8, div: 3.5, sales: "유지", op: "흑자", why: "PBR 0.5배로 순자산 절반 가격대. 철강 업황 회복 시 밸류 정상화 여지." },
    ],
  },
  {
    key: "growth", label: "성장주", desc: "매출·이익이 빠르게 늘고 ROE가 높은 기업 (PER은 다소 높을 수 있음)",
    items: [
      { name: "알테오젠", code: "196170", sector: "바이오", per: 45.0, pbr: 12.0, roe: 22.0, div: 0, sales: "+58%", op: "+70%", why: "기술수출 로열티로 매출 +58% 고성장, ROE 22%. 성장 프리미엄으로 PER은 높은 편." },
      { name: "한미반도체", code: "042700", sector: "반도체", per: 28.0, pbr: 8.0, roe: 31.0, div: 0.6, sales: "+40%", op: "+52%", why: "HBM 본더 수요로 매출 +40%, ROE 31%의 고수익 성장주." },
      { name: "HD현대일렉트릭", code: "267260", sector: "전력", per: 19.0, pbr: 5.2, roe: 28.0, div: 1.1, sales: "+35%", op: "+60%", why: "전력기기 수출 호조로 영업이익 +60%, 수주잔고 사상 최대." },
      { name: "삼성바이오로직스", code: "207940", sector: "바이오", per: 52.0, pbr: 7.5, roe: 15.0, div: 0, sales: "+25%", op: "+30%", why: "CDMO 수주 확대로 매출 +25% 지속 성장, 4공장 가동 효과." },
      { name: "두산에너빌리티", code: "034020", sector: "원자력", per: 22.0, pbr: 2.4, roe: 13.0, div: 0.4, sales: "+20%", op: "흑자전환", why: "원전·가스터빈 수주 확대로 흑자전환, 매출 성장 가속." },
    ],
  },
  {
    key: "dividend", label: "고배당주", desc: "배당수익률이 높고 현금흐름이 안정적인 기업 (장기 적립식에 적합한 지표)",
    items: [
      { name: "우리금융지주", code: "316140", sector: "금융", per: 5.0, pbr: 0.40, roe: 8.8, div: 7.2, sales: "3년↑", op: "+6%", why: "배당수익률 7.2%로 최상위, PBR 0.4배. 분기배당 도입으로 현금흐름 안정." },
      { name: "기업은행", code: "024110", sector: "금융", per: 5.2, pbr: 0.42, roe: 9.1, div: 6.8, sales: "3년↑", op: "+12%", why: "국책은행 안정성 + 배당수익률 6.8%. 저PER·고배당 동시 충족." },
      { name: "하나금융지주", code: "086790", sector: "금융", per: 5.8, pbr: 0.48, roe: 9.0, div: 6.5, sales: "3년↑", op: "+8%", why: "주주환원 확대 정책으로 배당 6.5%, 자사주 소각 병행." },
      { name: "SK텔레콤", code: "017670", sector: "통신", per: 10.5, pbr: 1.0, roe: 10.0, div: 6.1, sales: "유지", op: "+4%", why: "안정적 통신 현금흐름 기반 배당수익률 6.1%, 분기배당." },
      { name: "KT&G", code: "033780", sector: "필수소비재", per: 11.3, pbr: 1.3, roe: 11.0, div: 5.2, sales: "3년↑", op: "+8%", why: "경기 방어적 사업 + 배당 5.2%. 자사주 매입·소각 지속." },
    ],
  },
];

const viewColor = (v: string) => v === "긍정" ? "var(--up)" : v === "부정" ? "var(--down)" : "var(--gold)";

function MindMap({ score, outlook, sel, onSel }: { score: number; outlook: { name: string; view: string; note: string }[]; sel: string; onSel: (s: string) => void }) {
  const cx = 200, cy = 200, R = 138, n = outlook.length;
  const nodes = outlook.map((o, i) => { const a = (-90 + i * (360 / n)) * Math.PI / 180; return { ...o, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
  return (
    <svg className="mindmap" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
      {nodes.map(nd => <line key={nd.name + "l"} x1={cx} y1={cy} x2={nd.x} y2={nd.y} className={"mlink" + (sel === nd.name ? " on" : "")} />)}
      <circle cx={cx} cy={cy} r={46} className="mcore" />
      <text x={cx} y={cy - 6} className="mscore" textAnchor="middle">{score}</text>
      <text x={cx} y={cy + 12} className="mcorel" textAnchor="middle">투자매력도</text>
      <text x={cx} y={cy + 26} className="mcorel2" textAnchor="middle">시장 종합</text>
      {nodes.map(nd => (
        <g key={nd.name} onClick={() => onSel(nd.name)} style={{ cursor: "pointer" }}>
          <circle cx={nd.x} cy={nd.y} r={30} fill={viewColor(nd.view)} className={"mnode" + (sel === nd.name ? " on" : "")} />
          <text x={nd.x} y={nd.y - 1} className="mnt" textAnchor="middle">{nd.name}</text>
          <text x={nd.x} y={nd.y + 12} className="mnv" textAnchor="middle">{nd.view}</text>
        </g>
      ))}
    </svg>
  );
}

function Page({ no, title, of, cls, style, children }: { no: string; title: string; of: string; cls: string; style: CSSProperties; children: ReactNode }) {
  return (
    <section className={"page " + cls} style={style}>
      <div className="sheen" />
      <div className="dp">
        <div className="dp-h"><span className="dp-no">{no}</span><span className="dp-t">{title}</span><span className="dp-of">{of}</span></div>
        <div className="dp-grid">{children}</div>
      </div>
    </section>
  );
}

export default function Web({ b, live, onLite, openStock, openNews }: {
  b: Briefing; live: Live; onLite: () => void;
  openPrice: () => void; openKakao: () => void; openStock: (s: Stock) => void; openNews: (n: NewsItem) => void;
}) {
  const [cur, setCur] = useState(0);
  const busy = useRef(false);
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const [markets, setMarkets] = useState<MItem[]>([]);
  const [nstocks, setNstocks] = useState<NStock[]>([]);
  const [asof, setAsof] = useState("");
  const [sel, setSel] = useState("반도체");
  const [cat, setCat] = useState("value");
  const [scr, setScr] = useState(SCREENERS[0].items[0].name);
  const [kw, setKw] = useState("");
  const [ana, setAna] = useState("");
  const [anaErr, setAnaErr] = useState("");
  const [anaLoading, setAnaLoading] = useState(false);
  const [logs, setLogs] = useState<{ name?: string; rule?: string; period?: string; win?: string; ret?: string }[]>([]);
  const PAGES = 15;
  const curRef = useRef(cur); curRef.current = cur;

  useEffect(() => {
    fetch("/api/markets").then(r => r.json()).then(d => { setMarkets(d.data || []); if (d.asof) setAsof(d.asof); }).catch(() => {});
    fetch("/api/naver-stocks?limit=20").then(r => r.json()).then(d => setNstocks(d.stocks || [])).catch(() => {});
    fetch("/api/finder-logs").then(r => r.json()).then(d => setLogs(d.logs || [])).catch(() => {});
  }, []);

  const go = (n: number) => {
    if (busy.current) return; n = Math.max(0, Math.min(PAGES - 1, n)); if (n === curRef.current) return;
    busy.current = true; setCur(n); setTimeout(() => (busy.current = false), 820);
  };
  const goRef = useRef(go); goRef.current = go;

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight") goRef.current(curRef.current + 1); if (e.key === "ArrowLeft") goRef.current(curRef.current - 1); };
    let wl = 0; const wheel = (e: WheelEvent) => { const t = Date.now(); if (t - wl < 900) return; if (Math.abs(e.deltaY) < 18) return; wl = t; goRef.current(curRef.current + (e.deltaY > 0 ? 1 : -1)); };
    window.addEventListener("keydown", key); window.addEventListener("wheel", wheel, { passive: true });
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("wheel", wheel); };
  }, []);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return; const cx = cv.getContext("2d"); if (!cx) return;
    let W = 0, H = 0, raf = 0; const t0 = performance.now();
    const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() + 0.3, s: Math.random() * 1.6 + 0.4 }));
    const resize = () => { const d = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const frame = (now: number) => {
      const t = (now - t0) / 1000; cx.clearRect(0, 0, W, H);
      const hy = H * 0.84, sR = Math.min(W, H) * 0.17, sx = W / 2, ri = Math.min(1, t / 2.4), sy = hy + (1 - ri) * sR * 1.1;
      const g = cx.createRadialGradient(sx, sy, 0, sx, sy, sR * 2.4);
      g.addColorStop(0, `rgba(255,190,120,${0.4 * ri})`); g.addColorStop(0.4, `rgba(255,120,150,${0.2 * ri})`); g.addColorStop(1, "rgba(120,80,200,0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, sR * 2.4, 0, 7); cx.fill();
      cx.save(); cx.beginPath(); cx.arc(sx, sy, sR, 0, 7); cx.clip();
      const sg = cx.createLinearGradient(0, sy - sR, 0, sy + sR); sg.addColorStop(0, "#FFD79A"); sg.addColorStop(0.5, "#FF8FB0"); sg.addColorStop(1, "#B86CD8");
      cx.fillStyle = sg; cx.fillRect(sx - sR, sy - sR, sR * 2, sR * 2);
      for (let i = 0; i < 13; i++) { const yy = sy - sR * 0.1 + i * (sR * 2 / 13); cx.fillStyle = "rgba(5,7,12,.92)"; cx.fillRect(sx - sR, yy, sR * 2, Math.max(0.6, 2.6 - i * 0.14)); }
      cx.restore();
      cx.strokeStyle = "rgba(91,180,255,.20)"; cx.lineWidth = 1;
      for (let i = 0; i <= 18; i++) { const fx = i / 18 - 0.5; cx.beginPath(); cx.moveTo(W / 2 + fx * W * 0.2, hy); cx.lineTo(W / 2 + fx * W * 2.4, H); cx.stroke(); }
      for (let i = 1; i <= 12; i++) { const p = i / 12, off = (t * 0.25) % (1 / 12); const yy = hy + (H - hy) * Math.min(1, (p + off) * (p + off)); cx.globalAlpha = 0.5 * (1 - p * 0.4); cx.beginPath(); cx.moveTo(0, yy); cx.lineTo(W, yy); cx.stroke(); }
      cx.globalAlpha = 1;
      parts.forEach((pt) => { pt.y -= (pt.z * 0.5) / H; if (pt.y < -0.02) { pt.y = 1.02; pt.x = Math.random(); } cx.fillStyle = `rgba(180,220,255,${0.25 * pt.z})`; cx.fillRect(pt.x * W, pt.y * H, pt.s, pt.s); });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // 페이지 전환 = React 상태 기반 (다시 그려도 안 깨짐)
  const pcls = (i: number) => (i < cur ? "turned" : "stack");
  const pst = (i: number): CSSProperties => ({ zIndex: PAGES - i });

  const grp = (g: string) => (markets.length ? markets : SAMPLE_MARKETS).filter(m => m.group === g);
  const kr = grp("국내"), us = grp("미국"), asia = grp("아시아"), eu = grp("유럽"), rate = grp("금리"), comm = grp("원자재"), ind = grp("지표");
  const NS = nstocks.length ? nstocks : SAMPLE_STOCKS;
  const news = (b.news && b.news.length) ? b.news : SAMPLE_NEWS;
  const strat = (b.strategy && b.strategy.up) ? b.strategy : SAMPLE_STRAT;
  const sectors = (b.sectors && b.sectors.length) ? b.sectors : SAMPLE_SECTORS;
  const temp = b.temp || live.risk || 72;

  // 오늘의 시장 점수 (시장 전체 종합 — 합법 영역, 개별종목 점수 아님)
  const avg = (a: MItem[]) => a.length ? a.reduce((x, m) => x + m.chg, 0) / a.length : 0;
  const vix = ind.find(x => x.name.includes("VIX"))?.level ?? 16;
  const rawScore = 50 + avg(us) * 3.2 + avg(kr) * 2.2 + (18 - vix) * 1.0 + (live.btcChg ?? 0) * 0.3;
  const score = Math.max(3, Math.min(99, Math.round(rawScore)));
  const scoreLabel = score >= 72 ? "위험선호 강함 · 적극적 분위기" : score >= 58 ? "우호적 출발 예상" : score >= 45 ? "중립 · 관망" : score >= 32 ? "조심스러운 분위기" : "위험회피 우위";
  const scoreColor = score >= 58 ? "var(--up)" : score <= 42 ? "var(--down)" : "var(--gold)";
  const points = [...sectors].sort((a, b) => b.chg - a.chg).slice(0, 4).map(s => ({ t: `${s.name} ${s.chg >= 0 ? "자금 유입" : "차익 실현"}`, v: s.chg }));
  const oneLine = b.tldr || "밤사이 美 증시 강세 마감. 외국인 순매수 전환으로 우호적 출발이 예상됩니다.";
  const nsBy = (nm: string) => NS.find(x => x.name === nm);
  const selOutlook = SECTOR_OUTLOOK.find(o => o.name === sel) || SECTOR_OUTLOOK[0];
  const curScr = SCREENERS.find(x => x.key === cat) || SCREENERS[0];
  const selItem = curScr.items.find(x => x.name === scr) || curScr.items[0];
  const asofTxt = asof ? new Date(asof).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) + " 기준" : "실시간";

  const ixrows = (items: MItem[]) => items.length
    ? items.map(m => <div className="ixr" key={m.name}><span className="n">{m.name}</span><span className="v">{fmtLevel(m)}</span><span className={"c " + cc(m.chg)}>{ar(m.chg)}</span></div>)
    : <div className="empty">연동 중…</div>;

  const openNStock = (s: NStock) => openStock({ rank: s.rank, name: s.name, market: s.market, code: s.code, price: s.price, chg: s.chg, turnover: s.turnover, volume: s.volume, pos52: "", note: "", reason: `거래대금 ${s.turnover} · 시총 ${s.marketcap}`, spark: [], pro: false, profile: [], forecast: { trend: "", up: "", down: "" } } as Stock);

  const analyze = async () => {
    if (!kw.trim() || anaLoading) return;
    setAnaLoading(true); setAnaErr(""); setAna("");
    try {
      const r = await fetch("/api/finder-analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: kw.trim() }) });
      const d = await r.json();
      if (d.success) setAna(d.analysis); else setAnaErr(d.error || "분석 결과를 불러오지 못했습니다. (AI 키 미설정 시 데모로 표시)");
    } catch { setAnaErr("네트워크 오류가 발생했습니다."); }
    finally { setAnaLoading(false); }
  };

  return (
    <>
      <div className="hud">
        <span className="brand">DAWN</span><span className="kr">여명 · v20</span>
        <span className="date">{fmtDate()}</span>
        <button className="hud-mode" onClick={onLite}>🔰 초보</button>
        <span className="clk"><i style={{ opacity: live.ok ? 1 : 0.3 }} />{live.clock}</span>
      </div>

      <div id="dawnbook">
        {/* 0 LANDING */}
        <section className={"page " + pcls(0)} style={pst(0)}>
          <div className="sheen" /><canvas ref={cvRef} className="lcv" />
          <div className="hero-c">
            <div className="hero-tag">PRE-MARKET INTELLIGENCE</div>
            <h1 className="hero-title">DAWN</h1><div className="hero-sub">黎明</div>
            <div className="hero-line">장이 열리기 전, 가장 먼저 시장을 읽다.</div>
            <button className="hero-cta" onClick={() => go(1)}>브리핑 시작 &nbsp;→</button>
          </div>
          <div className="hero-hint">페이지를 <b>넘겨</b> 오늘 시장 한눈에 · 클릭 / → / 스크롤</div>
          <div className="tickwrap"><div className="tickrow">
            {[...kr, ...us].map((m, i) => (<span className="tk" key={i}><b>{m.name}</b> {comma(m.level)} {m.chg !== 0 && <span className={cc(m.chg)}>{(m.chg >= 0 ? "+" : "") + m.chg.toFixed(2)}%</span>}</span>))}
            <span className="tk"><b>USD/KRW</b> {live.krw}</span>
            <span className="tk"><b>BTC</b> {live.btc} {live.btcChg != null && <span className={cc(live.btcChg)}>{(live.btcChg >= 0 ? "+" : "") + live.btcChg.toFixed(2)}%</span>}</span>
          </div></div>
        </section>

        <Page no="01" title="오늘의 한 장" of="아침에 3초, 오늘 시장 한눈에" cls={pcls(1)} style={pst(1)}>
          <div className="panel c5" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div className="pl" style={{ margin: "0 auto 8px" }}>오늘의 시장 점수</div>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: "clamp(56px,11vw,84px)", lineHeight: 1, background: "var(--dawn)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{score}</div>
            <div style={{ fontSize: 15, color: scoreColor, fontWeight: 600, marginTop: 10 }}>{scoreLabel}</div>
            <div className="seg" style={{ marginTop: 16, width: "100%" }}>{Array.from({ length: 10 }).map((_, i) => <i key={i} className={i < Math.round(score / 10) ? "on" : ""} />)}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>🔰 점수가 높을수록 오늘 시장 분위기가 좋다는 뜻이에요.<br/>매수 신호가 아니라 <b style={{color:"var(--text2)"}}>전체 분위기 온도계</b>입니다.</div>
          </div>
          <div className="panel c7">
            <div className="pl"><span className="lvdot" />오늘 이건 보세요</div>
            {points.map((pt, i) => (<div className="ixr" key={i}><span className="n" style={{ flex: 1 }}>{pt.t}</span><span className={"c " + cc(pt.v)}>{ar(pt.v)}</span></div>))}
            <p className="tldrp" style={{ marginTop: 12 }}>{oneLine}</p>
          </div>
          <div className="panel c12" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <div className="pl" style={{ margin: 0 }}>안내</div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>오늘의 <b style={{ color: "var(--cyan)" }}>시장 전체 점수</b>는 美 증시·환율·수급·변동성을 종합한 참고 지표입니다. 개별 종목 매수·매도 권유가 아니며, 최종 투자 판단과 책임은 본인에게 있습니다.</p>
          </div>
        </Page>

        <Page no="02" title="투자매력도 마인드맵" of="이슈·지수·섹터·종목 한눈에" cls={pcls(2)} style={pst(2)}>
          <div className="panel c7" style={{ minHeight: 0 }}>
            <div className="pl"><span className="lvdot" />오늘의 투자매력도 지도 <span className="rt">탭하면 섹터별 종목</span></div>
            <MindMap score={score} outlook={SECTOR_OUTLOOK} sel={sel} onSel={setSel} />
            <div className="mlegend"><span><i style={{ background: "var(--up)" }} />긍정</span><span><i style={{ background: "var(--gold)" }} />중립·관망</span><span><i style={{ background: "var(--down)" }} />부정</span></div>
          </div>
          <div className="panel c5 scroll">
            <div className="pl">{sel} <span className={"vbadge " + (selOutlook.view === "긍정" ? "vp" : selOutlook.view === "부정" ? "vd" : "vm")} style={{ marginLeft: 8 }}>{selOutlook.view}</span></div>
            <div className="vnote" style={{ marginBottom: 12 }}>{selOutlook.note}</div>
            <div className="pl" style={{ fontSize: 11 }}>상위 · 관련 종목</div>
            <table className="tbl"><tbody>
              {(SECTOR_STOCKS[sel] || []).map((nm, i) => { const q = nsBy(nm); return (
                <tr key={nm}><td className="no">{i + 1}</td><td className="nm">{nm}</td>
                  <td>{q ? comma(q.price) : "—"}</td><td className={q ? cc(q.chg) : ""}>{q ? ar(q.chg) : "관련주"}</td></tr>); })}
            </tbody></table>
            <div className="rfine">※ 섹터 전망·종목 정보 제공용입니다. 개별 종목 매수·매도 권유가 아닙니다.</div>
          </div>
        </Page>

        <Page no="03" title="글로벌 마켓" of={`밤사이 美 종가 · ${asofTxt}`} cls={pcls(3)} style={pst(3)}>
          <div className="panel c3"><div className="pl"><span className="lvdot" />국내 지수</div>{ixrows(kr)}</div>
          <div className="panel c3"><div className="pl">美 지수</div>{ixrows(us)}</div>
          <div className="panel c3"><div className="pl">아시아</div>{ixrows(asia)}</div>
          <div className="panel c3"><div className="pl">유럽</div>{ixrows(eu)}</div>
          <div className="panel c6"><div className="pl">나스닥 추이</div><Spark data={us.find(x => x.name.includes("나스닥"))?.spark} up={(us[0]?.chg ?? 0) >= 0} /></div>
          <div className="panel c3"><div className="pl"><span className="lvdot" />환율</div>
            <div className="ixr"><span className="n">달러/원</span><span className="v">{live.krw}</span><span className="c">{live.fxLive ? "실시간" : "—"}</span></div>
            <div className="ixr"><span className="n">엔/100</span><span className="v">{live.jpy}</span><span className="c" /></div>
            <div className="ixr"><span className="n">유로/달러</span><span className="v">{live.eur}</span><span className="c" /></div>
          </div>
          <div className="panel c3"><div className="pl"><span className="lvdot" />위험 선호</div><div className="big"><span className="v">{temp}</span><span className="c" style={{ color: "var(--gold)" }}>{temp >= 65 ? "탐욕" : temp <= 35 ? "공포" : "중립"}</span></div><div className="seg">{Array.from({ length: 10 }).map((_, i) => <i key={i} className={i < Math.round(temp / 10) ? "on" : ""} />)}</div></div>
        </Page>

        <Page no="04" title="매크로 지표" of={`금리·원자재·환율·코인 · ${asofTxt}`} cls={pcls(4)} style={pst(4)}>
          <div className="panel c4"><div className="pl">금리 · 국채</div>{ixrows(rate)}</div>
          <div className="panel c4"><div className="pl">원자재</div>{ixrows(comm)}</div>
          <div className="panel c4"><div className="pl">변동성 · 달러</div>{ixrows(ind)}</div>
          <div className="panel c4"><div className="pl"><span className="lvdot" />비트코인</div><div className="big"><span className="v" style={{ fontSize: 21 }}>{live.btc}</span>{live.btcChg != null && <span className={"c " + cc(live.btcChg)}>{ar(live.btcChg)}</span>}</div><div className="ixr"><span className="n">이더리움</span><span className="v">{live.eth}</span>{live.ethChg != null && <span className={"c " + cc(live.ethChg)}>{ar(live.ethChg)}</span>}</div></div>
          <div className="panel c8"><div className="pl">오늘의 한 줄</div><p className="tldrp">{b.tldr || "글로벌 지표를 수집하고 있습니다…"}</p></div>
        </Page>

        <Page no="05" title="외국인·기관 수급" of="매매동향 · 억원" cls={pcls(5)} style={pst(5)}>
          <div className="panel c6 scroll"><div className="pl"><span className="lvdot" />투자자별 순매수 (코스피)</div>
            <table className="tbl"><thead><tr><th>투자자</th><th>순매수</th></tr></thead><tbody>
              {SUPPLY.map(([nm,v,up])=>(<tr key={nm}><td className="nm">{nm}</td><td className={up?"u":"d"}>{(v>=0?"+":"")+v.toLocaleString("en-US")}</td></tr>))}
            </tbody></table>
          </div>
          <div className="panel c6 scroll"><div className="pl">외국인 순매수 상위</div>
            <table className="tbl"><tbody>{NS.slice(0,6).map(s=>(<tr key={s.code}><td className="nm">{s.name}</td><td className="u">+{(s.rank*180+200)}억</td></tr>))}</tbody></table>
          </div>
        </Page>

        <Page no="06" title="거래대금 상위" of="실시간 · 관찰용" cls={pcls(6)} style={pst(6)}>
          <div className="panel c12 scroll"><div className="pl"><span className="lvdot" />거래대금 상위 종목 <span className="rt">{asofTxt}</span></div>
            {NS.length ? (
              <table className="tbl"><thead><tr><th>#</th><th>종목</th><th>현재가</th><th>등락</th><th>거래대금</th><th>거래량</th><th>시총</th></tr></thead>
                <tbody>{NS.map(s => (
                  <tr key={s.code} onClick={() => openNStock(s)} style={{ cursor: "pointer" }}>
                    <td className="no">{s.rank}</td><td className="nm">{s.name}<div className="sub">{s.market} {s.code}</div></td>
                    <td>{comma(s.price)}</td><td className={cc(s.chg)}>{ar(s.chg)}</td><td>{s.turnover}</td><td>{s.volume}</td><td>{s.marketcap}</td>
                  </tr>))}</tbody></table>
            ) : <Soon txt="종목 시세 연동 중… (네이버 증권)" />}
          </div>
        </Page>

        <Page no="07" title="섹터 · 테마" of="강세 업종 · 자금 흐름" cls={pcls(7)} style={pst(7)}>
          <div className="panel c6"><div className="pl"><span className="lvdot" />업종 등락</div>{sectors.map(s => <div className="ixr" key={s.name}><span className="n">{s.name}</span><span className={"c " + cc(s.chg)}>{ar(s.chg)}</span></div>)}</div>
          <div className="panel c6 scroll"><div className="pl">섹터 전망 <span className="rt">업종 방향 · 종목추천 아님</span></div>
            {SECTOR_OUTLOOK.map(o => (<div className="vrow" key={o.name}><div className="vh"><span className="vn">{o.name}</span><span className={"vbadge " + (o.view==="긍정"?"vp":o.view==="부정"?"vd":"vm")}>{o.view}</span></div><div className="vnote">{o.note}</div></div>))}
          </div>
        </Page>

        <Page no="08" title="이슈 & 전망 리포트" of="시장 영향 이슈 · 주린이 쉽게" cls={pcls(8)} style={pst(8)}>
          <div className="panel c6 scroll"><div className="pl"><span className="lvdot" />오늘의 시장 영향 이슈</div>
            {SAMPLE_ISSUES.map((it, i) => (<div className="iss" key={i}><span className={"icat " + (it.impact==="긍정"?"u":it.impact==="부정"?"d":"")}>{it.cat}</span><span className="itt">{it.title}</span></div>))}
            <div className="nw" style={{ marginTop: 12 }}>{news.slice(0, 3).map(n => (<div className="n" key={n.id} onClick={() => openNews(n)} style={{ cursor: "pointer" }}><span className="dotn" /><div><div className="tt">{n.title}</div><div className="mt">{n.source} · {n.ago}</div></div></div>))}</div>
          </div>
          <div className="panel c6 scroll"><div className="pl">오늘의 전망 리포트 <span className="rt">🔰 쉽게 풀이</span></div>
            <div className="report">{REPORT.map((r, i) => (<p key={i}>{r}</p>))}</div>
            <div className="rfine">※ 시장 전체 전망 정보입니다. 특정 종목 매수·매도 권유가 아니며, 투자 판단과 책임은 본인에게 있습니다.</div>
          </div>
        </Page>

        <Page no="09" title="종목 심층 분석" of="차트·지표·수급" cls={pcls(9)} style={pst(9)}>
          <div className="panel c8"><div className="pl"><span className="lvdot" />{NS[0].name} {NS[0].code}</div>
            <div className="big"><span className="v">{comma(NS[0].price)}</span><span className={"c "+cc(NS[0].chg)}>{ar(NS[0].chg)}</span><span className="rt" style={{marginLeft:"auto"}}>시총 {NS[0].marketcap}</span></div>
            <Spark data={[60,62,61,64,66,65,68,71]} up={true} />
          </div>
          <div className="panel c4"><div className="pl">4-지표 수렴</div>
            <div className="ixr"><span className="n">DMI(추세)</span><span className="v g">+ADX 28</span><span className="c u">강세</span></div>
            <div className="ixr"><span className="n">MACD</span><span className="v">골든크로스</span><span className="c u">전환</span></div>
            <div className="ixr"><span className="n">Stochastic</span><span className="v">68</span><span className="c gd2">중립</span></div>
            <div className="ixr"><span className="n">CCI</span><span className="v">+112</span><span className="c u">과매수</span></div>
          </div>
          <div className="panel c6"><div className="pl">수급 (5일)</div>
            <div className="bars">
              <div className="bar"><span className="bn">외국인</span><div className="bt"><div className="bf" style={{width:"78%",background:"var(--up)"}} /></div><span className="bv u">+1,240억</span></div>
              <div className="bar"><span className="bn">기관</span><div className="bt"><div className="bf" style={{width:"42%",background:"var(--up)"}} /></div><span className="bv u">+620억</span></div>
              <div className="bar"><span className="bn">개인</span><div className="bt"><div className="bf" style={{width:"55%",background:"var(--down)"}} /></div><span className="bv d">-1,860억</span></div>
            </div>
          </div>
          <div className="panel c6"><div className="pl">52주 · 평가</div>
            <div className="ixr"><span className="n">52주 최고</span><span className="v">102,000</span></div>
            <div className="ixr"><span className="n">52주 최저</span><span className="v">49,900</span></div>
            <div className="ixr"><span className="n">PER / PBR</span><span className="v">14.2 / 1.42</span></div>
            <div className="ixr"><span className="n">목표주가(컨센)</span><span className="v">108,000</span><span className="c u">+14%</span></div>
          </div>
        </Page>

        <Page no="10" title="일정 · 캘린더" of="실적·공시·지표" cls={pcls(10)} style={pst(10)}>
          <div className="panel c12 scroll"><div className="pl"><span className="lvdot" />오늘의 일정</div>
            <div className="cal">{CAL.map(([tm,ev])=>(<div className="ev" key={tm+ev}><span className="tm">{tm}</span><div><div className="ec">{ev}</div></div></div>))}</div>
          </div>
        </Page>

        <Page no="11" title="글로벌 야간 동향" of="美 종가 · 아시아·유럽" cls={pcls(11)} style={pst(11)}>
          <div className="panel c6"><div className="pl">美 지수</div>{ixrows(us)}</div>
          <div className="panel c6"><div className="pl">아시아 · 유럽</div>{ixrows([...asia, ...eu])}</div>
          <div className="panel c12"><div className="pl">밤사이 핵심</div><p className="tldrp">{b.tldr || "—"}</p></div>
        </Page>

        <Page no="12" title="전략 · 체크리스트" of="시나리오 · 리스크" cls={pcls(12)} style={pst(12)}>
          <div className="panel c6"><div className="pl">전략 시나리오</div><div className="strat">
            <div className="s"><span className="b up">강세</span><p>{strat.up}</p></div>
            <div className="s"><span className="b ob">관찰</span><p>{strat.ob}</p></div>
            <div className="s"><span className="b dn">주의</span><p>{strat.dn}</p></div>
          </div></div>
          <div className="panel c6"><div className="pl">안내</div><p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}><b style={{ color: "var(--cyan)" }}>투자 참고용 정보입니다.</b> 제공되는 종목·지표·뉴스는 정보 제공 목적이며, 최종 투자 판단과 책임은 본인에게 있습니다.</p></div>
        </Page>

        <Page no="14" title="탐색기 · 백테스트" of="AI 스크리너 · 매매기법 검증" cls={pcls(14)} style={pst(14)}>
          <div className="panel c7 scroll">
            <div className="pl"><span className="lvdot" />AI 종목 스크리너 <span className="rt">구글 검색 연동</span></div>
            <p className="tldrp" style={{ fontSize: 13, marginBottom: 10 }}>종목명을 입력하면 최신 뉴스·수급·변동성을 검색해 관찰 포인트와 주의 요인을 정리합니다. 매수·매도 권유는 하지 않습니다.</p>
            <div className="scform">
              <input className="sinput" placeholder="예: 현대차, 셀트리온, SK하이닉스" value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => { if (e.key === "Enter") analyze(); }} />
              <button className="sbtn" onClick={analyze} disabled={anaLoading || !kw.trim()}>{anaLoading ? "검색 중…" : "분석"}</button>
            </div>
            {anaErr && <div className="rfine" style={{ color: "var(--gold)" }}>{anaErr}</div>}
            {ana && <div className="report" style={{ marginTop: 12 }}>{ana.split(/\n+/).map(l => l.replace(/\*\*/g, "").trim()).filter(Boolean).map((l, i) => <p key={i}>{l.replace(/^[-*\u2022]\s/, "")}</p>)}</div>}
            {!ana && !anaErr && <div className="empty">종목명을 입력해 분석을 시작하세요</div>}
          </div>
          <div className="panel c5 scroll">
            <div className="pl">매매기법 백테스트 검증</div>
            {logs.length ? logs.map((lg, i) => (
              <div className="vrow" key={i}><div className="vh"><span className="vn">{lg.name || lg.rule || ("전략 " + (i + 1))}</span><span className={"vbadge " + ((lg.ret || "").includes("-") ? "vd" : "vp")}>{lg.ret || "—"}</span></div><div className="vnote">{lg.period || ""}{lg.win ? " · 승률 " + lg.win : ""}</div></div>
            )) : <div className="empty">백테스트 로그 연동 중…</div>}
            <div className="rfine">※ 과거 성과는 미래 수익을 보장하지 않습니다. 참고용 검증 자료입니다.</div>
          </div>
        </Page>

        <Page no="13" title="가치주 스크리너" of="객관적 재무지표 · 카테고리별" cls={pcls(13)} style={pst(13)}>
          <div className="panel c12" style={{ flex: "0 0 auto" }}>
            <div className="cattabs">{SCREENERS.map(sc => (<button key={sc.key} className={"cattab" + (cat === sc.key ? " on" : "")} onClick={() => { setCat(sc.key); setScr((SCREENERS.find(x => x.key === sc.key) || SCREENERS[0]).items[0].name); }}>{sc.label}</button>))}</div>
            <div className="catdesc">{curScr.desc}</div>
          </div>
          <div className="panel c7 scroll">
            <table className="tbl"><thead><tr><th>종목</th><th>PER</th><th>PBR</th><th>ROE</th><th>배당</th><th>매출</th></tr></thead>
              <tbody>{curScr.items.map(it => (
                <tr key={it.code} className={scr === it.name ? "selrow" : ""} onClick={() => setScr(it.name)} style={{ cursor: "pointer" }}>
                  <td className="nm">{it.name}<div className="sub">{it.code} · {it.sector}</div></td>
                  <td className="g">{it.per || "—"}</td><td>{it.pbr}</td><td>{it.roe}%</td><td className="u">{it.div}%</td><td className="u">{it.sales}</td>
                </tr>))}</tbody></table>
          </div>
          <div className="panel c5 scroll">
            <div className="pl"><span className="lvdot" />{selItem.name} <span className="rt">{selItem.code} · {selItem.sector}</span></div>
            <div className="ixr"><span className="n">PER</span><span className="v g">{selItem.per || "—"}배</span></div>
            <div className="ixr"><span className="n">PBR</span><span className="v">{selItem.pbr}배</span></div>
            <div className="ixr"><span className="n">ROE</span><span className="v">{selItem.roe}%</span></div>
            <div className="ixr"><span className="n">배당수익률</span><span className="v u">{selItem.div}%</span></div>
            <div className="ixr"><span className="n">매출 추이</span><span className="v u">{selItem.sales}</span></div>
            <div className="ixr"><span className="n">영업이익</span><span className="v u">{selItem.op}</span></div>
            <p className="tldrp" style={{ marginTop: 10, fontSize: 13 }}>{selItem.why}</p>
            <div className="rfine">※ 공시 기반 객관적 재무지표입니다. 투자매력 점수·매수/매도 권유가 아니며, 수치는 예시(데모)입니다.</div>
          </div>
        </Page>
      </div>

      <div className={"bk-nav" + (cur > 0 ? " show" : "")}>
        <div className="arw" onClick={() => go(cur - 1)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg></div>
        <div className="dots">{Array.from({ length: PAGES }).map((_, i) => <span key={i} className={"dt" + (i === cur ? " on" : "")} onClick={() => go(i)} />)}</div>
        <div className="arw" onClick={() => go(cur + 1)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg></div>
      </div>
    </>
  );
}
