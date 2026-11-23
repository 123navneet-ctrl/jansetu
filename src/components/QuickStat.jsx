import { ArrowUpRight } from 'lucide-react';

export default function QuickStat({ icon, title, number, color, onClick }) {
  return (
    <button className="quick-stat" onClick={onClick}>
      <span className={`quick-icon ${color}`}>{icon}</span>
      <span>
        <small>{title}</small>
        <b>{number}</b>
        <span className="quick-stat-link">
          View all <ArrowUpRight size={13} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
        </span>
      </span>
    </button>
  );
}
