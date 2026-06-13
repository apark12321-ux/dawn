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

export default function Web({ b, live, openStock, openNews }: {
  b: Briefing; live: Live;
  openPrice: () => void; openKakao: () => void; openStock: (s: Stock) => void; openNews: (n: NewsItem) => void;
}) {
  const [cur, setCur] = useState(0);
  const busy = useRef(false);
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const [markets, setMarkets] = useState<MItem[]>([]);
  const [nstocks, setNstocks] = useState<NStock[]>([]);
  const [asof, setAsof] = useState("");
  const PAGES = 12;
  const curRef = useRef(cur); curRef.current = cur;

  useEffect(() => {
    fetch("/api/markets").then(r => r.json()).then(d => { setMarkets(d.data || []); if (d.asof) setAsof(d.asof); }).catch(() => {});
    fetch("/api/naver-stocks?limit=20").then(r => r.json()).then(d => setNstocks(d.stocks || [])).catch(() => {});
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

  const grp = (g: string) => markets.filter(m => m.group === g);
  const kr = grp("국내").length ? grp("국내") : (b.krIndices || []).map(k => ({ name: k.name, group: "국내", unit: "", level: k.level, chg: k.chg } as MItem));
  const us = grp("미국"), asia = grp("아시아"), eu = grp("유럽"), rate = grp("금리"), comm = grp("원자재"), ind = grp("지표");
  const news = b.news || [];
  const temp = b.temp || live.risk || 50;
  const asofTxt = asof ? new Date(asof).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) + " 기준" : "실시간";

  const ixrows = (items: MItem[]) => items.length
    ? items.map(m => <div className="ixr" key={m.name}><span className="n">{m.name}</span><span className="v">{fmtLevel(m)}</span><span className={"c " + cc(m.chg)}>{ar(m.chg)}</span></div>)
    : <div className="empty">연동 중…</div>;

  const openNStock = (s: NStock) => openStock({ rank: s.rank, name: s.name, market: s.market, code: s.code, price: s.price, chg: s.chg, turnover: s.turnover, volume: s.volume, pos52: "", note: "", reason: `거래대금 ${s.turnover} · 시총 ${s.marketcap}`, spark: [], pro: false, profile: [], forecast: { trend: "", up: "", down: "" } } as Stock);

  return (
    <>
      <div className="hud">
        <span className="brand">DAWN</span><span className="kr">여명 · v12</span>
        <span className="date">{fmtDate()}</span>
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
          <div className="hero-hint">페이지를 <b>넘겨</b> 12개 브리핑으로 · 클릭 / → / 스크롤</div>
          <div className="tickwrap"><div className="tickrow">
            {[...kr, ...us].map((m, i) => (<span className="tk" key={i}><b>{m.name}</b> {comma(m.level)} {m.chg !== 0 && <span className={cc(m.chg)}>{(m.chg >= 0 ? "+" : "") + m.chg.toFixed(2)}%</span>}</span>))}
            <span className="tk"><b>USD/KRW</b> {live.krw}</span>
            <span className="tk"><b>BTC</b> {live.btc} {live.btcChg != null && <span className={cc(live.btcChg)}>{(live.btcChg >= 0 ? "+" : "") + live.btcChg.toFixed(2)}%</span>}</span>
          </div></div>
        </section>

        <Page no="01" title="글로벌 마켓" of={`밤사이 美 종가 · ${asofTxt}`} cls={pcls(1)} style={pst(1)}>
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

        <Page no="02" title="매크로 지표" of={`금리·원자재·환율·코인 · ${asofTxt}`} cls={pcls(2)} style={pst(2)}>
          <div className="panel c4"><div className="pl">금리 · 국채</div>{ixrows(rate)}</div>
          <div className="panel c4"><div className="pl">원자재</div>{ixrows(comm)}</div>
          <div className="panel c4"><div className="pl">변동성 · 달러</div>{ixrows(ind)}</div>
          <div className="panel c4"><div className="pl"><span className="lvdot" />비트코인</div><div className="big"><span className="v" style={{ fontSize: 21 }}>{live.btc}</span>{live.btcChg != null && <span className={"c " + cc(live.btcChg)}>{ar(live.btcChg)}</span>}</div><div className="ixr"><span className="n">이더리움</span><span className="v">{live.eth}</span>{live.ethChg != null && <span className={"c " + cc(live.ethChg)}>{ar(live.ethChg)}</span>}</div></div>
          <div className="panel c8"><div className="pl">오늘의 한 줄</div><p className="tldrp">{b.tldr || "글로벌 지표를 수집하고 있습니다…"}</p></div>
        </Page>

        <Page no="03" title="외국인·기관 수급" of="매매동향" cls={pcls(3)} style={pst(3)}>
          <div className="panel c12"><Soon txt="투자자별 수급 데이터 연동 예정 (네이버 증권)" /></div>
        </Page>

        <Page no="04" title="거래대금 상위" of="실시간 · 관찰용" cls={pcls(4)} style={pst(4)}>
          <div className="panel c12 scroll"><div className="pl"><span className="lvdot" />거래대금 상위 종목 <span className="rt">{asofTxt}</span></div>
            {nstocks.length ? (
              <table className="tbl"><thead><tr><th>#</th><th>종목</th><th>현재가</th><th>등락</th><th>거래대금</th><th>거래량</th><th>시총</th></tr></thead>
                <tbody>{nstocks.map(s => (
                  <tr key={s.code} onClick={() => openNStock(s)} style={{ cursor: "pointer" }}>
                    <td className="no">{s.rank}</td><td className="nm">{s.name}<div className="sub">{s.market} {s.code}</div></td>
                    <td>{comma(s.price)}</td><td className={cc(s.chg)}>{ar(s.chg)}</td><td>{s.turnover}</td><td>{s.volume}</td><td>{s.marketcap}</td>
                  </tr>))}</tbody></table>
            ) : <Soon txt="종목 시세 연동 중… (네이버 증권)" />}
          </div>
        </Page>

        <Page no="05" title="섹터 · 테마" of="자금 흐름" cls={pcls(5)} style={pst(5)}>
          <div className="panel c12">{(b.sectors && b.sectors.length) ? b.sectors.map(s => <div className="ixr" key={s.name}><span className="n">{s.name}</span><span className={"c " + cc(s.chg)}>{ar(s.chg)}</span></div>) : <Soon txt="섹터·테마 데이터 연동 예정" />}</div>
        </Page>

        <Page no="06" title="AI 뉴스 · 이슈" of="실시간 수집" cls={pcls(6)} style={pst(6)}>
          <div className="panel c7 scroll"><div className="pl"><span className="lvdot" />실시간 뉴스</div>
            <div className="nw">{news.length ? news.slice(0, 6).map(n => (
              <div className="n" key={n.id} onClick={() => openNews(n)} style={{ cursor: "pointer" }}><span className="dotn" /><div><div className="tt">{n.title}</div><div className="mt">{n.source} · {n.ago}</div></div></div>
            )) : <Soon txt="뉴스 연동 중… (네이버 검색)" />}</div>
          </div>
          <div className="panel c5"><div className="pl">전략 시나리오</div><div className="strat">
            <div className="s"><span className="b up">강세</span><p>{b.strategy?.up || "—"}</p></div>
            <div className="s"><span className="b ob">관찰</span><p>{b.strategy?.ob || "—"}</p></div>
            <div className="s"><span className="b dn">주의</span><p>{b.strategy?.dn || "—"}</p></div>
          </div></div>
        </Page>

        <Page no="07" title="종목 심층 분석" of="차트·매물대·지표" cls={pcls(7)} style={pst(7)}>
          <div className="panel c12"><Soon txt="거래대금 페이지에서 종목을 탭하면 상세 분석이 열립니다" /></div>
        </Page>

        <Page no="08" title="일정 · 캘린더" of="실적·공시·지표" cls={pcls(8)} style={pst(8)}>
          <div className="panel c12"><Soon txt="실적·공시·경제지표 캘린더 연동 예정" /></div>
        </Page>

        <Page no="09" title="글로벌 야간 동향" of="美 종가 · 아시아·유럽" cls={pcls(9)} style={pst(9)}>
          <div className="panel c6"><div className="pl">美 지수</div>{ixrows(us)}</div>
          <div className="panel c6"><div className="pl">아시아 · 유럽</div>{ixrows([...asia, ...eu])}</div>
          <div className="panel c12"><div className="pl">밤사이 핵심</div><p className="tldrp">{b.tldr || "—"}</p></div>
        </Page>

        <Page no="10" title="전략 · 체크리스트" of="시나리오 · 리스크" cls={pcls(10)} style={pst(10)}>
          <div className="panel c6"><div className="pl">전략 시나리오</div><div className="strat">
            <div className="s"><span className="b up">강세</span><p>{b.strategy?.up || "—"}</p></div>
            <div className="s"><span className="b ob">관찰</span><p>{b.strategy?.ob || "—"}</p></div>
            <div className="s"><span className="b dn">주의</span><p>{b.strategy?.dn || "—"}</p></div>
          </div></div>
          <div className="panel c6"><div className="pl">안내</div><p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}><b style={{ color: "var(--cyan)" }}>투자 참고용 정보입니다.</b> 제공되는 종목·지표·뉴스는 정보 제공 목적이며, 최종 투자 판단과 책임은 본인에게 있습니다.</p></div>
        </Page>

        <Page no="11" title="탐색기 · 백테스트" of="AI 스크리너" cls={pcls(11)} style={pst(11)}>
          <div className="panel c12" style={{ alignItems: "center", justifyContent: "center" }}>
            <p className="tldrp" style={{ textAlign: "center", marginBottom: 16 }}>AI 종목 스크리너 · 매매기법 백테스트 검증</p>
            <a href="/finder" className="hero-cta" style={{ animation: "none", opacity: 1, textDecoration: "none" }}>탐색기 열기 →</a>
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
