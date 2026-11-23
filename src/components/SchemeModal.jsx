import { useEffect } from 'react';
import { X, Heart, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function SchemeModal({ scheme, onClose, isSaved, onToggleSave }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!scheme) return null;

  return (
    <div className="modal-backdrop-modern" onClick={onClose} role="presentation">
      <div
        className="scheme-modal-modern"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheme-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          aria-label="Close scheme details"
          onClick={onClose}
        >
          <X size={20} strokeWidth={2} />
        </button>

        {/* Modal Header */}
        <div className="modal-header-section">
          <CategoryIcon category={scheme.category} size={28} boxed />
          <div className="modal-header-meta">
            <span className="modal-category-badge">
              <Sparkles size={12} strokeWidth={2} />
              {scheme.category?.toUpperCase()} • {scheme.state || 'All India'}
            </span>
            <h2 id="scheme-modal-title" className="modal-title-text">{scheme.name}</h2>
          </div>
        </div>

        <p className="modal-description-text">{scheme.description}</p>

        {/* Facts Grid */}
        <div className="modal-facts-grid">
          <div className="fact-cell">
            <small>Potential Benefit</small>
            <b>{scheme.benefit}</b>
          </div>
          <div className="fact-cell">
            <small>Application Deadline</small>
            <b>{scheme.deadline}</b>
          </div>
          <div className="fact-cell">
            <small>Jurisdiction</small>
            <b>{scheme.state}</b>
          </div>
          <div className="fact-cell">
            <small>Eligibility Highlights</small>
            <b>{scheme.eligibility}</b>
          </div>
        </div>

        {/* Advisory */}
        <div className="modal-advisory-card">
          <ShieldAlert size={18} className="advisory-icon" />
          <span>Before applying, verify current eligibility criteria, required documents, and deadlines on the relevant official government portal.</span>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions-row">
          <button
            type="button"
            className={`modal-btn-save ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(scheme.id)}
          >
            <Heart size={18} fill={isSaved ? '#E11D48' : 'none'} color={isSaved ? '#E11D48' : 'currentColor'} strokeWidth={1.8} />
            <span>{isSaved ? 'Saved to Shortlist' : 'Save Scheme'}</span>
          </button>
          <a
            href={scheme.applicationLink || 'https://www.myscheme.gov.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-btn-apply"
            style={{ textDecoration: 'none' }}
          >
            <span>Apply on Official Portal</span>
            <ExternalLink size={17} strokeWidth={2} />
          </a>
        </div>
      </div>
    </div>
  );
}
