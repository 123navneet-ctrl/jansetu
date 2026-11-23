import { FileQuestion, ArrowRight } from 'lucide-react';

export default function Empty({ title, text, action, onAction, icon: Icon = FileQuestion }) {
  return (
    <div className="modern-empty-state">
      <div className="empty-icon-wrap">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{text}</p>
      {action && (
        <button className="empty-action-btn" onClick={onAction}>
          <span>{action}</span>
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
