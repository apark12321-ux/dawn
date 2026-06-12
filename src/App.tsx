import { useEffect, useState } from "react";
import { Deck } from "./components/Deck";
import { Landing } from "./components/slides/Landing";
import { Overview } from "./components/slides/Overview";
import { GlobalSlide } from "./components/slides/GlobalSlide";
import { NewsSlide } from "./components/slides/NewsSlide";
import { FlowSectors } from "./components/slides/FlowSectors";
import { Stocks } from "./components/slides/Stocks";
import { Pro } from "./components/slides/Pro";
import { PriceModal, KakaoModal, StockModal, NewsModal } from "./components/Modals";
import { fetchBriefing } from "./lib/api";
import { getTrial } from "./lib/trial";
import { useLive } from "./hooks/useLive";
import { EMPTY } from "./lib/empty";
import { Briefing, Stock, NewsItem } from "./lib/types";
import Finder from "./finder/Finder";

type Modal = { kind: "price" } | { kind: "kakao" } | { kind: "stock"; stock: Stock } | { kind: "news"; news: NewsItem } | null;

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") === "/finder") return <Finder />;
  return <Briefingapp />;
}

function Briefingapp() {
  const [b, setB] = useState<Briefing>(EMPTY);
  const live = useLive();
  const [trial] = useState(getTrial);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");

  useEffect(() => { fetchBriefing().then(setB).catch(() => {}); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  const openPrice = () => setModal({ kind: "price" });
  const openKakao = () => setModal({ kind: "kakao" });
  const openStock = (s: Stock) => setModal({ kind: "stock", stock: s });
  const openNews = (n: NewsItem) => setModal({ kind: "news", news: n });
  const close = () => setModal(null);

  return (
    <>
      <Deck
        classes={["landing", "ov", "", "", "", "", ""]}
        render={(go) => [
          <Landing onEnter={() => go(1)} />,
          <Overview b={b} live={live} day={trial.day} trialActive={trial.trialActive} />,
          <GlobalSlide b={b} live={live} trialActive={trial.trialActive} openPrice={openPrice} />,
          <NewsSlide b={b} trialActive={trial.trialActive} openPrice={openPrice} openNews={openNews} />,
          <FlowSectors b={b} />,
          <Stocks b={b} trialActive={trial.trialActive} openPrice={openPrice} openStock={openStock} />,
          <Pro openPrice={openPrice} openKakao={openKakao} />,
        ]}
      />
      {modal?.kind === "price" && <PriceModal onClose={close} />}
      {modal?.kind === "kakao" && <KakaoModal onClose={close} onDone={() => { close(); setToast("신청 완료 — 내일 06:30부터 카톡으로 받아요"); }} />}
      {modal?.kind === "stock" && <StockModal stock={modal.stock} onClose={close} />}
      {modal?.kind === "news" && <NewsModal news={modal.news} onClose={close} />}
      {toast && <div className="toast show">{toast}</div>}
      <a href="/finder" className="finder-fab">탐색기 →</a>
    </>
  );
}
