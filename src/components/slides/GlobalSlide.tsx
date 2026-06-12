import { useRef } from "react";
import { Briefing } from "../../lib/types";
import { Live } from "../../hooks/useLive";
import { useActive } from "../Deck";
import { CountUp, Spark, Gate, LockIcon } from "../ui";

export function GlobalSlide({ b, live, trialActive, openPrice }: { b: Briefing; live: Live; trialActive: boolean; openPrice: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  return (
    <div ref={ref}>
      <div className="shead"><span className="ix">02</span><h2>실시간 · 글로벌</h2><span className="of">美 종가 6/11</span></div>
      <div className="scontent">
        <div className="idx">
          {b.usIndices.map((x, i) => (
            <div className={"card rise d" + (i + 1) + (i === 0 ? " lead" : "")} key={x.name}>
              <div className="name">{x.name}</div>
              <div className="chg"><CountUp value={x.chg} dec={2} pre="▲" suf="%" run={active} /></div>
              <div className="lv">{x.note}</div>
              <Spark pts={x.spark} />
            </div>
          ))}
        </div>
        <div className="livestrip rise d3">
          <div className="livecard"><div className="lk"><i />실시간 · 원/달러</div><div className="lv">{live.fx}</div><div className="ld" style={{ color: live.fxLive ? "var(--cyan)" : "var(--muted)" }}>{live.fxLive ? "실시간 체결" : "샘플"}</div></div>
          <div className="livecard"><div className="lk"><i />실시간 · BTC 24h</div><div className="lv">{live.btc}</div><div className="ld" style={{ color: live.btcChg == null ? "var(--muted)" : live.btcChg >= 0 ? "var(--up)" : "var(--down)" }}>{live.btcChg == null ? "불러오는 중" : (live.btcChg >= 0 ? "▲" : "▼") + Math.abs(live.btcChg).toFixed(2) + "% (24h)"}</div></div>
        </div>
        <div className="fgrid rise d4">
          {b.futures.map((f) => (
            <div className="fcell" key={f.k}><span className="fk">{f.k}</span><span className="fv" style={{ color: f.cls === "up" ? "var(--up)" : f.cls === "down" ? "var(--down)" : undefined }}>{f.v}</span></div>
          ))}
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
