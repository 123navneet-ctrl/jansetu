import { Sparkles } from 'lucide-react';

export default function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="modern-page-header">
      <div className="page-header-text">
        {eyebrow && (
          <div className="page-header-eyebrow">
            <Sparkles size={13} strokeWidth={2} />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
