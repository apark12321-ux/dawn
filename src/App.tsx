import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  Compass,
  Search,
  HelpCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Map,
  Globe,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  Activity,
  CheckSquare,
  Shield,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  Sliders,
  Play,
  Calculator,
  Award,
  Star,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";

// TypeScript Interfaces for DAWN App State
interface CommonStock {
  name: string;
  code: string;
  price: number;
  prevClose: number;
  pe: number;
  pbr: number;
  roe: number;
  divYield: number;
  sector: string;
  description: string;
  changeRate: number;
}

interface MacroIndicator {
  name: string;
  value: string;
  change: string;
  variant: string;
}

interface MarketIndex {
  name: string;
  value: string;
  change: string;
  rate: string;
  chart: number[];
}

interface SectorOutlook {
  name: string;
  status: string;
  comment: string;
}

interface EconomicEvent {
  time: string;
  country: string;
  title: string;
  importance: string;
}

interface IssueItem {
  title: string;
  context: string;
  impact: string;
}

interface BriefingData {
  score: number;
  skyColor: {
    start: string;
    accent: string;
    gradientText: string;
  };
  summary: string;
  coreSignal: {
    title: string;
    reason: string;
    result: string;
  };
  moneyFlow: {
    tradingValue: any[];
    topGainers: any[];
    topLosers: any[];
  };
  macro: {
    rates: MacroIndicator[];
  };
  globalMarkets: {
    list: MarketIndex[];
  };
  flows: {
    kospi: { foreign: number; institution: number; retail: number };
    kosdaq: { foreign: number; institution: number; retail: number };
  };
  sectorOutlook: {
    list: SectorOutlook[];
  };
  economicCalendar: EconomicEvent[];
  issuesReport: {
    list: IssueItem[];
  };
  overnightRecap: {
    summary: string;
    details: string;
  };
  strategyChecklist: {
    list: { id: string; scenario: string; action: string; checked: boolean }[];
  };
  mindmap: {
    nodes: any;
  };
  valueScreenerPresets: {
    growth: any[];
    value: any[];
    dividend: any[];
  };
}

export default function App() {
  // Mode selection: null = Welcome Screen, "beginner" = Beginner Mode, "expert" = Expert Mode
  const [mode, setMode] = useState<"beginner" | "expert" | null>(null);
  
  // App Core States
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [stocksList, setStocksList] = useState<CommonStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Real-time KST Clock Simulation states & toggles
  const [kstTime, setKstTime] = useState<string>("");
  const [marketStatusText, setMarketStatusText] = useState<string>("");

  // Expert Mode Page Indexing (0 ~ 13)
  const [expertPage, setExpertPage] = useState<number>(0);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState<boolean>(false);
  
  // Interactive Checklist State
  const [checklist, setChecklist] = useState<Array<{ id: string; scenario: string; action: string; checked: boolean }>>([]);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);
  
  // Stock Lab Module State
  const [selectedStockCode, setSelectedStockCode] = useState<string>("005930");
  const [stockSearchTerm, setStockSearchTerm] = useState<string>("");
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Screener State
  const [screenerQuery, setScreenerQuery] = useState<string>("미국 금리인하 수혜 밸류업 금융주");
  const [screenerLoading, setScreenerLoading] = useState<boolean>(false);
  const [screenerResults, setScreenerResults] = useState<any[]>([]);
  const [screenerMessage, setScreenerMessage] = useState<string>("");

  // Value Screener Selection
  const [activeValuePreset, setActiveValuePreset] = useState<"growth" | "value" | "dividend" | "surging" | "supply">("growth");

  // Quant Backtester State
  const [backtestStrategy, setBacktestStrategy] = useState<string>("golden-cross");
  const [backtestStockCode, setBacktestStockCode] = useState<string>("005930");
  const [backtestCapital, setBacktestCapital] = useState<number>(10000000);
  const [backtestDays, setBacktestDays] = useState<number>(250);
  const [btTakeProfit, setBtTakeProfit] = useState<number>(15);
  const [btStopLoss, setBtStopLoss] = useState<number>(-7);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [backtestLoading, setBacktestLoading] = useState<boolean>(false);

  // 14 expert chapters configuration for quick jump or rendering
  const chapters = [
    { title: "오늘의 한 장", desc: "금일 장전 핵심 마켓 체크 포인트", icon: BookOpen },
    { title: "투자매력 마인드맵", desc: "지표 수렴도에 입각한 주도섹터 연결망", icon: Map },
    { title: "글로벌 마켓", desc: "뉴욕·유럽·아시아 역외 주요 등락 지수", icon: Globe },
    { title: "매크로 주요 지표", desc: "금리·원자재·환율·코인 동향", icon: DollarSign },
    { title: "외국인·기관 수급", desc: "코스피·코스닥 정량적 순매수 패턴", icon: Users },
    { title: "실시간 거래대금 상위", desc: "거래량 집중 최고 자금 순환대 수집", icon: Activity },
    { title: "섹터·테마 전망", desc: "업종별 촉진/장벽 한눈에 요약", icon: Briefcase },
    { title: "이슈 & 전망 리포트", desc: "오늘 아침 경제/사회 주동 이슈 브리핑", icon: Info },
    { title: "종목 심층 분석", desc: "개별주 재무 분석 및 AI 시나리오 진단", icon: Search },
    { title: "증시 핵심 일정", desc: "국제 매크로 지표 공시시간 및 어닝 어젠다", icon: Calendar },
    { title: "글로벌 야간 브리핑", desc: "미국 장가 실황 및 해외 외교 긴장 요인", icon: HelpCircle },
    { title: "위험 대응 시나리오", desc: "투자 대응 체크리스트 및 흔들기 제어", icon: Shield },
    { title: "마켓 멀티 스크리너", desc: "성장·가치·배당·급등·수급 전천후 5대 필터링", icon: Award },
    { title: "탐색기 & 백테스터", desc: "AI 장전 서치 및 퀀트 전략 백테스트 기기", icon: Sliders }
  ];

  // Show customized toast messages
  const showToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch baseline market briefing + stocks from Node Backend on startup
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [briefRes, stocksRes] = await Promise.all([
          fetch("/api/market-data"),
          fetch("/api/stocks")
        ]);
        
        const briefData = await briefRes.json();
        const stocksData = await stocksRes.json();
        
        if (briefData.success && briefData.data) {
          setBriefing(briefData.data);
          setChecklist(briefData.data.strategyChecklist?.list || []);
        }
        if (stocksData.success && stocksData.data) {
          setStocksList(stocksData.data);
        }
      } catch (err) {
        console.error("데이터 초기화 도중 오류가 발생했습니다:", err);
        showToast("데이터 초기화과정에서 통신 장애가 발생했습니다.", "warning");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update Dynamic Korea Standard Time Clock & Countdown Indicators
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Calculate current date in KST (UTC+9)
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstTimeObj = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + kstOffset);
      
      const hour = kstTimeObj.getHours();
      const min = kstTimeObj.getMinutes();
      const sec = kstTimeObj.getSeconds();
      const pad = (n: number) => n.toString().padStart(2, "0");
      
      const formatted = `${pad(hour)}:${pad(min)}:${pad(sec)}`;
      setKstTime(formatted);

      // Determine South Korean Market Segment Text
      if (hour < 8) {
        setMarketStatusText(`해외 증시 종가 확인 및 여명 분석 구간`);
      } else if (hour === 8 && min < 30) {
        setMarketStatusText(`장전 대기 구간 (오전 8시 30분 동시호가 시작)`);
      } else if (hour === 8 && min >= 30) {
        const remainingMin = 30 - min;
        setMarketStatusText(`장전 예상 호가 접수 중 — 정규장 시작 ${remainingMin}분 전 ⏱️`);
      } else if (hour === 9 && min === 0 && sec < 30) {
        setMarketStatusText(`💥 장 개막! 한국 정규장 전격 시작 💥`);
      } else if (hour >= 9 && hour < 15) {
        setMarketStatusText(`정규 주식 거래 시장 실시간 체결 단계`);
      } else if (hour === 15 && min < 30) {
        setMarketStatusText(`정규 주식 거래 시장 마감 거래 단계`);
      } else if (hour === 15 && min >= 30 && min <= 40) {
        setMarketStatusText(`종가 동시호가 체결 및 정규 시장 폐막 처리`);
      } else {
        setMarketStatusText(`당일 거래 장 종료 및 시간외 단일가 등락 집계 구간`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger Individual Stock Deep Analysis in Stock Lab
  const runStockAnalysis = async (code: string) => {
    try {
      setAnalysisLoading(true);
      const stock = stocksList.find(s => s.code === code) || { name: code };
      const response = await fetch("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockName: stock.name })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult(resData.data);
        if (resData.simulation) {
          showToast(`오프라인 대체 정보: [${stock.name}] 로컬 정적 데이터 정밀 분석을 완료했습니다.`, "info");
        } else {
          showToast(`Gemini 연동 성공: [${stock.name}] 심층 뉴스 기반 장전 종합 전망 보고서를 완성했습니다.`, "success");
        }
      }
    } catch (e: any) {
      showToast("종목 분석 요청을 보내지 못했습니다.", "warning");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Trigger automatic analysis when selected Stock changes
  useEffect(() => {
    if (stocksList.length > 0 && selectedStockCode) {
      runStockAnalysis(selectedStockCode);
    }
  }, [selectedStockCode, stocksList]);

  // Execute AI Stock Screener
  const handleRunScreener = async () => {
    if (!screenerQuery.trim()) return;
    try {
      setScreenerLoading(true);
      const response = await fetch("/api/ai/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: screenerQuery })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setScreenerResults(resData.data);
        if (resData.message) {
          setScreenerMessage(resData.message);
          showToast("로컬 우량주 연동 스마트 필터링이 가동되었습니다.", "info");
        } else {
          setScreenerMessage("");
          showToast("Gemini 3.5 검색 연동 스크리닝이 완료되었습니다.", "success");
        }
      }
    } catch (err) {
      showToast("스크리너 실행 장애가 발생했습니다.", "warning");
    } finally {
      setScreenerLoading(false);
    }
  };

  // Trigger default screener once
  useEffect(() => {
    if (stocksList.length > 0) {
      handleRunScreener();
    }
  }, [stocksList]);

  // Execute Backtest Strategy
  const handleRunBacktest = async () => {
    try {
      setBacktestLoading(true);
      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: backtestStrategy,
          stockCode: backtestStockCode,
          params: {
            capital: backtestCapital,
            days: backtestDays,
            takeProfit: btTakeProfit,
            stopLoss: btStopLoss
          }
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setBacktestResult(resData);
        showToast(`${resData.stockName} 대상, ${resData.strategyName} 시뮬레이션 성공!`, "success");
      }
    } catch (err) {
      showToast("백테스터 분석 도중 정규 피드가 발생했습니다.", "warning");
    } finally {
      setBacktestLoading(false);
    }
  };

  // Run initial default backtest
  useEffect(() => {
    if (stocksList.length > 0) {
      handleRunBacktest();
    }
  }, [stocksList, backtestStrategy, backtestStockCode]);

  // Trigger Gemini-Grounded Real-time Pre-market Briefing Refresh (Dynamic Solar update)
  const handleFullAIBriefingRefresh = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch("/api/ai/update", {
        method: "POST"
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setBriefing(resData.data);
        if (resData.strategyChecklist?.list) {
          setChecklist(resData.strategyChecklist.list);
        }
        if (resData.simulation) {
          showToast("로컬 실시간 시장 수렴 계산식을 통하여 아침 브리핑 점수를 재측정했습니다.", "info");
        } else {
          showToast("구글 실시간 뉴스 검색 연동 전격 탑재! 오늘 시장 여명이 전면 갱신되었습니다.", "success");
        }
      }
    } catch (e) {
      showToast("Gemini 갱신 도중 통신 중단이 감지되었습니다.", "warning");
    } finally {
      setIsUpdating(false);
    }
  };

  // Find filtered stock records
  const filteredStocks = stocksList.filter(s => {
    if (!stockSearchTerm.trim()) return true;
    return s.name.includes(stockSearchTerm) || s.code.includes(stockSearchTerm) || s.sector.includes(stockSearchTerm);
  });

  if (loading || !briefing) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-200 to-sky-500 animate-pulse"></div>
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-500 rounded-full blur-md opacity-30 animate-pulse"></div>
              <div className="w-20 h-20 bg-slate-900/90 rounded-full border border-amber-500/20 flex items-center justify-center">
                <Sun className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-light tracking-widest text-slate-100 uppercase">DAWN <span className="text-amber-500">·</span> 여명</h1>
            <p className="text-xs text-slate-400 tracking-wider">가장 먼저, 오늘의 주식 시장 기상을 열다</p>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-left">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">장전 프리마켓 데이터 산출 기약 중</p>
                <p className="text-xs text-slate-500">야후 파이낸스 및 네이버 실데이터 연동 패치 수렴 중입니다.</p>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-2/3 animate-pulse rounded-full"></div>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-600">투자 참고용 정보입니다. 최종 투자 판단과 책임은 본인에게 있습니다.</p>
        </div>
      </div>
    );
  }

  // Render startup mode selecting welcome window
  if (mode === null) {
    return (
      <div className="min-h-screen bg-[#030712] relative overflow-hidden flex flex-col justify-between">
        {/* Sky Background Ambiance depending on market score */}
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent blur-3xl pointer-events-none"></div>
        <div className="absolute -top-[20%] left-[20%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header of Welcome Page */}
        <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Sun className="w-5 h-5 text-gray-950 font-bold" />
            </div>
            <span className="text-xl font-bold tracking-widest text-slate-100">DAWN <span className="text-amber-400">·</span> 여명</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-mono">SEOUL PRE-MARKET TERMINAL</p>
            <p className="text-[11px] text-amber-500/80 font-mono">KST {kstTime} · {marketStatusText ? marketStatusText.slice(0, 15) + "..." : ""}</p>
          </div>
        </header>

        {/* Welcome Pitch & Mode Picker */}
        <main className="max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center space-y-12 z-10 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>대한민국 개인투자자를 위한 아침 장전 필수 정밀 브리핑</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              장이 열리기 전,<br className="md:hidden" /> 가장 먼저 시장을 읽다.
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed font-light">
              복잡한 뉴스와 해외 거시 지표, 미국 야간 선물 등락을 요약하여 오늘 코스피/코스닥 전술 각도를 파악합니다. 본인 취향에 맞춰 시그널 밀도를 선택해 진입하십시오.
            </p>
          </div>

          {/* Selector Grid */}
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl pt-4">
            {/* Beginner Card */}
            <button
              onClick={() => {
                setMode("beginner");
                showToast("초보 모드로 진입했습니다. 세로로 부담 없이 아침 브리핑을 읽어보세요.", "success");
              }}
              className="text-left bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-900/100 hover:to-slate-950/100 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all duration-300 group shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
              id="btn-mode-beginner"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-6 shadow-inner border border-amber-500/20 group-hover:scale-110 transition-transform">
                🔰
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center justify-between">
                <span>초보 모드</span>
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">쉬운 읽기</span>
              </h2>
              <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
                하늘(일출) 색깔로 직관적으로 체감하는 오늘 시장 분위기. 세로로 쭉 내리며 큰 글씨로 핵심 요약과 일정, 거래급상승 종목을 쉽게 관람합니다.
              </p>
              <div className="flex items-center text-sm font-semibold text-amber-400 group-hover:translate-x-2 transition-transform">
                <span>브리핑 책장 펼치기</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </button>

            {/* Expert Card */}
            <button
              onClick={() => {
                setMode("expert");
                showToast("고수 모드 트레이딩 터미널을 로드했습니다. 책장을 눌러 장전 정보를 분석해보세요.", "success");
              }}
              className="text-left bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-900/100 hover:to-slate-950/100 p-8 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all duration-300 group shadow-xl hover:shadow-sky-500/5 relative overflow-hidden"
              id="btn-mode-expert"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-colors"></div>
              <div className="w-14 h-14 rounded-xl bg-sky-500/10 flex items-center justify-center text-2xl mb-6 shadow-inner border border-sky-500/20 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center justify-between">
                <span>고수 모드</span>
                <span className="text-xs font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">풀데이터 터미널</span>
              </h2>
              <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
                정보 밀도 극대화된 디지털 트레이딩 인터페이스. 투자매력 마인드맵, 매크로 등락 지표 국면 체크, 종목 분석, AI 필터링 및 퀀트 백테스터까지 총망라.
              </p>
              <div className="flex items-center text-sm font-semibold text-sky-400 group-hover:translate-x-2 transition-transform">
                <span>프로 터미널 시동</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </button>
          </div>
        </main>

        {/* Footer legal note */}
        <footer className="w-full text-center py-8 border-t border-slate-900 z-10 px-6">
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            ⚠️ 투자 참고용 정보입니다. 모든 투자 판단의 최종 주체 및 결과 귀속은 거래를 집행하시는 본인에게 있으며, DAWN 서비스는 단순한 정보 집약 및 분석 백테스트 기술을 지원합니다.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 relative">
      {/* Absolute Glow Background depending on score */}
      <div className={`absolute top-0 left-0 right-0 h-[480px] bg-gradient-to-b ${briefing.skyColor?.start || 'from-indigo-950/20'} to-transparent transition-all duration-1000 -z-10`} />

      {/* Global App Toast notifications */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce max-w-md">
          <div className={`rounded-xl px-5 py-4 shadow-2xl border flex items-start space-x-3 backdrop-blur-xl ${
            toast.type === "success" 
              ? "bg-slate-900/90 border-emerald-500/30 text-slate-200"
              : toast.type === "warning"
                ? "bg-slate-900/90 border-red-500/30 text-slate-200"
                : "bg-slate-900/90 border-amber-500/30 text-slate-200"
          }`}>
            {toast.type === "success" && <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</div>}
            {toast.type === "warning" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {toast.type === "info" && <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />}
            <div>
              <p className="text-xs text-slate-400 font-mono mb-1">여명 시스템 알림 • {kstTime}</p>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Global Header */}
      <header className="border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-45 bg-[#02050e]/85 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMode(null)} 
              className="flex items-center space-x-2 group focus:outline-none"
              title="웰컴 게이트로 돌아가기"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold group-hover:rotate-12 transition-transform">
                <Sun className="w-4 h-4 font-black" />
              </div>
              <div className="text-left">
                <span className="text-lg font-black tracking-widest text-slate-100 group-hover:text-amber-400 transition-colors">DAWN <span className="text-xs text-amber-500 font-normal">여명</span></span>
                <p className="text-[9px] text-slate-500 tracking-wider">PRE-MARKET BRIEFING</p>
              </div>
            </button>

            {/* Compact Current Mode Badge */}
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex items-center space-x-1.5 bg-slate-900/90 py-1 px-2.5 rounded-full border border-slate-800/80">
              <span className="text-xs">{mode === "beginner" ? "🔰 초보 모드" : "📊 고수 모드"}</span>
            </div>
          </div>

          {/* Clock & Real-time Info widget */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            
            {/* Live KST Clock with visual status */}
            <div className="bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2.5 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="font-mono font-semibold tracking-wider text-amber-400">KST {kstTime}</span>
              <span className="hidden sm:inline text-slate-400 font-light">|  {marketStatusText}</span>
            </div>

            {/* AI Update Action Trigger */}
            <button
              onClick={handleFullAIBriefingRefresh}
              disabled={isUpdating}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-md shadow-amber-500/10 cursor-pointer disabled:cursor-not-allowed transition-all"
              id="btn-re-evaluate"
              title="Gemini 3.5 구글 실시간 검색 연동하여 아침 시장 기상도를 긴급 분석 및 갱신합니다."
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>여명 산출 중...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>AI 장전 수렴분석</span>
                </>
              )}
            </button>

            {/* Quick Switch Switcher */}
            <button
              onClick={() => {
                const target = mode === "beginner" ? "expert" : "beginner";
                setMode(target);
                showToast(`${target === "beginner" ? "초보 요약" : "고수 터미널"} 모드로 전환했습니다.`, "info");
              }}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              id="btn-toggle-mode"
            >
              {mode === "beginner" ? "📊 고수 전격전환" : "🔰 초보 간편전환"}
            </button>
          </div>

        </div>
      </header>

      {/* --- RENDER 1: BEGINNER MODE --- */}
      {mode === "beginner" && (
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-12">
          
          {/* SEC 1: 오늘의 여명 (Today's Sun Gradient Atmosphere Header) */}
          <section className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl" id="beginner-today-dawn">
            {/* Sunrise Dynamic Canvas Gradient Display */}
            <div className="p-8 pb-6 relative text-center border-b border-slate-800/60">
              <div className="absolute top-4 left-4 bg-slate-950/80 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest text-slate-400 border border-slate-800">
                ATMOSPHERE SCORE
              </div>
              
              {/* Semi circle sun meter */}
              <div className="w-48 h-24 mx-auto relative overflow-hidden mt-2">
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-slate-800 flex items-center justify-center">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 opacity-20 filter blur-sm`} />
                </div>
                {/* Score Needle indicator */}
                <div 
                  className="absolute bottom-0 left-1/2 w-1.5 h-20 bg-gradient-to-t from-orange-600 to-amber-300 origin-bottom transform transition-transform duration-1000"
                  style={{ transform: `translateX(-50%) rotate(${(briefing.score / 100) * 180 - 90}deg)` }}
                />
                <div className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full bg-amber-400 -ml-2 -mb-2 border-2 border-slate-900"></div>
              </div>

              {/* Huge score text */}
              <div className="mt-4 space-y-1">
                <span className="text-xs text-slate-400 tracking-widest font-mono">신뢰도 가중 여명 분위기</span>
                <h2 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200 bg-clip-text text-transparent">
                  {briefing.score}
                  <span className="text-sm font-normal text-slate-400 ml-1">/100 점</span>
                </h2>
                <div className="inline-flex items-center space-x-1.5 bg-amber-400/10 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-400/20 font-medium">
                  <span>금일 아침 기상 상태 :</span>
                  <span className="font-bold">
                    {briefing.score >= 80 ? "☀️ 맑음, 강한 활력 예상" : briefing.score >= 60 ? "⛅ 구름 구멍 사이 햇살" : "🌫️ 짙은 안개, 분할 진입"}
                  </span>
                </div>
              </div>
            </div>

            {/* Descriptive Korean summary text */}
            <div className="p-8 bg-slate-950/60 space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
                <span>오늘의 한 줄 핵심 기상도</span>
              </h3>
              <p className="text-lg text-slate-100 leading-relaxed font-light font-sans">
                &ldquo;{briefing.summary}&rdquo;
              </p>
              <div className="text-xs text-slate-500 border-l-2 border-amber-500/40 pl-3">
                * 미국 장마감 수렴 모델과 한국 야간 KOSPI 지수 선물의 최종 합성 가중치로 도출된 점수입니다.
              </div>
            </div>
          </section>

          {/* SEC 2: 먼저 볼 것 (AI Core Signal) */}
          <section className="space-y-4" id="beginner-signal">
            <h3 className="text-xl font-extrabold text-slate-200 flex items-center">
              <span className="text-amber-500 mr-2">✦</span> 오늘의 긴급 코어 시그널
            </h3>
            
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/25 p-7 rounded-2xl space-y-5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 py-1.5 px-3 bg-amber-500/15 text-amber-400 text-[10px] font-mono tracking-widest rounded-bl-xl border-l border-b border-amber-500/20">
                CRITICAL SIGNAL
              </div>
              
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                  <Star className="w-5 h-5 fill-amber-400/30 text-amber-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">글로벌 트리거</span>
                    <h4 className="text-xl font-black text-slate-100 leading-snug mt-1">{briefing.coreSignal.title}</h4>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 font-bold">이유 파악</span>
                      <p className="text-sm text-slate-300 mt-1.5 leading-relaxed font-light">{briefing.coreSignal.reason}</p>
                    </div>
                    <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/15">
                      <span className="text-xs text-amber-400 font-bold">예상 결과 및 투자 지침</span>
                      <p className="text-sm text-amber-200 mt-1.5 leading-relaxed font-semibold">{briefing.coreSignal.result}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SEC 3: 돈이 몰리는 곳 (Volume Leader, Gainers, Losers) */}
          <section className="space-y-4" id="beginner-money-flow">
            <h3 className="text-xl font-extrabold text-slate-200 flex items-center">
              <span className="text-amber-500 mr-2">✦</span> 지금 돈이 몰려드는 핵심 종목구간
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Box 1: 거래대금 상위 */}
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                <span className="text-xs text-slate-400 font-medium">거래 폭발 (단위: 억 원)</span>
                <div className="space-y-2">
                  {briefing.moneyFlow.tradingValue.slice(0, 4).map((st, i) => (
                    <div key={st.code} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 transition-colors">
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-slate-400 font-mono">{i+1}</span>
                          <span className="text-xs font-bold text-slate-200">{st.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{st.code}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-400 font-mono">{st.value.toLocaleString()}억</span>
                        <div className="text-[9px] text-emerald-400 font-mono font-medium">+{st.rate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: 상위 급등주 */}
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>급상승 모멘텀 대장</span>
                </span>
                <div className="space-y-2">
                  {briefing.moneyFlow.topGainers.slice(0, 4).map((st) => (
                    <div key={st.code} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{st.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{st.code}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-300 font-mono">{st.price.toLocaleString()}원</span>
                        <div className="text-xs text-emerald-400 font-mono font-bold">+{st.rate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: 하락 하방 */}
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                <span className="text-xs text-red-400 font-medium flex items-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>일시적 수급 이탈·조정</span>
                </span>
                <div className="space-y-2">
                  {briefing.moneyFlow.topLosers.slice(0, 4).map((st) => (
                    <div key={st.code} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{st.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{st.code}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-300 font-mono">{st.price.toLocaleString()}원</span>
                        <div className="text-xs text-red-400 font-mono font-bold">{st.rate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SEC 4: 오늘 핵심 경제 일정 */}
          <section className="space-y-4" id="beginner-calendar">
            <h3 className="text-xl font-extrabold text-slate-200 flex items-center">
              <span className="text-amber-500 mr-2">✦</span> 오늘 꼭 챙겨야 할 시장 시간표
            </h3>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400">발표 국가 및 안건</span>
                <span className="text-xs text-slate-400">영향 중요도</span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {briefing.economicCalendar.slice(0, 4).map((ev, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-900/70 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs font-mono bg-slate-950 text-slate-400 px-2 py-1 rounded border border-slate-800 font-semibold">{ev.time}</span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-400">[{ev.country}]</span>
                          <h4 className="text-sm font-semibold text-slate-200">{ev.title}</h4>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        ev.importance === "최상" 
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        중요도 {ev.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SEC 5: 지금 이슈 (실시간 테마 뉴스 리포트) */}
          <section className="space-y-4" id="beginner-news">
            <h3 className="text-xl font-extrabold text-slate-200 flex items-center animate-pulse">
              <span className="text-amber-500 mr-2">✦</span> 놓쳐선 안 될 오늘 아침 3대 경제 테마
            </h3>

            <div className="space-y-4">
              {briefing.issuesReport.list.map((item, index) => (
                <div key={index} className="bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 hover:border-slate-700/60 transition-all">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">테마 0{index + 1}</span>
                    <span className="text-slate-500 text-xs font-mono">• PRE-MARKET INSIGHT</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-100 mt-2 leading-snug">{item.title}</h4>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed font-light">{item.context}</p>
                  
                  <div className="mt-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 flex items-start space-x-2 text-xs">
                    <span className="text-amber-400 font-bold shrink-0 bg-amber-400/10 px-1.5 py-0.5 rounded">여명 전망</span>
                    <p className="text-slate-300 leading-relaxed">{item.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Legal Compliance Disclaimer */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-900 text-center space-y-2">
            <p className="text-xs text-slate-400 flex items-center justify-center space-x-1.5">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-300">유사투자자문 가이드라인 준수 고지</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl mx-auto">
              본 서비스가 제공하는 계량적 지수, 마인드맵 노드 및 AI 생성 검증 데이터는 법인 산식을 기초로 산출된 통계 해석 및 뉴스 대변 자료이며, 특정 주식의 1:1 매수 및 매도 유도, 가격 보장, 종목 리딩과는 완벽 무관합니다. 모든 최종 의결 결과와 수익/손실의 총체 주체는 본인입니다.
            </p>
            <p className="text-xs font-bold text-amber-400/80 underline select-none pt-1">
              "투자 참고용 정보입니다. 최종 투자 판단과 책임은 본인에게 있습니다."
            </p>
          </div>

        </main>
      )}

      {/* --- RENDER 2: EXPERT BOOK TERMINAL MODE --- */}
      {mode === "expert" && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6">
          
          {/* EXPERT SIDEBAR: 14 Chapters Table of Contents */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            
            {/* Index summary list */}
            <div className="bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-800 space-y-3 shadow-xl">
              {/* Header trigger for Mobile Collapsible */}
              <div 
                onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
                className="flex items-center justify-between cursor-pointer lg:cursor-default select-none group"
              >
                <div className="flex items-center space-x-2">
                  <span className="lg:hidden text-sky-400 text-sm">📅</span>
                  <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider group-hover:text-slate-200 transition-colors">PRE-MARKET CHAPTERS</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-neutral-500 text-[10px] font-mono">{expertPage + 1}/14 Pages</span>
                  <span className={`lg:hidden text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-sky-400 transition-transform duration-250 ${isMobileTocOpen ? "rotate-180" : "rotate-0"}`}>
                    {isMobileTocOpen ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Progress Slider Track indicator */}
              <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                <div 
                  className="bg-sky-400 h-full transition-all duration-300" 
                  style={{ width: `${((expertPage + 1) / 14) * 100}%` }}
                />
              </div>

              {/* Mobile Active Chapter Indicator Label (when collapsed, help users see current selection) */}
              {!isMobileTocOpen && (
                <div 
                  onClick={() => setIsMobileTocOpen(true)}
                  className="lg:hidden bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 cursor-pointer hover:bg-slate-950 transition-colors flex items-center justify-between"
                >
                  <p className="truncate font-medium text-[11px]">
                    현재: <span className="text-sky-400 font-semibold">{expertPage + 1}. {chapters[expertPage].title}</span>
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 pl-3">목차 펼치기 ▾</span>
                </div>
              )}

              {/* List of 14 chapters - Collapsible on Mobile, always open on Desktop */}
              <div className={`${isMobileTocOpen ? "block" : "hidden lg:block"} space-y-1 max-h-[360px] lg:max-h-[460px] overflow-y-auto pr-1`}>
                {chapters.map((chap, idx) => {
                  const IconComponent = chap.icon;
                  const isCurrent = expertPage === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setExpertPage(idx);
                        setIsMobileTocOpen(false);
                        showToast(`페이지 ${idx + 1}: [${chap.title}] 화면으로 이동했습니다.`, "info");
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center space-x-2.5 transition-all focus:outline-none ${
                        isCurrent
                          ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-400 pl-3 font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 pl-1.5"
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isCurrent ? "text-sky-400" : "text-slate-500"}`} />
                      <div className="truncate text-xs">
                        <span className="font-mono text-[10px] text-slate-500 mr-1.5">{idx + 1}.</span>
                        {chap.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Dashboard - Collapsible on Mobile, always open on Desktop */}
            <div className={`${isMobileTocOpen ? "block" : "hidden lg:block"} bg-slate-900/50 p-4.5 rounded-xl border border-slate-800 space-y-3 shadow-md`}>
              <span className="text-xs font-semibold text-slate-300 block">원터치 전략 바로가기</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setExpertPage(8);
                    setIsMobileTocOpen(false);
                  }} 
                  className="bg-slate-950 hover:bg-slate-800 p-2 rounded text-left border border-slate-800 cursor-pointer"
                >
                  <span className="text-[10px] text-sky-400 block font-mono">LAB 09</span>
                  <span className="text-xs text-slate-300 font-medium">종목 심층분석</span>
                </button>
                <button 
                  onClick={() => {
                    setExpertPage(13);
                    setIsMobileTocOpen(false);
                  }} 
                  className="bg-slate-950 hover:bg-slate-800 p-2 rounded text-left border border-slate-800 cursor-pointer"
                >
                  <span className="text-[10px] text-amber-400 block font-mono">LAB 14</span>
                  <span className="text-xs text-slate-300 font-medium">퀀트 백테스터</span>
                </button>
              </div>
            </div>
            
          </aside>

          {/* MAIN PAGE AREA: Book Frame with Left/Right controllers */}
          <section className="flex-1 min-w-0 space-y-6">
            
            {/* Book Navigation Bar */}
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
              
              <button
                onClick={() => {
                  if (expertPage > 0) {
                    setExpertPage(prev => prev - 1);
                  } else {
                    setExpertPage(13); // Loop back
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center space-x-1"
                title="이전장 (책장 뒤로)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-mono hidden sm:inline">PREV</span>
              </button>

              <div className="text-center px-1 flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs text-sky-400 font-bold uppercase tracking-widest font-mono block truncate">CHAPTER 0{expertPage + 1} — {chapters[expertPage].title}</span>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-light block truncate">{chapters[expertPage].desc}</p>
              </div>

              <button
                onClick={() => {
                  if (expertPage < 13) {
                    setExpertPage(prev => prev + 1);
                  } else {
                    setExpertPage(0); // loop front
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center space-x-1"
                title="다음장 (책장 앞으로)"
              >
                <span className="text-xs font-mono hidden sm:inline">NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

            {/* --- CHAPTER MAIN WORKSPACE CONTENT DECK --- */}
            <div className="bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 shadow-2xl relative min-h-[580px]">
              
              {/* PAGE 1: 오늘의 한 장 (Executive Market Score Dashboard) */}
              {expertPage === 0 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* Atmospheric Gauge Panel */}
                    <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 relative flex flex-col justify-between">
                      <span className="text-xs text-sky-400 font-bold uppercase">DAWN WEATHER INDEX</span>
                      <div className="py-6 text-center">
                        <span className="text-7xl font-black bg-gradient-to-r from-sky-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">{briefing.score}</span>
                        <span className="text-xs text-slate-400 block mt-2">오늘 시장 여명 매력지수</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg text-center text-xs text-slate-300">
                        금일 추천강도: <span className="text-sky-400 font-bold">비중 확대 우상향</span>
                      </div>
                    </div>

                    {/* Executive Summary Paragraph */}
                    <div className="md:col-span-2 bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">EXECUTIVE SUMMARY REPORT</span>
                      <h4 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>미국 채권 금리 안정 및 한국 야간 선물 순조</span>
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {briefing.summary} 어젯밤 나스닥의 전고점 돌파세가 이어짐에 따라 금일 국내 시장 역시 반도체 수지 중심으로 외국인의 수동 순매수가 유입될 것으로 계산되는 새벽입니다.
                      </p>
                      
                      <div className="bg-slate-900/60 p-4 rounded-lg flex items-start space-x-2 text-xs">
                        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span className="text-slate-400 leading-relaxed">
                          * 고수 모드는 한국 금융 가이드를 준수하기 위해 개별 종목에 대한 주관적 강제 매수 점수 평점을 거부하고 매크로 지수를 기반으로 한 통계 점수만을 산출합니다.
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Core Global Indicator Grid */}
                  <div className="space-y-3">
                    <span className="text-xs text-slate-400 font-bold block bg-slate-950/40 p-2 rounded">금일 프리마켓 3대 관찰 포인트</span>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                        <span className="text-xs text-amber-400 font-bold block">1. 미 10년 만기 금리 후퇴</span>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">경착륙 리스크 해제에 따라 신흥국 테크주의 밸류에이션 상향 가중.</p>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                        <span className="text-xs text-sky-400 font-bold block">2. 반도체 HBM 공급 경쟁 심화</span>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">대장주 교차 수급과 코스닥 소재·장비 전문 부품 수혜주 중심 순환.</p>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                        <span className="text-xs text-emerald-400 font-bold block">3. 국책 대왕고래 시추 예산배정</span>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">대량 거래량이 분산되며 테마급 변동성이 상존하는 지지선 체크.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 2: 투자매력도 마인드맵 (Interactive SVG-Like Branch Nodes Trees) */}
              {expertPage === 1 && (
                <div className="space-y-6">
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 text-xs flex justify-between items-center flex-wrap gap-2">
                    <span className="text-slate-400 font-mono">● 실시간 마이크로 구조연결망 (지표 수렴도)</span>
                    <span className="text-slate-500 text-[10px] font-light">각 노드를 통해 오늘 투자 촉진 연결성을 추리해 보십시오.</span>
                  </div>

                  {/* HTML/SVG Mindmap Node Tree View */}
                  <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px] overflow-x-auto">
                    
                    {/* Root Score Item */}
                    <div className="bg-yellow-500 text-slate-950 font-bold px-6 py-3 rounded-full shadow-lg shadow-yellow-500/10 flex flex-col items-center shrink-0">
                      <span className="text-xs font-mono uppercase tracking-wider">ROOT SCORE</span>
                      <span className="text-lg font-black">{briefing.mindmap.nodes.label}</span>
                      <span className="text-[10px] font-normal">{briefing.mindmap.nodes.description}</span>
                    </div>

                    {/* Vertical Connector */}
                    <div className="w-0.5 h-8 bg-gradient-to-b from-yellow-500 to-sky-400"></div>

                    {/* Sectors Branch Grid */}
                    <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl pt-2">
                      {briefing.mindmap.nodes.children.map((sec: any) => (
                        <div key={sec.id} className="flex flex-col items-center">
                          
                          {/* Sector Node Capsule */}
                          <div className="bg-slate-900 border border-sky-400/30 p-3 rounded-xl text-center shadow-md w-full">
                            <span className="text-[10px] text-sky-400 font-mono font-bold uppercase">{sec.relation}</span>
                            <h5 className="text-sm font-extrabold text-slate-100 mt-1">{sec.label}</h5>
                          </div>

                          {/* Connector Line downwards */}
                          <div className="w-0.5 h-6 bg-sky-400/40"></div>

                          {/* Stocks Leafs */}
                          <div className="space-y-1.5 w-full">
                            {sec.children.map((st: any) => (
                              <button
                                key={st.id}
                                onClick={() => {
                                  // Update Selected Stock Lab Code
                                  const matched = stocksList.find(item => item.name === st.label.split(" (")[0]);
                                  if (matched) {
                                    setSelectedStockCode(matched.code);
                                    setExpertPage(8); // Jump to Stock Analytical Page 9
                                    showToast(`${matched.name}의 심층 연구 데이터 연구실을 로드했습니다.`, "success");
                                  } else {
                                    showToast(`${st.label}은(는) 가용 20종 리스트 외 개별 분석을 AI로 연동합니다.`, "info");
                                  }
                                }}
                                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded text-center block transition-all hover:border-slate-600 focus:outline-none"
                              >
                                <span className="text-xs font-semibold text-slate-200 block">{st.label}</span>
                                <span className="text-[10px] text-slate-500 font-mono italic">{st.metric}</span>
                              </button>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>

                  <div className="text-xs text-slate-500 text-center">
                    💡 종목 카드를 클릭하시면 <span className="text-sky-400 font-semibold">9. 종목 심층 분석</span> 탭으로 자동 이동하여 재무분석 및 캔들 차트를 확인합니다.
                  </div>
                </div>
              )}

              {/* PAGE 3: 글로벌 마켓 (Global indices sparkline/recharts card) */}
              {expertPage === 2 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {briefing.globalMarkets.list.map((mk) => {
                      const isUp = mk.change.trim().startsWith("+");
                      return (
                        <div key={mk.name} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-bold">{mk.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {mk.rate}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-xl font-bold font-mono tracking-tight text-slate-100">{mk.value}</span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {isUp ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownLeft className="w-3 h-3 text-red-400" />}
                              <span className={`text-xs font-mono font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>{mk.change}</span>
                            </div>
                          </div>

                          {/* Quick Sparkline Area Representation to visualize 5 trading periods */}
                          <div className="h-10 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={mk.chart.map((val, idx) => ({ idx, val }))}>
                                <defs>
                                  <linearGradient id={`grad-${mk.name}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                <Area type="monotone" dataKey="val" stroke={isUp ? "#10b981" : "#ef4444"} fillOpacity={1} fill={`url(#grad-${mk.name})`} strokeWidth={1.5} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">OVERVIEW CHART OF S&P500</span>
                    <p className="text-xs text-slate-400">최근 글로벌 주식 마진 지수의 추세적 완화를 대변하는 5단계 누적 궤적 지표입니다. 글로벌 지조가 국내 동시호가 갭상성을 촉진시킵니다.</p>
                  </div>
                </div>
              )}

              {/* PAGE 4: 매크로 주요 지표 (Interest rates, currencies, BTC, raw materials) */}
              {expertPage === 3 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {briefing.macro.rates.map((indicator, idx) => {
                      const isNegativeFlow = indicator.variant === "negative";
                      return (
                        <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-xs text-slate-400 block">{indicator.name}</span>
                            <span className="text-2xl font-bold font-mono tracking-tight text-white">{indicator.value}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-flex items-center space-x-1 text-xs font-mono font-bold px-2 py-1 rounded ${
                              isNegativeFlow 
                                ? "bg-red-500/10 text-red-500" 
                                : "bg-emerald-500/10 text-emerald-400"
                            }`}>
                              <span>{indicator.change}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1">실시간 연동 기준</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-sky-500/5 p-4 rounded-xl border border-sky-500/10 text-xs leading-relaxed text-sky-200">
                    ℹ️ 원/달러 환율 하락 및 미국 국채 금리 하락은 외국계 자금의 순수한 신흥국(KOSPI/KOSDAQ) 선물 순매수 유입 자금을 가중하는 강한 장전 호재 작용을 합니다.
                  </div>
                </div>
              )}

              {/* PAGE 5: 외국인·기관 수급 (Regular Market Stock Flow indicators) */}
              {expertPage === 4 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* KOSPI flow */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-xs text-slate-400 font-bold block bg-slate-900 px-2 py-1 rounded">KOSPI 투자자별 전거래일 순매수 (억원)</span>
                      
                      <div className="space-y-3.5 pt-2">
                        {/* Foreigner */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">외국인 (Foreign)</span>
                            <span className="text-emerald-400 font-bold font-mono">+{briefing.flows.kospi.foreign} 억</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "75%" }} />
                          </div>
                        </div>

                        {/* Institution */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">금융 기관 (Institution)</span>
                            <span className="text-red-400 font-bold font-mono">{briefing.flows.kospi.institution} 억</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: "35%" }} />
                          </div>
                        </div>

                        {/* Retail */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">개인 투자자 (Retail)</span>
                            <span className="text-red-400 font-bold font-mono">{briefing.flows.kospi.retail} 억</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: "25%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KOSDAQ flow */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-xs text-slate-400 font-bold block bg-slate-900 px-2 py-1 rounded">KOSDAQ 투자자별 전거래일 순매수 (억원)</span>
                      
                      <div className="space-y-3.5 pt-2">
                        {/* Foreigner */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">외국인 (Foreign)</span>
                            <span className="text-red-400 font-bold font-mono">{briefing.flows.kosdaq.foreign} 억</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: "40%" }} />
                          </div>
                        </div>

                        {/* Institution */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">금융 기관 (Institution)</span>
                            <span className="text-red-400 font-bold font-mono">{briefing.flows.kosdaq.institution} 억</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: "45%" }} />
                          </div>
                        </div>

                        {/* Retail */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">개인 투자자 (Retail)</span>
                            <span className="text-emerald-400 font-bold font-mono">+{briefing.flows.kosdaq.retail} 억</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "65%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                    📝 <span className="font-bold text-slate-200">수급 해설:</span> 코스피 대장주는 외국인의 연대 매수로 지탱받는 반면, 코스닥은 외국인 및 연기금의 일시 이탈세를 개인이 받쳐 안고 있는 형국입니다. 시초 갭상승이 코스피 반도체에 유리함을 대변합니다.
                  </div>
                </div>
              )}

              {/* PAGE 6: 실시간 거래대금 상위 */}
              {expertPage === 5 && (
                <div className="space-y-6">
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
                      <span>순위 종목명</span>
                      <span className="text-right">장전 예상 거래대금 / 전일비</span>
                    </div>

                    <div className="divide-y divide-slate-800/80">
                      {briefing.moneyFlow.tradingValue.map((item, index) => (
                        <div key={item.code} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-mono text-slate-500 w-4">{index + 1}</span>
                            <div>
                              <span className="text-sm font-bold text-slate-200 block">{item.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{item.code}</span>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-sm font-bold text-sky-400">약 {item.value.toLocaleString()} 억 원</span>
                            <div className="text-xs text-emerald-400">+{item.rate}% 동행 지지</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 italic text-center">
                    * 연동 데이트 소스: 네이버 웹 증시 장전 동시호가 가집계 수령값입니다.
                  </div>
                </div>
              )}

              {/* PAGE 7: 섹터·테마 전망 */}
              {expertPage === 6 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {briefing.sectorOutlook.list.map((sec, idx) => (
                      <div key={idx} className="bg-slate-950 p-4.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-slate-200">{sec.name}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            sec.status === "positive"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : sec.status === "neutral"
                                ? "bg-slate-500/10 text-slate-400 border border-slate-700"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {sec.status === "positive" ? "긍정 (Bullish)" : sec.status === "neutral" ? "중립 (Neutral)" : "비중축소 (Bearish)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">{sec.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE 8: 이슈 & 전망 리포트 */}
              {expertPage === 7 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {briefing.issuesReport.list.map((item, index) => (
                      <div key={index} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-mono border border-sky-500/20">REPORT 0{index+1}</span>
                          <span className="text-slate-500 text-[10px] uppercase font-mono">Macro Catalyst</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100">{item.title}</h4>
                        
                        <div className="grid md:grid-cols-3 gap-4 pt-2">
                          <div className="md:col-span-2 text-xs text-slate-400 leading-relaxed space-y-1">
                            <span className="text-slate-500 font-bold block">원론적 정보 맥스</span>
                            <p className="font-light">{item.context}</p>
                          </div>
                          
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
                            <span className="text-sky-400 font-bold block mb-1">국내 지배 영향</span>
                            <p className="text-slate-300 font-light leading-relaxed">{item.impact}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE 9: 종목 심층 분석 (Analytical Stock Lab Dashboard) */}
              {expertPage === 8 && (
                <div className="space-y-6">
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <span className="text-xs text-slate-300 font-bold block">종목 분석 연구소</span>
                    
                    {/* Search / Selection controllers */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="종목 이름 혹은 종목코드 검색 (예: 삼성전자, 알테오젠)"
                          value={stockSearchTerm}
                          onChange={(e) => setStockSearchTerm(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      {/* Dropdown list of core stocks */}
                      <select
                        value={selectedStockCode}
                        onChange={(e) => setSelectedStockCode(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                        id="select-stock-analyser"
                      >
                        {stocksList.map(s => (
                          <option key={s.code} value={s.code}>
                            {s.name} ({s.code}) - {s.sector}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtered stocks compact grid */}
                    {stockSearchTerm && (
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 max-h-24 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {filteredStocks.map(s => (
                          <button
                            key={s.code}
                            onClick={() => {
                              setSelectedStockCode(s.code);
                              setStockSearchTerm("");
                            }}
                            className="text-left p-1.5 rounded bg-slate-950 hover:bg-slate-900 text-[11px] block text-slate-300 truncate"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Render analysis result container */}
                  {analysisLoading ? (
                    <div className="bg-slate-950/40 p-12 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                      <p className="text-xs text-slate-400">Gemini 리서치 모듈이 동원되어 최신 공시 뉴스를 정제하고 있습니다...</p>
                    </div>
                  ) : analysisResult ? (
                    <div className="space-y-6">
                      
                      {/* Top quick stats cards */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">가장 최근 주가</span>
                          <span className="text-lg font-bold font-mono text-slate-200">{(analysisResult.price || 50000).toLocaleString()}원</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">PER배수 (주가수익비율)</span>
                          <span className="text-lg font-bold font-mono text-slate-200">{analysisResult.metrics?.pe || "N/A"} 배</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">PBR배수 (주가순자산비율)</span>
                          <span className="text-lg font-bold font-mono text-slate-200">{analysisResult.metrics?.pbr || "N/A"} 배</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">ROE (자기자본이익률)</span>
                          <span className="text-lg font-bold font-mono text-emerald-400">{analysisResult.metrics?.roe || "N/A"}%</span>
                        </div>
                      </div>

                      {/* Summary text */}
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-xs text-sky-400 font-bold font-mono block">SUMMARY REPORT</span>
                        <p className="text-sm text-slate-200 leading-relaxed font-light">{analysisResult.summary}</p>
                      </div>

                      {/* Interactive visual candle-grid emulation (Chart placeholder or simplified mini visualizer) */}
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>📊 250일 주가 흐름 지표 (수렴 추세선)</span>
                          <span className="text-[10px] text-slate-500">KOSPI / KOSDAQ 연동 지수 시뮬레이션</span>
                        </div>
                        
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { d: "02월", valuation: (analysisResult.price * 0.8) },
                              { d: "03월", valuation: (analysisResult.price * 0.85) },
                              { d: "04월", valuation: (analysisResult.price * 0.82) },
                              { d: "05월", valuation: (analysisResult.price * 0.95) },
                              { d: "06월", valuation: (analysisResult.price) }
                            ]}>
                              <XAxis dataKey="d" stroke="#475569" fontSize={10} />
                              <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} labelStyle={{ color: "#94a3b8" }} />
                              <Area type="monotone" dataKey="valuation" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.06} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Deep bullet analysis report cards */}
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-xs text-slate-400 font-bold block">종목 3대 입각 리서치 인텔리전스</span>
                        <div className="divide-y divide-slate-850 space-y-3">
                          {analysisResult.analysis?.map((p: string, i: number) => (
                            <div key={i} className="pt-3 flex items-start space-x-2.5">
                              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">0{i+1}</span>
                              <p className="text-xs text-slate-300 leading-relaxed font-light">{p}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : null}

                </div>
              )}

              {/* PAGE 10: 증시 핵심 일정 */}
              {expertPage === 9 && (
                <div className="space-y-6">
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 flex justify-between">
                      <span>시간 및 해당국</span>
                      <span>공시 지표 중요도</span>
                    </div>

                    <div className="divide-y divide-slate-800/80">
                      {briefing.economicCalendar.map((ev, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-900/40">
                          <div className="flex items-center space-x-4">
                            <span className="text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1 rounded font-bold">{ev.time}</span>
                            <div>
                              <span className="text-xs text-slate-400 font-bold mr-1">[{ev.country}]</span>
                              <span className="text-sm text-slate-200">{ev.title}</span>
                            </div>
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ev.importance === "최상"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}>
                              중요 {ev.importance}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 11: 글로벌 야간 브리핑 */}
              {expertPage === 10 && (
                <div className="space-y-6">
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                    <span className="text-xs text-slate-400 font-mono tracking-widest uppercase block">글로벌 야간 시장 종합 동시 보고서</span>
                    
                    <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-base leading-relaxed text-slate-200">
                      &ldquo; {briefing.overnightRecap.summary} &rdquo;
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs text-slate-400 font-bold block">상세 등락 요인 해부</span>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">{briefing.overnightRecap.details}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 12: 위험 대응 시나리오 (Tactical Checklist) */}
              {expertPage === 11 && (
                <div className="space-y-6">
                  <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/15 text-xs text-amber-200 leading-relaxed flex items-start space-x-2">
                    <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      <strong>오늘 장전 뇌동매 매 제어:</strong> 아침 동시호가 웅성거림에 흥분하기보더, 아래 3대 시나리오 리스크 점검을 체킹하여 투자자 마인드셋을 보호하십시오.
                    </span>
                  </div>

                  <div className="space-y-4">
                    {checklist.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-5 rounded-xl border transition-all ${
                          item.checked 
                            ? "bg-sky-500/5 border-sky-500/20" 
                            : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => {
                              const updated = checklist.map(cell => {
                                if (cell.id === item.id) {
                                  return { ...cell, checked: !cell.checked };
                                }
                                return cell;
                              });
                              setChecklist(updated);
                              showToast(item.checked ? "점검 체크를 해제했습니다." : "시나리오 숙지 체크 완료!", "success");
                            }}
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer focus:outline-none ${
                              item.checked 
                                ? "bg-sky-500 border-sky-400 text-slate-950" 
                                : "border-slate-700 hover:border-slate-500"
                            }`}
                          >
                            {item.checked && <Check className="w-4.5 h-4.5 stroke-[3]" />}
                          </button>
                          
                          <div className="space-y-2">
                            <span className="text-xs text-slate-400 block font-mono">시나리오 상황: {item.scenario}</span>
                            <p className="text-sm font-semibold text-slate-100">{item.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE 13: 마켓 멀티 스크리너 (성장 / 가치 / 배당 / 급등 / 수급 교차 비교 분석 레일) */}
              {expertPage === 12 && (
                <div className="space-y-6">
                  {/* Preset Tab switcher with desktop stretch and mobile grid spacing optimization */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                    <button
                      onClick={() => {
                        setActiveValuePreset("growth");
                        showToast("성장형 코스피/코스닥 우량주 스크리너를 선택했습니다.");
                      }}
                      className={`text-center py-2.5 px-1 rounded-lg text-[11px] font-bold transition-all focus:outline-none cursor-pointer ${
                        activeValuePreset === "growth" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                      }`}
                    >
                      🚀 고성장 우량 (성장)
                    </button>
                    <button
                      onClick={() => {
                        setActiveValuePreset("value");
                        showToast("PBR 0.x배 저평가 밸류업 스크리너를 선택했습니다.");
                      }}
                      className={`text-center py-2.5 px-1 rounded-lg text-[11px] font-bold transition-all focus:outline-none cursor-pointer ${
                        activeValuePreset === "value" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                      }`}
                    >
                      💎 저평가 밸류 (가치)
                    </button>
                    <button
                      onClick={() => {
                        setActiveValuePreset("dividend");
                        showToast("안정 배당 귀족주 스크리너를 선택했습니다.");
                      }}
                      className={`text-center py-2.5 px-1 rounded-lg text-[11px] font-bold transition-all focus:outline-none cursor-pointer ${
                        activeValuePreset === "dividend" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                      }`}
                    >
                      💰 고배당 안전 (배당)
                    </button>
                    <button
                      onClick={() => {
                        setActiveValuePreset("surging");
                        showToast("최근 거래대금 폭발 및 급등주 스크리너를 선택했습니다.");
                      }}
                      className={`text-center py-2.5 px-1 rounded-lg text-[11px] font-bold transition-all focus:outline-none cursor-pointer ${
                        activeValuePreset === "surging" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                      }`}
                    >
                      🔥 거래대금 폭발 (급등)
                    </button>
                    <button
                      onClick={() => {
                        setActiveValuePreset("supply");
                        showToast("외인·기관 쌍끌이 수급주 스크리너를 선택했습니다.");
                      }}
                      className={`col-span-2 sm:col-span-1 text-center py-2.5 px-1 rounded-lg text-[11px] font-bold transition-all focus:outline-none cursor-pointer ${
                        activeValuePreset === "supply" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                      }`}
                    >
                      📊 수급 최상위 (수급)
                    </button>
                  </div>

                  {/* Table of presets */}
                  <div className="space-y-4">
                    {briefing.valueScreenerPresets[activeValuePreset]?.map((st: any) => (
                      <div key={st.code} className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-slate-100">{st.name}</span>
                              <span className="text-xs text-slate-400 font-mono">({st.code})</span>
                            </div>
                            <span className="text-[10px] bg-slate-900 text-sky-400 px-2 py-0.5 rounded font-bold inline-block mt-1">{st.highlight}</span>
                          </div>
                          
                          <div className="flex space-x-3 text-xs text-slate-400 font-mono">
                            <span>PER: <strong>{st.pe}배</strong></span>
                            <span>ROE: <strong className="text-emerald-400">{st.roe}%</strong></span>
                            <span>배당: <strong>{st.divYield}%</strong></span>
                          </div>
                        </div>

                        <div className="pt-3">
                          <span className="text-xs text-slate-400 font-bold block mb-1">선도 가중해설 (AI Sourcing)</span>
                          <p className="text-xs text-slate-300 font-light leading-relaxed">{st.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE 14: 탐색기 & 백테스터 (AI Screener & Quant Engine Backtester) */}
              {expertPage === 13 && (
                <div className="space-y-8">
                  
                  {/* SECTION 1: AI 종목 스크리너 */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-4">
                    <span className="text-xs text-sky-400 font-bold font-mono tracking-wider block">1. AI 종목 스크리너 (GEMINI 3.5 SEARCH GROUNDING)</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      구글 제미나이 최신 실시간 정보를 기반으로 장전 투자아이디어를 검색해 보세요. (예: "원자력 발전 수출 테마 수혜주", "반도체 HBM 부품 한미반도체 협력관계")
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={screenerQuery}
                        onChange={(e) => setScreenerQuery(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                        placeholder="이차전지 양극재 원재료 공급망 핵심 종목..."
                      />
                      <button
                        onClick={handleRunScreener}
                        disabled={screenerLoading}
                        className="bg-sky-500 hover:bg-sky-450 text-slate-950 rounded-xl px-4 py-2 text-xs font-semibold shrink-0 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500"
                        id="btn-screener-search"
                      >
                        {screenerLoading ? "AI 추출 중..." : "AI 스크리닝"}
                      </button>
                    </div>

                    {/* AI Screener Feedback */}
                    {screenerResults.length > 0 && (
                      <div className="space-y-3.5 pt-2">
                        {screenerMessage && (
                          <div className="p-2.5 bg-yellow-500/5 border border-yellow-500/15 rounded-lg text-[10px] text-yellow-300">
                            📢 {screenerMessage}
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          {screenerResults.map((st, i) => (
                            <div key={i} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-100">{st.name} ({st.code})</span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded">{st.sector}</span>
                              </div>
                              <div className="flex gap-3 text-[10px] text-slate-500 font-mono">
                                <span>PER: {st.pe}배</span>
                                <span>ROE: {st.roe}%</span>
                                <span>배당: {st.divYield}%</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-950 pt-2 font-light">{st.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: 퀀트 매매기법 백테스터 */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-4">
                    <span className="text-xs text-amber-400 font-bold font-mono tracking-wider block">2. 정밀 퀀트 백테스터 (QUANT SIMULATOR)</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      엄선된 20대 우량주를 기반으로 과거 250거래일 기준 기술적 돌파 시뮬레이션을 가동합니다.
                    </p>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/60 text-xs">
                      
                      {/* Strategy dropdown */}
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">매매기법 전략</span>
                        <select
                          value={backtestStrategy}
                          onChange={(e) => setBacktestStrategy(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
                          id="select-bt-strategy"
                        >
                          <option value="golden-cross">골든크로스 수렴 돌파 (5일-20일 이평선)</option>
                          <option value="rsi-oversold">지지도 저점 포착 반등 (RSI 과매도 수렴)</option>
                          <option value="breakout">10일 전고점 거래량 돌파</option>
                        </select>
                      </div>

                      {/* Stock select */}
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">시뮬레이션 종목</span>
                        <select
                          value={backtestStockCode}
                          onChange={(e) => setBacktestStockCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none"
                          id="select-bt-stock"
                        >
                          {stocksList.map(s => (
                            <option key={s.code} value={s.code}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Take Profit target */}
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">익절 가이드 목표 (%)</span>
                        <input
                          type="number"
                          value={btTakeProfit}
                          onChange={(e) => setBtTakeProfit(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
                        />
                      </div>

                      {/* Stop loss target */}
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">손절 지지방어 선 (%)</span>
                        <input
                          type="number"
                          value={btStopLoss}
                          onChange={(e) => setBtStopLoss(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleRunBacktest}
                        disabled={backtestLoading}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-5 py-2.5 text-xs flex items-center space-x-1.5 cursor-pointer"
                        id="btn-run-backtest"
                      >
                        {backtestLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>시뮬레이션 구동 중...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>백테스트 엔진 실행</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Backtest Report */}
                    {backtestResult && (
                      <div className="space-y-6 pt-4 border-t border-slate-900">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          
                          <div className="bg-slate-900 p-3 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 block">전략 승률 (Win Rate)</span>
                            <span className="text-base font-bold font-mono text-emerald-400">{backtestResult.metrics.winRate}%</span>
                          </div>
                          
                          <div className="bg-slate-900 p-3 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 block">전략 최종 수익률</span>
                            <span className={`text-base font-bold font-mono ${
                              backtestResult.metrics.strategyYield >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {backtestResult.metrics.strategyYield}%
                            </span>
                          </div>

                          <div className="bg-slate-900 p-3 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 block">동 단순보유 수익률</span>
                            <span className={`text-base font-bold font-mono ${
                              backtestResult.metrics.bhYield >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {backtestResult.metrics.bhYield}%
                            </span>
                          </div>

                          <div className="bg-slate-900 p-3 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 block">최대낙폭 (MDD)</span>
                            <span className="text-base font-bold font-mono text-red-400">{backtestResult.metrics.mdd}%</span>
                          </div>

                          <div className="bg-slate-900 p-3 rounded-lg text-center col-span-2 md:col-span-1">
                            <span className="text-[10px] text-slate-400 block">총 거래횟수</span>
                            <span className="text-base font-bold font-mono text-slate-200">{backtestResult.metrics.tradesCount}회</span>
                          </div>

                        </div>

                        {/* Backtest Trend Recharts line block */}
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 space-y-2">
                          <span className="text-xs text-slate-400 block">총 자산 누적 궤적 비교 (퀀트 전략 vs 보유 전략)</span>
                          <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={backtestResult.history.filter((_: any, i: number) => i % 4 === 0)}>
                                <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                                <Line type="monotone" dataKey="strategyWorth" name="DAWN 퀀트전략 가치" stroke="#38bdf8" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="bhWorth" name="단순 매수보유 가치" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Order Logs */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-300 block">체결 상세 로그 (최근 5건)</span>
                          <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-900 text-xs text-left">
                            <div className="grid grid-cols-4 p-2.5 bg-slate-900 font-bold text-slate-400">
                              <span>체결 일자</span>
                              <span>거래 항목</span>
                              <span className="text-right">체결 가격</span>
                              <span className="text-right">수익률 / 이익금</span>
                            </div>
                            <div className="divide-y divide-slate-900 max-h-36 overflow-y-auto">
                              {backtestResult.tradeLogs.slice(-6).map((log: any, i: number) => (
                                <div key={i} className="grid grid-cols-4 p-2.5 hover:bg-slate-900/60 font-mono">
                                  <span className="text-slate-400">{log.date}</span>
                                  <span className={log.type.includes("매수") ? "text-sky-400 font-bold" : "text-amber-400 font-bold"}>{log.type}</span>
                                  <span className="text-right text-slate-300">{log.price.toLocaleString()}원</span>
                                  <span className={`text-right ${log.yield > 0 ? "text-emerald-400 font-bold" : "text-red-400"}`}>
                                    {log.type.includes("매도") ? `+${log.yield}% (${log.profit.toLocaleString()}원)` : "-"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </section>

        </div>
      )}

      {/* FOOTER COMMON LEGAL COMPLIANCE DISCLAIMER COMPULSORY */}
      <footer className="mt-16 border-t border-slate-900 py-10 bg-[#02050e] relative z-20 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs text-slate-500 tracking-wider">
            DAWN · 빌드 에디터: 에이브로(AVRO) · SEOUL FINANCE RESEARCH GROUP
          </p>
          <div className="text-xs text-slate-400 font-mono bg-slate-950/80 px-4 py-3 rounded-lg border border-slate-900 max-w-xl mx-auto leading-relaxed">
            📢 <span className="font-extrabold text-slate-300 uppercase block mb-1">유사투자자문 가이드 조항 준수 안내</span>
            개별 종목 투자 유도 성격의 점수, 종목 메리트 배급, 비밀 리딩방 모집과는 어떠한 상호 연동도 제공하지 않는 장전 공개 수치 집약체입니다. 각 시나리오 백테스트 실행 데이터는 임의 모델링 궤적으로, 실제 손실 보장 또는 이익 수장을 보증하지 않습니다.
          </div>
          <p className="text-xs text-slate-500 font-bold select-none leading-relaxed">
            &ldquo; 투자 참고용 정보입니다. 최종 투자 판단과 책임은 본인에게 있습니다. &rdquo;
          </p>
        </div>
      </footer>

    </div>
  );
}
