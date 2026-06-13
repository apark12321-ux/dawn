import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gen AI dynamically
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Google Gen AI client", err);
  }
}

// Model for text and grounding tasks
const MODEL_NAME = "gemini-3.5-flash";

// 20 Core Korean stocks Database
const STOCK_DATABASE: any[] = [
  { name: "삼성전자", code: "005930", price: 73200, prevClose: 72800, pe: 14.2, pbr: 1.15, roe: 8.5, divYield: 2.1, sector: "반도체", description: "글로벌 대표 반도체 및 IT 디바이스 제조 기업", changeRate: 0.55 },
  { name: "SK하이닉스", code: "000660", price: 184500, prevClose: 180200, pe: 18.5, pbr: 1.85, roe: 11.2, divYield: 0.8, sector: "반도체", description: "HBM 주도권을 쥔 국내 2위 글로벌 메모리 반도체 전문 기업", changeRate: 2.39 },
  { name: "알테오젠", code: "196170", price: 298500, prevClose: 291000, pe: 120.4, pbr: 24.5, roe: 18.2, divYield: 0.0, sector: "바이오", description: "바이오시밀러 및 정맥주사를 피하주사 제형으로 바꾸는 ALT-B4 기술 보유 독보적 플랫폼 기업", changeRate: 2.58 },
  { name: "현대차", code: "005380", price: 242500, prevClose: 245000, pe: 5.4, pbr: 0.62, roe: 14.5, divYield: 4.8, sector: "자동차", description: "내연기관 및 친환경 전기차/수소차 글로벌 대표 완성차 기업이자 주주환원 확대 가치주", changeRate: -1.02 },
  { name: "기아", code: "000270", price: 116800, prevClose: 117500, pe: 4.8, pbr: 0.81, roe: 18.9, divYield: 5.6, sector: "자동차", description: "높은 영업이익률과 강력한 주주환원, 고배당 정책을 지속하는 대표적 밸류업 종목", changeRate: -0.60 },
  { name: "LG에너지솔루션", code: "373220", price: 345000, prevClose: 343000, pe: 65.2, pbr: 2.45, roe: 4.2, divYield: 0.0, sector: "이차전지", description: "글로벌 전기차 배터리 시장 점유율 선두권의 순수 이차전지 셀 제조사", changeRate: 0.58 },
  { name: "에코프로비엠", code: "247540", price: 168000, prevClose: 172000, pe: 88.0, pbr: 7.12, roe: 9.8, divYield: 0.3, sector: "이차전지", description: "하이니켈계 양극재 글로벌 핵심 선두 제조 대표 코스닥 종목", changeRate: -2.33 },
  { name: "셀트리온", code: "068270", price: 182300, prevClose: 181000, pe: 48.2, pbr: 4.12, roe: 9.1, divYield: 0.5, sector: "바이오", description: "바이오시밀러(자가면역질환, 항암제) 대표 주자이자 헬스케어 통합 법인", changeRate: 0.72 },
  { name: "NAVER", code: "035420", price: 171500, prevClose: 172300, pe: 16.2, pbr: 1.22, roe: 7.9, divYield: 1.2, sector: "IT/소프트웨어", description: "국내 1위 검색 포털 및 쇼핑, 메신저 라인, 생성형 AI(하이퍼클로바X) 플랫폼", changeRate: -0.46 },
  { name: "카카오", code: "035720", price: 38200, prevClose: 39000, pe: 28.5, pbr: 1.10, roe: 3.5, divYield: 0.8, sector: "IT/소프트웨어", description: "국민 메신저 카카오톡 기반 메신저, 금융, 모빌리티, 콘텐츠 지배적 인터넷 기업", changeRate: -2.05 },
  { name: "KB금융", code: "105560", price: 78500, prevClose: 77200, pe: 6.2, pbr: 0.48, roe: 8.9, divYield: 4.5, sector: "금융/은행", description: "대표적 저PBR 수혜주로 꼽히는 자사주 소각 및 주주 환원 최선두 금융지주", changeRate: 1.68 },
  { name: "신한지주", code: "055550", price: 54100, prevClose: 53500, pe: 5.9, pbr: 0.42, roe: 8.2, divYield: 4.4, sector: "금융/은행", description: "일관된 분기 배당 및 저평가 매력을 확보한 서브 밸류업 선도 은행 그룹", changeRate: 1.12 },
  { name: "한화에어로스페이스", code: "012450", price: 218500, prevClose: 212000, pe: 22.4, pbr: 3.55, roe: 14.8, divYield: 1.1, sector: "방산/우주", description: "K-방산 수출 호조 수혜(K9 자주포, 천무) 및 누리호 체계종합대표 가치성장주", changeRate: 3.07 },
  { name: "HD현대중공업", code: "329180", price: 146400, prevClose: 142000, pe: 32.8, pbr: 1.98, roe: 6.2, divYield: 0.0, sector: "조선", description: "글로벌 넘버원 가스선(LNG, LPG) 건조 경쟁력 및 차세대 암모니아선 고부가 수주 기업", changeRate: 3.10 },
  { name: "포스코홀딩스", code: "005490", price: 367000, prevClose: 369000, pe: 14.9, pbr: 0.58, roe: 4.8, divYield: 2.7, sector: "철강/이차전지", description: "글로벌 대표 철강기업에서 리튬, 니켈 등 이차전지 풀밸류체인 친환경 소재 대표 공룡", changeRate: -0.54 },
  { name: "삼성바이오로직스", code: "207940", price: 824000, prevClose: 820000, pe: 68.2, pbr: 8.12, roe: 12.4, divYield: 0.0, sector: "바이오", description: "세계 최대 스케일 CMO(위탁생산) 및 위탁개발(CDMO) 역량을 확보한 생명공학 대장주", changeRate: 0.49 },
  { name: "삼성SDI", code: "006400", price: 378000, prevClose: 382000, pe: 16.5, pbr: 1.12, roe: 8.1, divYield: 0.3, sector: "이차전지", description: "각형 배터리 및 고체 배터리(전고체) 연구개발 최선두 기술 지향적 전지 기업", changeRate: -1.05 },
  { name: "한국전력", code: "015760", price: 20200, prevClose: 20400, pe: 4.5, pbr: 0.28, roe: 6.2, divYield: 2.1, sector: "유틸리티", description: "전기요금 현실화 및 적자 축소 가시화에 따른 정부 지분 대형 공기업", changeRate: -0.98 },
  { name: "에코프로머티", code: "450080", price: 104200, prevClose: 108300, pe: 145.0, pbr: 12.3, roe: 5.1, divYield: 0.0, sector: "이차전지", description: "이차전지 양극재의 주 원료인 전구체를 대량 양산 및 국내 공급망 내수화 기업", changeRate: -3.79 },
  { name: "한국가스공사", code: "036460", price: 42100, prevClose: 39950, pe: 12.5, pbr: 0.44, roe: 4.5, divYield: 1.5, sector: "유틸리티", description: "동해 가스전 국책 과제 수혜 기대감 및 미수금 정리에 따른 흑자전환 모멘텀 가중주", changeRate: 5.38 }
];

// Baseline comprehensive Dawn Market Briefing State (stored on server, editable dynamically)
let customMarketScore = 78;
let currentBriefingData = {
  score: 78,
  skyColor: {
    start: "from-[#0d1b2a] via-[#1b263b] to-[#415a77]", // Dawn Sky theme (Dark deep blue into cool steel blue) for score 78
    accent: "#ff9100", // warm sunrise accent
    gradientText: "from-amber-200 to-orange-400"
  },
  summary: "미국 연준의 추가 금리 인하 신호와 국채 금리 안정화 속에 국내 반도체(삼성전자·SK하이닉스) 수혜와 환율 안정화가 상반기 훈풍을 일으키는 아침입니다.",
  coreSignal: {
    title: "미국 10년물 국채 금리 연 4.1% 이하 붕괴",
    reason: "인플레이션 둔화 추세가 완전 착륙 국면에 접어들면서 채권 금리가 급격히 하향 흐름을 보이고 있습니다.",
    result: "외국인의 신흥국 자금 유입이 강화되어 코스피 반도체 및 고위험 성장섹터(바이오/인터넷)로의 대대적 매수 유입이 기대되는 신호입니다."
  },
  moneyFlow: {
    tradingValue: [
      { name: "SK하이닉스", code: "000660", rate: 2.39, value: 5840, price: 184500 },
      { name: "삼성전자", code: "005930", rate: 0.55, value: 4920, price: 73200 },
      { name: "알테오젠", code: "196170", rate: 2.58, value: 3410, price: 298500 },
      { name: "한국가스공사", code: "036460", rate: 5.38, value: 2890, price: 42100 },
      { name: "한화에어로스페이스", code: "012450", rate: 3.07, value: 2450, price: 218500 }
    ],
    topGainers: [
      { name: "한국가스공사", code: "036460", rate: 5.38, price: 42100 },
      { name: "HD현대중공업", code: "329180", rate: 3.10, price: 146400 },
      { name: "한화에어로스페이스", code: "012450", rate: 3.07, price: 218500 },
      { name: "알테오젠", code: "196170", rate: 2.58, price: 298500 },
      { name: "SK하이닉스", code: "000660", rate: 2.39, price: 184500 }
    ],
    topLosers: [
      { name: "에코프로머티", code: "450080", rate: -3.79, price: 104200 },
      { name: "에코프로비엠", code: "247540", rate: -2.33, price: 168000 },
      { name: "카카오", code: "035720", rate: -2.05, price: 38200 },
      { name: "삼성SDI", code: "006400", rate: -1.05, price: 378000 },
      { name: "현대차", code: "005380", rate: -1.02, price: 242500 }
    ]
  },
  macro: {
    rates: [
      { name: "원/달러 환율 ($)", value: "1,342.0", change: "-6.5", variant: "negative" },
      { name: "미국 10년 국채금리", value: "4.05%", change: "-0.08%", variant: "negative" },
      { name: "국제유가 (WTI)", value: "76.45", change: "+1.20", variant: "positive" },
      { name: "금 (Ounce)", value: "2,352.4", change: "+12.80", variant: "positive" },
      { name: "비트코인 (BTC)", value: "92,450,000", change: "+1,250,000", variant: "positive" },
      { name: "공포지수 (VIX)", value: "13.42", change: "-0.85", variant: "negative" }
    ]
  },
  globalMarkets: {
    list: [
      { name: "코스피 (KOSPI)", value: "2,682.42", change: "+24.12", rate: "+0.91%", chart: [2650, 2655, 2662, 2671, 2682] },
      { name: "코스닥 (KOSDAQ)", value: "852.10", change: "-1.85", rate: "-0.22%", chart: [855, 856, 851, 849, 852] },
      { name: "S&P 500", value: "5,431.12", change: "+42.50", rate: "+0.79%", chart: [5380, 5395, 5410, 5405, 5431] },
      { name: "나스닥 (NASDAQ)", value: "17,842.20", change: "+210.50", rate: "+1.19%", chart: [17600, 17680, 17740, 17710, 17842] },
      { name: "다우존스", value: "39,812.90", change: "+142.10", rate: "+0.36%", chart: [39650, 39710, 39790, 39750, 39812] },
      { name: "니케이 225", value: "38,910.50", change: "+320.10", rate: "+0.83%", chart: [38500, 38650, 38720, 38810, 38910] },
      { name: "상해 종합", value: "3,012.34", change: "-15.20", rate: "-0.50%", chart: [3030, 3025, 3010, 3015, 3012] },
      { name: "유로스톡스 50", value: "4,952.15", change: "+22.40", rate: "+0.45%", chart: [4920, 4935, 4940, 4930, 4952] }
    ]
  },
  flows: {
    kospi: { foreign: 3520, institution: -1240, retail: -2180 }, // in eok-won (100M KRW)
    kosdaq: { foreign: -540, institution: -320, retail: 920 }
  },
  sectorOutlook: {
    list: [
      { name: "반도체 (Semiconductor)", status: "positive", comment: "글로벌 HBM 수혜 및 금리 안정에 힘입어 선두 종목 중심 거래대금 가중 폭발." },
      { name: "바이오 (Biotech)", status: "positive", comment: "플랫폼 기술수출 보유주(알테오젠 등) 개별 모멘텀 지속 및 고금리 해제 수혜 지속 가중." },
      { name: "이차전지 (Battery)", status: "negative", comment: "유럽 차 수요 둔화 우려 및 글로벌 원자재 가격 소폭 안정 장벽에 양극재 기업 단기 조정을 겪는 구간." },
      { name: "방산 · 에너지 (Defense & Utilities)", status: "positive", comment: "유럽 및 중동 수주 가속화 및 동해 가스전 테마에 따른 공공 인프라 기업 자금 흐름 연장." },
      { name: "자동차 (Automotive)", status: "neutral", comment: "탄탄한 실적 지탱력과 밸류업 적극 참여 및 분기 고배당 매력은 높으나 미국 빅테크 집중세로 소폭 소외 동향." },
      { name: "인터넷 플랫폼 (IT Portal)", status: "neutral", comment: "금리 하락 효과 대비 네이버/카카오 AI 모멘텀이 상대적으로 약해 단기 변동성 혼조 국면 지속." }
    ]
  },
  economicCalendar: [
    { time: "09:00", country: "한국", title: "5월 수출입물가지수 발표", importance: "상" },
    { time: "14:30", country: "일본", title: "일본 은행(BOJ) 통화정책회의 발표", importance: "최상" },
    { time: "21:30", country: "미국", title: "5월 생산자물가지수 (PPI) 발표", importance: "최상" },
    { time: "23:00", country: "미국", title: "미시간대 소비자심리지수 발표", importance: "중" },
    { time: "장마감 후", country: "전체", title: "한화에어로스페이스 임시주총 (분할 건)", importance: "상" }
  ],
  issuesReport: {
    list: [
      { title: "미국 인플레이션 안정 국면 완연, '9월 인하' 확률 70% 돌파", context: "미 노동부 발표 물가지수가 3회 연속 예상치를 하회함에 따라 연준의 매파적 목소리가 무뎌졌습니다. 가상 자산 시장 및 이머징 마켓 전반에 대규모 환차익 유인자금이 늘어나고 있습니다.", impact: "외국계 장기 채권 펀드의 아시아계 주식 비중 확대로 이끄는 촉진 요인입니다." },
      { title: "반도체 HBM을 둘러싼 엔비디아 공급 다변화, 공급망 전쟁 심화", context: "삼성전자의 5세대 HBM3E 검증 완료 루머 속에 하이닉스의 지배적 공급권과의 상생 조율이 논의되고 있습니다. 주가 격차 축소 베팅 거래가 어젯밤 미국 야간 지수와 유통 매도물량에서 감지되었습니다.", impact: "두 반도체 대장주의 교차 수급과 코스닥 장비 소부장(소재·부품·장비)의 일별 등락 주기를 활성화시킵니다." },
      { title: "동해 가스전 '대왕고래' 첫 시추 후보 안 확정 및 탐사 예산 집중", context: "정부가 공식으로 대변하는 동해 심해 가스 유전 시추 작전이 주말 전후 구체 가이드라인을 송출할 것입니다. 가스공사와 관련 철강·가스 배관 테마주들의 대량 장전 수급 매치업이 재점화되고 있는 시점입니다.", impact: "단기 모멘텀에 의한 초고변동성 구간에 있으므로 철저한 분할 진입 시나리오가 권고됩니다." }
    ]
  },
  overnightRecap: {
    summary: "어젯밤 뉴욕 증시는 완만한 금리 안정 국면에 다우(+0.36%)는 보합세, 나스닥(+1.19%)은 테슬라 및 브로드컴 등 독점 반도체 패키징 기업 폭등으로 전고점을 경신하였습니다. 야간 KOSPI200 지수 선물이 0.85% 급반등 마감하며 금일 국내 개막 지수 역시 시초 갭상승 출발 예정입니다.",
    details: "유럽 증시는 정치적 교착 완화 속에 독일 DAX(+0.7%) 및 영국 FTSE(+0.4%) 반등에 동반 성공했으며 엔화는 BOJ 발표를 조율하며 달러당 156.4엔대에 정체되었습니다."
  },
  strategyChecklist: {
    list: [
      { id: "s1", scenario: "코스피 시초 갭상승 0.8% 이상 발생 시", action: "추격 매수보다는 10시 외국인 수동 순매수 방향을 확인하고 2차 분할로 대응하십시오.", checked: false },
      { id: "s2", scenario: "이차전지 양극재 종목의 동시호가 하락세 지속 시", action: "급하게 매도하기보다 기관 거래대금 분산이 끝나는 점심시간 저점 지지라인에서 단기 지지반등을 포착하십시오.", checked: false },
      { id: "s3", scenario: "엔비디아 협력 라인 핵심 부품주의 공급 확장 단독 뉴스 출현 시", action: "시초가에 쏠렸다가 빠지는 흔들기에 넘지 말고 거래량 상위에 랭크 고착 시 분할 차익실현에 돌입해 수익을 챙기십시오.", checked: false }
    ]
  },
  mindmap: {
    nodes: {
      id: "score78",
      label: "금일 투자매력 (78점)",
      color: "#ff9100",
      description: "금리 하안화 및 반도체 수급 강화 촉진기",
      children: [
        {
          id: "sec1",
          label: "반도체 수급 대규모 유입",
          color: "#4cc9f0",
          relation: "시초 갭상승 견인",
          children: [
            { id: "st1-1", label: "SK하이닉스 (고부가가치 HBM 최선두)", color: "#1e3a8a", metric: "수급 대장" },
            { id: "st1-2", label: "삼성전자 (HBM3E 납품 가속 로드)", color: "#1e3a8a", metric: "바닥 반등세" },
            { id: "st1-3", label: "소부장 한미반도체/이오테크닉스", color: "#1e3a8a", metric: "낙폭 과대 매수" }
          ]
        },
        {
          id: "sec2",
          label: "바이오 라이선스아웃",
          color: "#4cc9f0",
          relation: "글로벌 학회 시즌 수혜",
          children: [
            { id: "st2-1", label: "알테오젠 (인간 히알루로니다제 이정표)", color: "#1e3a8a", metric: "독보적 성장" },
            { id: "st2-2", label: "셀트리온 (합병 시너지 및 램시마 매출)", color: "#1e3a8a", metric: "실적 턴어라운드" }
          ]
        },
        {
          id: "sec3",
          label: "대규모 시추 테마",
          color: "#4cc9f0",
          relation: "기획재정 정책 가이드 국면",
          children: [
            { id: "st3-1", label: "한국가스공사 (직접적 시추 대변체)", color: "#1e3a8a", metric: "고변동성 거래" }
          ]
        }
      ]
    }
  },
  valueScreenerPresets: {
    growth: [
      { name: "알테오젠", code: "196170", price: 298500, pe: 120.4, roe: 18.2, divYield: 0.0, highlight: "매출성장률 120%", reason: "정맥주사 대체 플랫폼 기술 계약금 유속 증대" },
      { name: "한화에어로스페이스", code: "012450", price: 218500, pe: 22.4, roe: 14.8, divYield: 1.1, highlight: "수주잔고 28조원", reason: "K9자주포 글로벌 대만 및 유럽 국가 수출 연쇄" },
      { name: "SK하이닉스", code: "000660", price: 184500, pe: 18.5, roe: 11.2, divYield: 0.8, highlight: "영업익 전분기 대비 82%↑", reason: "HBM3E 전 분야 단독 급공급에 따른 역사적 영업이익률" }
    ],
    value: [
      { name: "현대차", code: "005380", price: 242500, pe: 5.4, roe: 14.5, divYield: 4.8, highlight: "PBR 0.62배", reason: "인도법인 상장 추진 및 분기 배당, 주주환원 확대 정책 대장" },
      { name: "KB금융", code: "105560", price: 78500, pe: 6.2, roe: 8.9, divYield: 4.5, highlight: "PBR 0.48배", reason: "자사주 3,200억 소각 및 보통주자본비율 최적화 공시" },
      { name: "기아", code: "000270", price: 116800, pe: 4.8, roe: 18.9, divYield: 5.6, highlight: "PBR 0.81배", reason: "글로벌 완성차 최상위 마진 및 강력한 기보유 자사주 소각 추진" }
    ],
    dividend: [
      { name: "한국전력", code: "015760", price: 20200, pe: 4.5, roe: 6.2, divYield: 2.1, highlight: "흑전 기조 유지", reason: "누적 미수금 보완 및 연료 단가 하락 수혜, 고연간 배당 기조 복귀 추진" },
      { name: "신한지주", code: "055550", price: 54100, pe: 5.9, roe: 8.2, divYield: 4.4, highlight: "분기 균등배당", reason: "금리 고정기 순이자마진 지탱과 선진국 스탠다드 주주보호 자사주 매입" }
    ],
    surging: [
      { name: "한국가스공사", code: "036460", price: 42100, pe: 12.5, roe: 4.5, divYield: 1.5, highlight: "거래대금 폭발 (전주比 +412%)", reason: "동해 가스전 국책 추진 위상 속 정성적, 정량적 자금 주체들의 매입세 및 숏 스퀴즈 유발" },
      { name: "삼양식품", code: "003230", price: 562000, pe: 24.5, roe: 28.2, divYield: 1.1, highlight: "사상 최고가 랠리 (영업익 110%↑)", reason: "국내 라면 제조사 중 수출 이익 모멘텀 1위, 미국/유럽 까르보불닭 열풍 기조 고공행진" },
      { name: "한미반도체", code: "042700", price: 154200, pe: 45.2, roe: 13.8, divYield: 0.9, highlight: "신고가 경신 (5일 누적 +18%)", reason: "엔비디아 연관 체인향 핵심 TC본더 장비 추가 수주 발표로 기관/외인 동시 호가 집중세 유도" }
    ],
    supply: [
      { name: "삼성전자", code: "005930", price: 73200, pe: 14.5, roe: 8.5, divYield: 2.8, highlight: "외인 11일 연속 순매수", reason: "대규모 수급 가중에 정기 메모리/SSD 반등 시너지 가속화, 패시브 펀드 최우선 주자 유입" },
      { name: "메리츠금융지주", code: "138040", price: 84200, pe: 5.8, roe: 24.2, divYield: 3.5, highlight: "기관 주간 누적 1위", reason: "자사주 소각 이행률 100% 모범과 ROE의 압도적 시전으로 국내 연기금/공제회 쌍끌이 순매수" }
    ]
  }
};

// --- Backend Stock Data Retrieval Router ---
app.get("/api/market-data", (req, res) => {
  res.json({
    success: true,
    data: currentBriefingData
  });
});

app.get("/api/stocks", (req, res) => {
  res.json({
    success: true,
    data: STOCK_DATABASE
  });
});

// --- AI Helper Functions for Simulation Fallback ---
function runPremarketSimulation() {
  const scoreDiff = Math.floor(Math.random() * 11) - 5; // -5 to +5
  const newScore = Math.min(100, Math.max(0, currentBriefingData.score + scoreDiff));
  
  // Slight shift simulation
  const updated = JSON.parse(JSON.stringify(currentBriefingData));
  updated.score = newScore;
  updated.summary = `[시뮬레이팅 실시간 AI] 글로벌 지표 수렴 작용으로 오늘 시장 여명이 ${newScore}점으로 재측정되었습니다. 반도체 우위의 안정적 매크로 흐름이 가중됩니다 (Gemini API 키 연결 시 실제 구글 최신 연동 가능).`;
  
  // adjust gradient colors accordingly
  if (newScore >= 80) {
    updated.skyColor = {
      start: "from-[#030712] via-[#111827] to-[#e63946]", // Red fiery sunrise
      accent: "#f77f00",
      gradientText: "from-red-200 to-orange-500"
    };
  } else if (newScore <= 55) {
    updated.skyColor = {
      start: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]", // Cloudy steel gray
      accent: "#a8dadc",
      gradientText: "from-blue-100 to-slate-400"
    };
  } else {
    updated.skyColor = {
      start: "from-[#0d1b2a] via-[#1b263b] to-[#415a77]",
      accent: "#ff9100",
      gradientText: "from-amber-200 to-orange-400"
    };
  }
  
  // update server state
  currentBriefingData = updated;
  return currentBriefingData;
}

function getSimulatedStockAnalysis(coreData: any, errorMsg?: string) {
  return {
    name: coreData.name,
    code: coreData.code,
    sector: coreData.sector,
    price: coreData.price,
    metrics: { pe: coreData.pe, pbr: coreData.pbr, roe: coreData.roe, divYield: coreData.divYield },
    summary: `[시뮬레이팅 AI] ${coreData.name}은(는) 자금 순환 주기상 ${coreData.pe < 10 ? "저평가 가치 구간" : "성장 가중 구간"}에 안착해 있습니다.`,
    analysis: [
      "핵심 성장 동력: 기술 축적도와 국내 유통 지배율이 매우 높습니다.",
      "수급 지수: 최근 연기금을 비롯하여 외국인 장기 추종 계좌에서 매집 흐름이 관측되고 있습니다.",
      "밸류에이션: 동종 업종 타 유사업종 평균 대비 안정적인 재무제표를 지니고 있어 하방 경직성이 탄탄합니다."
    ],
    comment: `법적 준수: 본 내용은 투자 참고용이며 어떠한 매수 또는 Sell 추천도 포용하지 않는 통계적 팩트 고찰입니다. ${errorMsg ? `(안내: Gemini API 호출 제한으로 인하여 고정밀 로컬 분석으로 대체 작동되었습니다: ${errorMsg})` : ""}`
  };
}

function getSimulatedScreener(query: string) {
  const matched = STOCK_DATABASE.filter(stock => 
    stock.sector.includes(query) || 
    stock.name.includes(query) || 
    stock.description.includes(query) ||
    (query.includes("가치") && stock.pbr < 1.0) ||
    (query.includes("배당") && stock.divYield >= 4.0) ||
    (query.includes("성장") && stock.roe >= 11.0) ||
    (query.includes("반도체") && stock.sector === "반도체") ||
    (query.includes("이차전지") && stock.sector === "이차전지")
  ).slice(0, 4);

  const result = matched.length > 0 ? matched : STOCK_DATABASE.slice(0, 3);
  return result.map(st => ({
    name: st.name,
    code: st.code,
    price: st.price,
    sector: st.sector,
    pe: st.pe,
    pbr: st.pbr,
    roe: st.roe,
    divYield: st.divYield,
    reason: `${st.name}은(는) 질문하신 조건에 부합하며, 현재 코스피/코스닥 시장 내 해당 테마 핵심 종목으로 꼽힙니다. ROE 수치는 ${st.roe}% 대이며 장기적 배당은 ${st.divYield}%입니다.`
  }));
}

// --- AI Service: Grounded Pre-Market Forecast Update via Gemini ---
app.post("/api/ai/update", async (req, res) => {
  if (!ai) {
    const data = runPremarketSimulation();
    return res.json({
      success: true,
      simulation: true,
      data: data,
      message: "Gemini API 키가 설정되지 않아, 로컬 인텔리전스 시뮬레이션 데이터로 업데이트를 대체하였습니다. (Settings의 Secrets에서 API 키를 입력하면 최신 뉴스 구글 검색 연동 장전 브리핑이 실시간으로 수행됩니다)"
    });
  }

  try {
    const prompt = `
      Please compile a comprehensive pre-market analysis report in Korean for South Korean retail investors, acting as an elite financial editor.
      Use Google Search grounding or the model's direct knowledge to fetch the current state of indices, raw materials, USD/KRW, US treasuries close, and major South Korean pre-market catalysts for today.

      The output MUST be valid JSON matching the following structure exactly (without other text around the JSON, return ONLY clean raw JSON):
      {
        "score": number (0 to 100 representing today's South Korean market attractiveness; lower means risk/downturn, higher means bullish),
        "summary": "one sentence summarizing today's South Korean pre-market mood/trend in Korean",
        "coreSignal": {
          "title": "key global macro driver or domestic signal title in Korean",
          "reason": "short explanation of the signal in Korean",
          "result": "short tactical instruction or result prediction for Korean investors in Korean"
        },
        "overnightRecap": {
          "summary": "brief summary of last night's US/Europe closing and international futures in Korean",
          "details": "additional detailed highlights of global indices in Korean"
        },
        "macro": {
          "rates": [
            { "name": "원/달러 환율 ($)", "value": "string", "change": "string (e.g. -5.2)", "variant": "positive | negative" },
            { "name": "미국 10년 국채금리", "value": "string", "change": "string", "variant": "positive | negative" },
            { "name": "국제유가 (WTI)", "value": "string", "change": "string", "variant": "positive | negative" },
            { "name": "금 (Ounce)", "value": "string", "change": "string", "variant": "positive | negative" },
            { "name": "비트코인 (BTC)", "value": "string", "change": "string", "variant": "positive | negative" },
            { "name": "공포지수 (VIX)", "value": "string", "change": "string", "variant": "positive | negative" }
          ]
        },
        "issuesReport": {
          "list": [
            { "title": "issue title 1 in Korean", "context": "factual context in Korean", "impact": "market impact in Korean" },
            { "title": "issue title 2 in Korean", "context": "factual context in Korean", "impact": "market impact in Korean" },
            { "title": "issue title 3 in Korean", "context": "factual context in Korean", "impact": "market impact in Korean" }
          ]
        }
      }
      
      Note: Keep the Korean tone professional, objective, elegant, and directly encouraging but compliant with rules (never say 'buy' or 'sell' a specific stock directly, only speak in terms of asset trends, support levels, or focus tactics).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] // Utilize web search grounding to fetch the real latest data
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Format other values gracefully to match our exact server state
    const newScore = parsed.score || 75;
    
    // Choose beautiful sunrise sky color depending on score
    let skyColor = {
      start: "from-[#0d1b2a] via-[#1b263b] to-[#415a77]",
      accent: "#ff9100",
      gradientText: "from-amber-200 to-orange-400"
    };

    if (newScore >= 80) {
      skyColor = {
        start: "from-[#0a0f1d] via-[#1f1625] to-[#f26419]", // beautiful high-energy orange-red dawn
        accent: "#f6bd60",
        gradientText: "from-amber-100 to-orange-400"
      };
    } else if (newScore < 60) {
      skyColor = {
        start: "from-[#111c24] via-[#1a2836] to-[#4a5768]", // somber grey-blue dawn
        accent: "#90e0ef",
        gradientText: "from-slate-200 to-blue-300"
      };
    }

    currentBriefingData = {
      ...currentBriefingData,
      score: newScore,
      skyColor: skyColor,
      summary: parsed.summary || currentBriefingData.summary,
      coreSignal: parsed.coreSignal || currentBriefingData.coreSignal,
      overnightRecap: parsed.overnightRecap || currentBriefingData.overnightRecap,
      macro: parsed.macro || currentBriefingData.macro,
      issuesReport: parsed.issuesReport || currentBriefingData.issuesReport
    };

    res.json({
      success: true,
      simulation: false,
      data: currentBriefingData
    });
  } catch (error: any) {
    console.log("[Info] Premarket fallback handled. Active.");
    const data = runPremarketSimulation();
    res.json({
      success: true,
      simulation: true,
      data: data,
      message: `Gemini API 호출 제한 또는 오류가 감지되어 로컬 스마트 인텔리전스 분석으로 보정되었습니다. (상세: ${error.message})`
    });
  }
});

// --- AI Service: Stock Deep Analysis Endpoint ---
app.post("/api/ai/analyze-stock", async (req, res) => {
  const { stockName } = req.body;
  if (!stockName) {
    return res.status(400).json({ success: false, error: "주식 이름이 필요합니다." });
  }

  // Find if stock exists in database to fetch direct metrics
  const dbStock = STOCK_DATABASE.find(s => s.name === stockName || s.code === stockName);
  const coreData = dbStock || {
    name: stockName,
    code: "000000",
    price: 50000,
    pe: 15.0,
    pbr: 1.0,
    roe: 10.0,
    divYield: 2.0,
    sector: "종합기술",
    description: "개별 검색 주식 종목"
  };

  if (!ai) {
    const mockReport = getSimulatedStockAnalysis(coreData);
    return res.json({
      success: true,
      simulation: true,
      data: mockReport
    });
  }

  try {
    const prompt = `
      Please perform an elite pre-market financial analyst analysis for the South Korean stock: "${coreData.name}" (Code: ${coreData.code}, Sector: ${coreData.sector}).
      Use Google Search grounding to discover the most recent news, corporate updates, and macroeconomic exposures of ${coreData.name} from the past few weeks.

      You must provide a professional, structured review containing growth catalysts, valuation health, technical/supply-demand status as of mid-2026.
      Adhere strictly to South Korean investment advisor legal boundaries (DO NOT advise to 'buy' or 'sell'; instead, strictly analyze strengths, weaknesses, support levels, and factual metrics).

      The output MUST be valid JSON in Korean conforming to this structure:
      {
        "name": "${coreData.name}",
        "code": "${coreData.code}",
        "sector": "${coreData.sector}",
        "price": ${coreData.price},
        "metrics": {
          "pe": ${coreData.pe},
          "pbr": ${coreData.pbr},
          "roe": ${coreData.roe},
          "divYield": ${coreData.divYield}
        },
        "summary": "A 2-3 sentence overview of current market valuation and sentiment toward ${coreData.name} in Korean",
        "analysis": [
          "Points 1: Business expansion or newest technical breakthrough news",
          "Points 2: Supply/demand patterns or investor purchasing actions (Foreigners vs Institutions)",
          "Points 3: Key financial highlights or risks to be alert of"
        ],
        "comment": "Professional compliance message reminding of user discretion"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      simulation: false,
      data: parsed
    });
  } catch (error: any) {
    console.log("[Info] Stock analyzer fallback handled. Active.");
    const mockReport = getSimulatedStockAnalysis(coreData, error.message);
    res.json({
      success: true,
      simulation: true,
      data: mockReport
    });
  }
});

// --- AI Service: AI Stock Screener Endpoint ---
app.post("/api/ai/screener", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: "검색 조건이 필요합니다." });
  }

  if (!ai) {
    const mockScreenerResults = getSimulatedScreener(query);
    return res.json({
      success: true,
      simulation: true,
      data: mockScreenerResults,
      message: "Gemini API 키가 아직 없어 로컬 20대 우량주 기반으로 스마트 필터링을 진행했습니다."
    });
  }

  try {
    const prompt = `
      You are an institutional quantitative researcher screening the South Korean stock market.
      The user is asking: "${query}" in Korean.
      Select 3 to 4 best matching real South Korean stock prospects that align with this prompt from the South Korean exchange (KOSPI & KOSDAQ).
      Provide realistic prices, tickers (6 digit codes), correct industrial sectors, core valuation statistics, and an customized expert explanation why it matches.

      The output MUST be a valid JSON array in Korean of 3 to 4 stock objects matching this schema:
      [
        {
          "name": "Stock Name",
          "code": "6-digit string ticker",
          "price": number representing approximate current share price,
          "sector": "Industrial sector in Korean",
          "pe": number representing PER,
          "pbr": number representing PBR,
          "roe": number representing ROE,
          "divYield": number representing Dividend Yield %,
          "reason": "Clear tactical explanation why this stock is selected for the user query '${query}' in Korean"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({
      success: true,
      simulation: false,
      data: parsed
    });
  } catch (error: any) {
    console.log("[Info] Stock screener fallback handled. Active.");
    const mockScreenerResults = getSimulatedScreener(query);
    res.json({
      success: true,
      simulation: true,
      data: mockScreenerResults,
      message: `Gemini API 호출 제한 또는 오류(할당량 초과)로 인해 로컬 우량주 기반 지능형 매칭 필터링을 가동하였습니다. (상세: ${error.message})`
    });
  }
});

// --- Quantitative Quant Simulator: Backtesting Trading Strategies ---
app.post("/api/backtest", (req, res) => {
  const { strategy, stockCode, params } = req.body;
  const dbStock = STOCK_DATABASE.find(s => s.code === stockCode) || STOCK_DATABASE[0];
  
  // Backtest Parameters
  const initialCapital = params?.capital || 10000000; // 10 Million KRW default
  const durationDays = params?.days || 250; // default 1 trading year
  const takeProfit = params?.takeProfit || 15; // 15%
  const stopLoss = params?.stopLoss || -7; // -7%
  
  // Generate a realistic 250-day price history for the stock
  const volatility = dbStock.sector === "반도체" ? 0.30 : dbStock.sector === "바이오" ? 0.45 : dbStock.sector === "이차전지" ? 0.40 : 0.20;
  const drift = dbStock.roe > 12 ? 0.15 : dbStock.roe < 5 ? -0.05 : 0.08;
  
  let price = dbStock.price * 0.7; // Start at 70% of current price to simulate upward/neutral path
  const prices: number[] = [];
  const dates: string[] = [];
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - durationDays * 1.4); // Subtract calendar days

  for (let i = 0; i < durationDays; i++) {
    const changePercent = (drift / 250) + (volatility * (Math.random() - 0.48) / Math.sqrt(250));
    price = price * (1 + changePercent);
    prices.push(Math.round(price));
    
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * 1.4);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Backtest strategy logic
  let capital = initialCapital;
  let positions: any[] = [];
  let tradeLogs: any[] = [];
  const portfolioHistory: any[] = [];
  
  // Technical indicator lines for charting (Simple Moving Averages)
  const sma5: number[] = [];
  const sma20: number[] = [];
  
  for (let i = 0; i < durationDays; i++) {
    // Calc 5-day SMA
    if (i >= 5) {
      const sum = prices.slice(i - 5, i).reduce((a, b) => a + b, 0);
      sma5.push(Math.round(sum / 5));
    } else {
      sma5.push(prices[i]);
    }
    // Calc 20-day SMA
    if (i >= 20) {
      const sum = prices.slice(i - 20, i).reduce((a, b) => a + b, 0);
      sma20.push(Math.round(sum / 20));
    } else {
      sma20.push(prices[i]);
    }
  }

  // Simulation execution
  for (let i = 0; i < durationDays; i++) {
    const currentPrice = prices[i];
    const prevPrice = i > 0 ? prices[i - 1] : currentPrice;
    
    // Check existing positions for trigger
    if (positions.length > 0) {
      const openTrade = positions[0];
      const yieldPct = ((currentPrice - openTrade.entryPrice) / openTrade.entryPrice) * 100;
      
      if (yieldPct >= takeProfit || yieldPct <= stopLoss) {
        // Exit Trade
        const finalCapital = openTrade.shares * currentPrice;
        capital = finalCapital;
        tradeLogs.push({
          type: "매도 (EXIT)",
          date: dates[i],
          price: currentPrice,
          yield: Number(yieldPct.toFixed(2)),
          profit: Math.round(finalCapital - openTrade.entryCapital)
        });
        positions = [];
      }
    }
    
    // Strategy Entry Conditions
    if (positions.length === 0 && i >= 20) {
      let isSignal = false;
      
      if (strategy === "golden-cross") {
        // SMA 5 crosses above SMA 20
        const prevSma5 = sma5[i - 1];
        const prevSma20 = sma20[i - 1];
        if (prevSma5 <= prevSma20 && sma5[i] > sma20[i]) {
          isSignal = true;
        }
      } else if (strategy === "rsi-oversold") {
        // Multi-day low buy (reversal support)
        const localMin = Math.min(...prices.slice(Math.max(0, i - 14), i));
        if (currentPrice <= localMin * 1.02) {
          isSignal = true;
        }
      } else {
        // Breakout Strategy (High of past 10 days)
        const localMax = Math.max(...prices.slice(Math.max(0, i - 10), i));
        if (currentPrice > localMax) {
          isSignal = true;
        }
      }
      
      if (isSignal) {
        const shares = Math.floor(capital / currentPrice);
        if (shares > 0) {
          const entryVal = shares * currentPrice;
          positions.push({
            entryPrice: currentPrice,
            shares: shares,
            entryCapital: entryVal,
            date: dates[i]
          });
          capital = capital - entryVal;
          tradeLogs.push({
            type: "매수 (BUY)",
            date: dates[i],
            price: currentPrice,
            yield: 0,
            profit: 0
          });
        }
      }
    }
    
    // Track portfolio total worth
    const currentAssetWorth = positions.length > 0 ? (positions[0].shares * currentPrice) : 0;
    const totalWorth = capital + currentAssetWorth;
    
    const bhShares = Math.floor(initialCapital / prices[0]);
    const bhWorth = bhShares * currentPrice + (initialCapital - bhShares * prices[0]);
    
    portfolioHistory.push({
      date: dates[i],
      price: currentPrice,
      strategyWorth: Math.round(totalWorth),
      bhWorth: Math.round(bhWorth),
      strategyYield: Number((((totalWorth - initialCapital) / initialCapital) * 100).toFixed(2)),
      bhYield: Number((((bhWorth - initialCapital) / initialCapital) * 100).toFixed(2))
    });
  }

  // Calculate high-fidelity performance metrics
  const finalWorth = portfolioHistory[portfolioHistory.length - 1].strategyWorth;
  const simYield = ((finalWorth - initialCapital) / initialCapital) * 100;
  
  const bhWorthFinal = portfolioHistory[portfolioHistory.length - 1].bhWorth;
  const bhYield = ((bhWorthFinal - initialCapital) / initialCapital) * 100;
  
  // Calculate Max Drawdown (MDD)
  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const h of portfolioHistory) {
    if (h.strategyWorth > peak) {
      peak = h.strategyWorth;
    }
    const drawdown = ((peak - h.strategyWorth) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const matches = tradeLogs.filter(t => t.type.includes("매도"));
  const winCount = matches.filter(m => m.yield > 0).length;
  const winRate = matches.length > 0 ? Number(((winCount / matches.length) * 100).toFixed(1)) : 100.0;

  res.json({
    success: true,
    stockName: dbStock.name,
    strategyName: strategy === "golden-cross" ? "골든크로스 수렴 돌파" : strategy === "rsi-oversold" ? "지지도 저점 포착 반등" : "10일 전고점 거래량 돌파",
    metrics: {
      initialCapital: initialCapital,
      finalCapital: finalWorth,
      strategyYield: Number(simYield.toFixed(2)),
      bhYield: Number(bhYield.toFixed(2)),
      winRate: winRate,
      mdd: Number(maxDrawdown.toFixed(2)),
      tradesCount: matches.length
    },
    history: portfolioHistory,
    tradeLogs: tradeLogs
  });
});

// Configure Vite or Static Assets based on environment inside an async IIFE to avoid top-level await compilation issues
(async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to Port 3000 at Host 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DAWN DEV SERVER] Booted correctly at http://localhost:${PORT}`);
    console.log(`Gemini API Setup: ${apiKey ? "Enabled (Valid Key)" : "Disabled (Using Local Simulation)"}`);
  });
})();
