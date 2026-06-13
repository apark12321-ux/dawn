import { useEffect, useRef, useState } from "react";
import { Briefing, Stock, NewsItem } from "./lib/types";
import { Live } from "./hooks/useLive";

const fmtDate = () => {
  const d = new Date(); const wd = ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${wd}`;
};
const chgCls = (n: number) => (n >= 0 ? "u" : "d");
const chgTxt = (n: number) => (n >= 0 ? "▲" : "▼") + Math.abs(n).toFixed(2) + "%";
const lvl = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Spark({ data, cls }: { data: number[]; cls: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${34 - ((v - min) / r) * 30 - 2}`).join(" ");
  return <svg className="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline className={cls} points={pts} /></svg>;
}

export default function Web({ b, live, openStock, openNews }: {
  b: Briefing; live: Live;
  openPrice: () => void; openKakao: () => void; openStock: (s: Stock) => void; openNews: (n: NewsItem) => void;
}) {
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const [cur, setCur] = useState(0);
  const busy = useRef(false);
  const cvRef = useRef<HTMLCanvasElement | null>(null);

  const PAGES = 4;
  const go = (n: number) => {
    if (busy.current) return;
    n = Math.max(0, Math.min(PAGES - 1, n));
    if (n === cur) return;
    busy.current = true;
    const fwd = n > cur;
    const ps = pageRefs.current;
    if (fwd) {
      const p = ps[cur]; if (p) { p.classList.add("turning"); requestAnimationFrame(() => { p.classList.remove("stack"); p.classList.add("turned"); }); setTimeout(() => p.classList.remove("turning"), 820); }
    } else {
      const p = ps[n]; if (p) { p.classList.add("turning"); p.classList.remove("turned"); requestAnimationFrame(() => p.classList.add("stack")); setTimeout(() => p.classList.remove("turning"), 820); }
    }
    setCur(n);
    setTimeout(() => (busy.current = false), 840);
  };
  const goRef = useRef(go); goRef.current = go;

  useEffect(() => {
    const ps = pageRefs.current;
    ps.forEach((p, i) => { if (!p) return; p.style.zIndex = String(PAGES - i); if (i > 0) p.classList.add("stack"); });
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight") goRef.current(curRef.current + 1); if (e.key === "ArrowLeft") goRef.current(curRef.current - 1); };
    let wlock = 0;
    const wheel = (e: WheelEvent) => { const t = Date.now(); if (t - wlock < 950) return; if (Math.abs(e.deltaY) < 18) return; wlock = t; goRef.current(curRef.current + (e.deltaY > 0 ? 1 : -1)); };
    window.addEventListener("keydown", key); window.addEventListener("wheel", wheel, { passive: true });
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("wheel", wheel); };
  }, []);
  const curRef = useRef(cur); curRef.current = cur;

  // ---- landing canvas: synthwave dawn ----
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return; const cx = cv.getContext("2d"); if (!cx) return;
    let W = 0, H = 0, raf = 0; const t0 = performance.now();
    const parts = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() + 0.3, s: Math.random() * 1.6 + 0.4 }));
    const resize = () => { const d = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const frame = (now: number) => {
      const t = (now - t0) / 1000; cx.clearRect(0, 0, W, H);
      const hy = H * 0.66, sunR = Math.min(W, H) * 0.26, sx = W / 2, rise = Math.min(1, t / 2.4), sy = hy + (1 - rise) * sunR * 1.4;
      const g = cx.createRadialGradient(sx, sy, 0, sx, sy, sunR * 2.4);
      g.addColorStop(0, `rgba(255,190,120,${0.55 * rise})`); g.addColorStop(0.4, `rgba(255,120,150,${0.32 * rise})`); g.addColorStop(1, "rgba(120,80,200,0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, sunR * 2.4, 0, 7); cx.fill();
      cx.save(); cx.beginPath(); cx.arc(sx, sy, sunR, 0, 7); cx.clip();
      const sg = cx.createLinearGradient(0, sy - sunR, 0, sy + sunR); sg.addColorStop(0, "#FFD79A"); sg.addColorStop(0.5, "#FF8FB0"); sg.addColorStop(1, "#B86CD8");
      cx.fillStyle = sg; cx.fillRect(sx - sunR, sy - sunR, sunR * 2, sunR * 2);
      for (let i = 0; i < 13; i++) { const yy = sy - sunR * 0.1 + i * (sunR * 2 / 13); cx.fillStyle = "rgba(5,7,12,.92)"; cx.fillRect(sx - sunR, yy, sunR * 2, Math.max(0.6, 2.6 - i * 0.14)); }
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

  const kr = b.krIndices || [], us = b.usIndices || [], news = b.news || [], stocks = b.stocks || [], sectors = b.sectors || [];
  const temp = b.temp || live.risk || 0;
  const tickItems: [string, string, number][] = [
    ...kr.map(k => [k.name, lvl(k.level), k.chg] as [string, string, number]),
    ...us.map(u => [u.name, u.note || "", u.chg] as [string, string, number]),
    ["USD/KRW", live.krw, 0], ["BTC", live.btc, live.btcChg ?? 0],
  ];
  const setRef = (i: number) => (el: HTMLElement | null) => { pageRefs.current[i] = el; };

  return (
    <>
      <div className="hud">
        <span className="brand">DAWN</span><span className="kr">여명</span>
        <span className="date">{fmtDate()}</span>
        <span className="clk"><i style={{ opacity: live.ok ? 1 : 0.3 }} />{live.clock}</span>
      </div>

      <div id="dawnbook">
        {/* PAGE 0 — LANDING */}
        <section className="page stack" ref={setRef(0)}>
          <div className="sheen" />
          <canvas ref={cvRef} className="lcv" />
          <div className="hero-c">
            <div className="hero-tag">PRE-MARKET INTELLIGENCE</div>
            <h1 className="hero-title">DAWN</h1>
            <div className="hero-sub">여 명</div>
            <div className="hero-line">장이 열리기 전, 가장 먼저 시장을 읽다.</div>
            <button className="hero-cta" onClick={() => go(1)}>진입 &nbsp;→</button>
          </div>
          <div className="hero-hint">페이지를 <b>넘겨</b> 브리핑으로 · 클릭 / → / 스크롤</div>
          <div className="tickwrap"><div className="tickrow">
            {[...tickItems, ...tickItems].map(([n, v, c], i) => (
              <span className="tk" key={i}><b>{n}</b> {v} {c !== 0 && <span className={chgCls(c)}>{(c >= 0 ? "+" : "") + c.toFixed(2)}%</span>}</span>
            ))}
          </div></div>
        </section>

        {/* PAGE 1 — 글로벌 */}
        <section className="page" ref={setRef(1)}>
          <div className="sheen" />
          <div className="dp">
            <div className="dp-h"><span className="dp-no">01</span><span className="dp-t">글로벌 마켓</span><span className="dp-of">밤사이 美 종가 · 실시간</span></div>
            <div className="dp-grid">
              <div className="panel c4"><div className="pl"><span className="lvdot" />국내 지수</div>
                {kr.length ? kr.map(k => (<div className="ixr" key={k.name}><span className="n">{k.name}</span><span className="v">{lvl(k.level)}</span><span className={"c " + chgCls(k.chg)}>{chgTxt(k.chg)}</span></div>)) : <div className="empty">연동 중…</div>}
              </div>
              <div className="panel c4"><div className="pl">美 지수</div>
                {us.length ? us.map(u => (<div className="ixr" key={u.name}><span className="n">{u.name}</span><span className="v">{u.note}</span><span className={"c " + chgCls(u.chg)}>{chgTxt(u.chg)}</span></div>)) : <div className="empty">연동 중…</div>}
              </div>
              <div className="panel c4"><div className="pl"><span className="lvdot" />환율</div>
                <div className="ixr"><span className="n">달러/원</span><span className="v">{live.krw}</span><span className="c">{live.fxLive ? "실시간" : "—"}</span></div>
                <div className="ixr"><span className="n">엔/100</span><span className="v">{live.jpy}</span><span className="c" /></div>
                <div className="ixr"><span className="n">유로/달러</span><span className="v">{live.eur}</span><span className="c" /></div>
                <div className="ixr"><span className="n">위안/원</span><span className="v">{live.cny}</span><span className="c" /></div>
              </div>
              <div className="panel c6"><div className="pl">美 지수 추이</div>
                {us[0]?.spark ? <Spark data={us[0].spark} cls={chgCls(us[0].chg)} /> : <div className="empty">—</div>}
              </div>
              <div className="panel c3"><div className="pl"><span className="lvdot" />비트코인</div>
                <div className="big"><span className="v" style={{ fontSize: 22 }}>{live.btc}</span>{live.btcChg != null && <span className={"c " + chgCls(live.btcChg)}>{chgTxt(live.btcChg)}</span>}</div>
                <div className="ixr"><span className="n">이더리움</span><span className="v">{live.eth}</span>{live.ethChg != null && <span className={"c " + chgCls(live.ethChg)}>{chgTxt(live.ethChg)}</span>}</div>
              </div>
              <div className="panel c3"><div className="pl">위험 선호</div>
                <div className="big"><span className="v">{temp}</span><span className="c" style={{ color: "var(--gold)" }}>{temp >= 65 ? "탐욕" : temp <= 35 ? "공포" : "중립"}</span></div>
                <div className="seg">{Array.from({ length: 10 }).map((_, i) => <i key={i} className={i < Math.round(temp / 10) ? "on" : ""} />)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 2 — 시장온도·뉴스 */}
        <section className="page" ref={setRef(2)}>
          <div className="sheen" />
          <div className="dp">
            <div className="dp-h"><span className="dp-no">02</span><span className="dp-t">시장 온도 · 뉴스</span><span className="dp-of">AI 실시간 수집</span></div>
            <div className="dp-grid">
              <div className="panel c5"><div className="pl">시장 온도 · 위험선호</div>
                <div className="gauge"><div className="ring" style={{ ["--p" as any]: temp }}><b>{temp}</b></div>
                  <div className="gx"><div className="gt">{temp >= 65 ? "위험선호 우위" : temp <= 35 ? "위험회피 우위" : "중립"}</div><div className="gd">{b.tldr ? b.tldr.slice(0, 70) + "…" : "데이터 연동 중"}</div></div></div>
                <div className="seg" style={{ marginTop: 14 }}>{Array.from({ length: 10 }).map((_, i) => <i key={i} className={i < Math.round(temp / 10) ? "on" : ""} />)}</div>
              </div>
              <div className="panel c7"><div className="pl"><span className="lvdot" />오늘의 한 줄</div>
                <p className="tldrp">{b.tldr || "밤사이 글로벌 지표를 수집하고 있습니다…"}</p>
              </div>
              <div className="panel c7"><div className="pl">실시간 뉴스</div>
                <div className="nw">
                  {news.length ? news.slice(0, 5).map(n => (
                    <div className="n" key={n.id} onClick={() => openNews(n)} style={{ cursor: "pointer" }}>
                      <span className="dotn" /><div><div className="tt">{n.title}</div><div className="mt">{n.source} · {n.ago}</div></div>
                    </div>
                  )) : <div className="empty">뉴스 연동 중…</div>}
                </div>
              </div>
              <div className="panel c5"><div className="pl">전략 시나리오</div>
                <div className="strat">
                  <div className="s"><span className="b up">강세</span><p>{b.strategy?.up || "—"}</p></div>
                  <div className="s"><span className="b ob">관찰</span><p>{b.strategy?.ob || "—"}</p></div>
                  <div className="s"><span className="b dn">주의</span><p>{b.strategy?.dn || "—"}</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 3 — 주목주·수급 */}
        <section className="page" ref={setRef(3)}>
          <div className="sheen" />
          <div className="dp">
            <div className="dp-h"><span className="dp-no">03</span><span className="dp-t">오늘의 주목주 · 수급</span><span className="dp-of">거래대금 상위</span></div>
            <div className="dp-grid">
              <div className="panel c7"><div className="pl"><span className="lvdot" />거래대금 상위</div>
                <div className="rk">
                  {stocks.length ? stocks.slice(0, 6).map(s => (
                    <div className="r" key={s.rank} onClick={() => openStock(s)} style={{ cursor: "pointer" }}>
                      <span className="no">{s.rank}</span><div><div className="nm">{s.name}</div><div className="sub">{s.market} · {s.code}</div></div>
                      <span className="vol">{s.turnover}</span><span className={"pc " + chgCls(s.chg)}>{chgTxt(s.chg)}</span>
                    </div>
                  )) : <div className="empty">종목 데이터 연동 중…</div>}
                </div>
              </div>
              <div className="panel c5"><div className="pl">섹터 자금 흐름</div>
                {sectors.length ? sectors.slice(0, 6).map(s => (<div className="ixr" key={s.name}><span className="n">{s.name}</span><span className={"c " + chgCls(s.chg)}>{chgTxt(s.chg)}</span></div>)) : <div className="empty">연동 중…</div>}
              </div>
              <div className="panel c12" style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <div className="pl" style={{ margin: 0 }}>안내</div>
                <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}><b style={{ color: "var(--cyan)" }}>투자 참고용 정보입니다.</b> 제공되는 종목·지표·뉴스는 정보 제공 목적이며, 최종 투자 판단과 책임은 본인에게 있습니다.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={"bk-nav" + (cur > 0 ? " show" : "")}>
        <div className="arw" onClick={() => go(cur - 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg></div>
        <div className="dots">{Array.from({ length: PAGES }).map((_, i) => <span key={i} className={"dt" + (i === cur ? " on" : "")} onClick={() => go(i)} />)}</div>
        <div className="arw" onClick={() => go(cur + 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg></div>
      </div>
    </>
  );
}
