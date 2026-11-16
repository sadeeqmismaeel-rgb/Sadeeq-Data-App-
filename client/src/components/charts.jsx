import { shortDay } from '../lib/format.js';

export function BarChart({ series = [], tone = '' }) {
  if (!series.length) {
    return <div className="empty small">No activity in this period yet.</div>;
  }
  const max = Math.max(1, ...series.map((point) => point.count));
  return (
    <div>
      <div className="chart">
        {series.map((point) => (
          <div className="chart-bar-wrap" key={point.date}>
            <div
              className={`chart-bar ${tone}`.trim()}
              style={{ height: `${Math.max(3, (point.count / max) * 100)}%` }}
              title={`${shortDay(point.date)}: ${point.count}`}
            />
            <span className="chart-label">{shortDay(point.date).split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Breakdown({ items = [] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="breakdown">
      {items.map((item) => (
        <div className="breakdown-row" key={item.key}>
          <div className="breakdown-top">
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </div>
          <div className="breakdown-track">
            <div
              className="breakdown-fill"
              style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
