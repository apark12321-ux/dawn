import { useRef } from "react";
import { Briefing, Stock } from "../../lib/types";
import { useActive } from "../Deck";
import { CountUp, Spark, LockIcon } from "../ui";

export function Stocks({ b, trialActive, openPrice, openStock }: {
  b: Briefing; trialActive: boolean; openPrice: () => void; openStock: (s: Stock) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  const five = b.stocks.find((s) => s.rank === 5)!;

  return (
    <div ref={ref}>
      <div className="shead"><span className="ix">05</span><h2>거래량 상위 종목</h2><span className="of">탭하면 상세</span></div>
      <div className="scontent">
        <div className="rank rise d1">
          {b.stocks.map((s) => {
            const locked = s.pro && !trialActive;
            if (locked) return (
              <div className="rk lock" key={s.rank} onClick={openPrice}>
                <span className="no">{s.rank}</span>
                <div className="body"><div className="nm" style={{ width: 50 + s.rank * 2 + "%" }} /><div className="meta" style={{ width: 44 - s.rank * 2 + "%" }} /></div>
                <LockIcon cls="lk2" />
              </div>
            );
            return (
              <div className="rk open" key={s.rank} onClick={() => openStock(s)}>
                <span className="no">{s.rank}</span>
                <div className="body"><div className="nm-r">{s.name}{s.rank === 5 && <span className="pv-badge">탭하면 상세</span>}</div><div className="meta-r">{s.note}</div></div>
                <Spark pts={s.spark} cls="mini" />
                <div className="chg-r"><CountUp value={s.chg} dec={1} pre="▲" suf="%" run={active} /></div>
              </div>
            );
          })}
        </div>
        <div className="vp rise d2">
          <div className="vh"><span className="vt">{five.name} · 거래량 프로파일</span><span className="vs">매물대</span></div>
          {five.profile.map((p) => (
            <div className={"vpr" + (p.poc ? " poc" : "")} key={p.price}>
              <span className="pr">{p.price.toLocaleString("en-US")}</span>
              <div className="trk"><i style={{ width: active ? p.vol + "%" : 0 }} /></div>
              <span className="pt">{p.poc ? "POC" : ""}</span>
            </div>
          ))}
        </div>
        {!trialActive && (
          <div className="vault rise d3">
            <div className="vz">{[34, 48, 58, 72, 86, 96, 100, 92, 80, 68, 76, 60, 50, 42, 36, 30].map((h, i) => <div className="col" key={i} style={{ height: h + "%", animationDelay: (i * 0.08) + "s" }} />)}</div>
            <div className="frost" />
            <div className="vface">
              <div className="vlock"><LockIcon /></div>
              <div><div className="vk">PRO ACCESS</div><div className="vt">1~4위 · 전 종목 매물대</div></div>
              <button className="vbtn" onClick={openPrice}>열어보기 <span>→</span></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
