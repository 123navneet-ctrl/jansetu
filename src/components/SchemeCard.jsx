import { Heart, CalendarClock, ExternalLink, Sparkles, MapPin } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function SchemeCard({ scheme, saved, onSave, onOpen, badge }) {
  if (!scheme) return null;

  const fitScore = scheme.fit?.score ?? scheme.match ?? 75;
  const cardBadge = badge || (fitScore >= 85 ? 'High Fit' : scheme.match >= 80 ? 'Popular' : 'Active');

  return (
    <article className="scheme-card-modern">
      {/* Top Header Row */}
      <div className="card-top-row">
        <CategoryIcon category={scheme.category || scheme.tag} size={22} boxed />

        <div className="card-top-badges">
          {cardBadge && (
            <span className={`badge-pill ${cardBadge === 'High Fit' ? 'badge-accent' : 'badge-soft'}`}>
              <Sparkles size={13} strokeWidth={2} />
              {cardBadge}
            </span>
          )}
          <button
            type="button"
            className={`card-heart-btn ${saved ? 'active' : ''}`}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${scheme.name} from saved schemes` : `Save ${scheme.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSave?.();
            }}
            title={saved ? 'Remove from saved' : 'Save scheme'}
          >
            <Heart size={18} strokeWidth={1.8} fill={saved ? '#E11D48' : 'none'} color={saved ? '#E11D48' : 'currentColor'} />
          </button>
        </div>
      </div>

      {/* Meta location & category line */}
      <div className="card-meta-line">
        <span className="card-cat-name">{scheme.category}</span>
        <span className="card-meta-divider">•</span>
        <span className="card-state-pill">
          <MapPin size={13} /> {scheme.state || 'All India'}
        </span>
      </div>

      {/* Scheme Title & Description */}
      <h3 className="card-title" onClick={onOpen} role="button" tabIndex={0}>
        {scheme.name}
      </h3>
      <p className="card-desc">{scheme.description}</p>

      {/* Fit & Deadline row */}
      <div className="card-stats-row">
        <div className="card-fit-chip">
          <span className="fit-indicator-dot" />
          <span>{fitScore}% estimated fit</span>
        </div>
        {scheme.deadline && (
          <div className="card-deadline-chip" title="Application deadline">
            <CalendarClock size={14} />
            <span>{scheme.deadline}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card-actions-grid">
        <button type="button" className="card-btn-outline" onClick={onOpen}>
          View Details
        </button>
        <a
          href={scheme.applicationLink || 'https://www.myscheme.gov.in'}
          target="_blank"
          rel="noopener noreferrer"
          className="card-btn-primary"
          style={{ textDecoration: 'none' }}
        >
          <span>Apply</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
