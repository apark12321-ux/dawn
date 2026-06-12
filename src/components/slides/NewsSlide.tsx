import { Briefing, NewsItem } from "../../lib/types";
import { Gate, LockIcon } from "../ui";

export function NewsSlide({ b, trialActive, openPrice, openNews }: {
  b: Briefing; trialActive: boolean; openPrice: () => void; openNews: (n: NewsItem) => void;
}) {
  return (
    <div className="swrap">
      <div className="shead"><span className="ix">03</span><h2>AI 뉴스 · 전략</h2><span className="of">검색 자동 수집</span></div>
      <div className="scontent">
        <div className="news rise d1">
          {b.news.map((n) => (
            <div className="nr" key={n.id} onClick={() => openNews(n)}>
              <div><div className="nt">{n.title}</div><div className="nm"><span>{n.source}</span><span>·</span><span>{n.ago}</span></div></div>
              <span className={"ntag " + n.tag}>{n.tagText}</span>
            </div>
          ))}
        </div>
        <div className="strat rise d2">
          <div className="pt-h">오늘의 전략 · 시나리오</div>
          <div className="sl"><span className="sb up">강세</span><div>{b.strategy.up}</div></div>
          <div className="sl"><span className="sb dn">약세</span><div>{b.strategy.dn}</div></div>
          <div className="sl"><span className="sb ob">관찰</span><div>{b.strategy.ob}</div></div>
        </div>
        <Gate active={trialActive} onUnlock={openPrice}
          teaser={<div className="plock"><LockIcon cls="pi" /><span className="pl-t">내 관심종목 뉴스</span><span className="pl-v">●●전자 신규계약 · ●●바이오 임상 · ●●머티</span><span className="pl-go">PRO →</span></div>}>
          <div className="news rise d3" style={{ marginTop: 11 }}>
            {b.watchNews.map((n) => (
              <div className="nr" key={n.id} onClick={() => openNews(n)}>
                <div><div className="nt">{n.title}</div><div className="nm"><span>{n.source}</span><span>·</span><span>{n.ago}</span></div></div>
                <span className={"ntag " + n.tag}>{n.tagText}</span>
              </div>
            ))}
          </div>
        </Gate>
      </div>
    </div>
  );
}
