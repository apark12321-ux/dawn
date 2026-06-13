import { useEffect, useState } from "react";
import { PriceModal, KakaoModal, StockModal, NewsModal } from "./components/Modals";
import { fetchBriefing } from "./lib/api";
import { useLive } from "./hooks/useLive";
import { EMPTY } from "./lib/empty";
import { Briefing, Stock, NewsItem } from "./lib/types";
import Finder from "./finder/Finder";
import Web from "./Web";
import Lite from "./Lite";

type Modal = { kind: "price" } | { kind: "kakao" } | { kind: "stock"; stock: Stock } | { kind: "news"; news: NewsItem } | null;
type Mode = "lite" | "pro" | null;

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") === "/finder") return <Finder />;
  return <Briefingapp />;
}

function ModeGate({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="gate">
      <div className="gate-bg" />
      <div className="gate-in">
        <div className="gate-tag">PRE-MARKET INTELLIGENCE</div>
        <h1 className="gate-title">DAWN <span>여명</span></h1>
        <div className="gate-sub">장이 열리기 전, 가장 먼저 시장을 읽다.</div>
        <div className="gate-q">어떻게 볼까요?</div>
        <div className="gate-cards">
          <button className="gate-card lite" onClick={() => onPick("lite")}>
            <div className="gate-ico">🔰</div>
            <div className="gate-ct">초보 모드</div>
            <div className="gate-cd">큰 글씨 · 쉬운 한 줄 설명<br />오늘 시장을 3초 만에</div>
            <div className="gate-go">이걸로 볼게요 →</div>
          </button>
          <button className="gate-card pro" onClick={() => onPick("pro")}>
            <div className="gate-ico">📊</div>
            <div className="gate-ct">고수 모드</div>
            <div className="gate-cd">책장 넘김 · 13페이지<br />지수·수급·섹터·스크리너 풀데이터</div>
            <div className="gate-go">이걸로 볼게요 →</div>
          </button>
        </div>
        <div className="gate-fine">언제든 화면에서 모드를 바꿀 수 있어요</div>
      </div>
    </div>
  );
}

function Briefingapp() {
  const [b, setB] = useState<Briefing>(EMPTY);
  const live = useLive();
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => { fetchBriefing().then(setB).catch(() => {}); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  const openPrice = () => setModal({ kind: "price" });
  const openKakao = () => setModal({ kind: "kakao" });
  const openStock = (s: Stock) => setModal({ kind: "stock", stock: s });
  const openNews = (n: NewsItem) => setModal({ kind: "news", news: n });
  const close = () => setModal(null);

  return (
    <>
      {mode === null && <ModeGate onPick={setMode} />}
      {mode === "lite" && <Lite b={b} live={live} onPro={() => setMode("pro")} openStock={openStock} openNews={openNews} />}
      {mode === "pro" && <Web b={b} live={live} onLite={() => setMode("lite")} openPrice={openPrice} openKakao={openKakao} openStock={openStock} openNews={openNews} />}
      {modal?.kind === "price" && <PriceModal onClose={close} />}
      {modal?.kind === "kakao" && <KakaoModal onClose={close} onDone={() => { close(); setToast("신청 완료 — 내일 06:30부터 카톡으로 받아요"); }} />}
      {modal?.kind === "stock" && <StockModal stock={modal.stock} onClose={close} />}
      {modal?.kind === "news" && <NewsModal news={modal.news} onClose={close} />}
      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
