import { useRef } from "react";
import { Briefing } from "../../lib/types";
import { Live } from "../../hooks/useLive";
import { useActive } from "../Deck";
import { CountUp, Spark, Gate, LockIcon } from "../ui";

function cryptoSub(chg: number | null) {
  if (chg == null) return { t: "불러오는 중", c: "var(--muted)" };
  return { t: (chg >= 0 ? "▲" : "▼") + Math.abs(chg).toFixed(2) + "% (24h)", c: chg >= 0 ? "var(--up)" : "var(--down)" };
}

export function GlobalSlide({ b, live, trialActive, openPrice }: { b: Briefing; live: Live; trialActive: boolean; openPrice: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  const bt = cryptoSub(live.btcChg), et = cryptoSub(live.ethChg);

  return (
    <div ref={ref}>
      <div className="shead"><span className="ix">02</span><h2>실시간 · 글로벌</h2><span className="of">美 종가 6/11</span></div>
      <div className="scontent">
        {/* 美 지수 — 한국 새벽엔 장 마감 → 종가 */}
        <div className="idx">
          {b.usIndices.map((x, i) => (
            <div className={"card rise d" + (i + 1) + (i === 0 ? " lead" : "")} key={x.name}>
              <div className="name">{x.name}</div>
              <div className="chg" style={{ color: x.chg >= 0 ? "var(--up)" : "var(--down)" }}><CountUp value={Math.abs(x.chg)} dec={2} pre={x.chg >= 0 ? "▲" : "▼"} suf="%" run={active} /></div>
              <div className="lv">{x.note}</div>
              <Spark pts={x.spark} />
            </div>
          ))}
        </div>

        {/* 24시간 실시간 — 환율·암호화폐만 */}
        <div className="live-h rise d3"><span>24시간 실시간</span><span className="lmini"><i />{live.ok ? "LIVE" : "샘플"} · 갱신 {live.ago}초 전</span></div>
        <div className="live4 rise d3">
          <div className="livecard"><div className="lk"><i />원/달러</div><div className="lv">{live.krw}</div><div className="ld" style={{ color: live.fxLive ? "var(--cyan)" : "var(--muted)" }}>{live.fxLive ? "실시간" : "샘플"}</div></div>
          <div className="livecard"><div className="lk"><i />엔/원 (100)</div><div className="lv">{live.jpy}</div><div className="ld" style={{ color: live.fxLive ? "var(--cyan)" : "var(--muted)" }}>{live.fxLive ? "실시간" : "샘플"}</div></div>
          <div className="livecard"><div className="lk"><i />BTC</div><div className="lv">{live.btc}</div><div className="ld" style={{ color: bt.c }}>{bt.t}</div></div>
          <div className="livecard"><div className="lk"><i />ETH</div><div className="lv">{live.eth}</div><div className="ld" style={{ color: et.c }}>{et.t}</div></div>
        </div>

        {/* 닫힌 시장 지표 — 참고(전일/종가) */}
        <div className="refline rise d4">
          <span className="rk2">참고 · 전일</span>
          {b.futures.map((f, i) => (
            <span key={f.k}>{i > 0 ? " · " : ""}<b>{f.k}</b> {f.v}</span>
          ))}
          <div className="ref-note">야간선물·금리·VIX 실시간은 키움/데이터 연동 시 활성화</div>
        </div>

        <Gate active={trialActive} onUnlock={openPrice}
          teaser={<div className="plock"><LockIcon cls="pi" /><span className="pl-t">보유 종목 영향도</span><span className="pl-v">삼성전자 ▲2.1 · 하이닉스 ▲3.0 · 한미 ▲4</span><span className="pl-go">PRO →</span></div>}>
          <div className="impact rise d5">
            <div className="pt-h">보유 종목 밤사이 영향도</div>
            <div className="imp-row">
              {b.holdingsImpact.map((h) => (
                <div className="imp" key={h.name}><span className="in">{h.name}</span><span className="iv" style={{ color: h.chg >= 0 ? "var(--up)" : "var(--down)" }}>{h.chg >= 0 ? "▲" : "▼"}{Math.abs(h.chg).toFixed(1)}%</span></div>
              ))}
            </div>
          </div>
        </Gate>
      </div>
    </div>
  );
}
