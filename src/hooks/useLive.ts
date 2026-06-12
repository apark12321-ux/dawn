import { useEffect, useRef, useState } from "react";
import { fetchFX, fetchBTC } from "../lib/api";

export interface Live {
  clock: string; ago: number; ok: boolean;
  fx: string; fxLive: boolean; btc: string; btcChg: number | null; btcLive: boolean; risk: number;
}
export function useLive(): Live {
  const [s, setS] = useState<Live>({
    clock: "--:--:--", ago: 0, ok: false, fx: "1,440원", fxLive: false, btc: "···", btcChg: null, btcLive: false, risk: 72,
  });
  const last = useRef(Date.now());
  useEffect(() => {
    const tick = setInterval(() => setS((p) => ({ ...p, clock: new Date().toTimeString().slice(0, 8), ago: Math.floor((Date.now() - last.current) / 1000) })), 1000);
    async function poll() {
      const [krw, btc] = await Promise.all([fetchFX(), fetchBTC()]);
      setS((p) => {
        const n = { ...p };
        if (krw) { n.fx = Math.round(krw).toLocaleString("en-US") + "원"; n.fxLive = true; n.ok = true; last.current = Date.now(); }
        if (btc) { n.btc = "$" + Math.round(btc.price).toLocaleString("en-US"); n.btcChg = btc.chg; n.btcLive = true; n.ok = true; last.current = Date.now(); n.risk = Math.max(8, Math.min(95, Math.round(60 + btc.chg * 2.6))); }
        return n;
      });
    }
    poll();
    const iv = setInterval(poll, 15000);
    return () => { clearInterval(tick); clearInterval(iv); };
  }, []);
  return s;
}
