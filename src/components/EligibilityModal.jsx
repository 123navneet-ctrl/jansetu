import { useEffect } from 'react';
import { X, ShieldAlert, ExternalLink, CheckCircle2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function EligibilityModal({ scheme, eligibility, profileName, onClose }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fitScore = scheme.fit?.score ?? scheme.match ?? 60;

  return (
    <div className="modal-backdrop-modern" onClick={onClose} role="presentation">
      <div
        className="eligibility-modal-modern"
        role="dialog"
        aria-modal="true"
        aria-labelledby="elig-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" aria-label="Close" onClick={onClose}>
          <X size={20} strokeWidth={2} />
        </button>

        <div className="elig-modal-header-modern">
          <CategoryIcon category={scheme.category} size={26} boxed />
          <div>
            <h2 id="elig-modal-title">Indicative Eligibility Check</h2>
            <p className="elig-scheme-sub">{scheme.name}</p>
          </div>
        </div>

        <div className="elig-disclaimer-box">
          <ShieldAlert size={18} className="disclaimer-icon" />
          <span>
            This is an indicative check based on your profile inputs. It does not constitute an official eligibility determination. Always verify with official authorities.
          </span>
        </div>

        <div className="elig-profile-card">
          <h3>Your Profile Factors</h3>
          <div className="elig-profile-grid-modern">
            <div className="elig-pill-item">
              <span className="pill-k">Name:</span>
              <strong className="pill-v">{profileName || 'Not provided'}</strong>
            </div>
            <div className="elig-pill-item">
              <span className="pill-k">Age:</span>
              <strong className="pill-v">{eligibility.age ? `${eligibility.age} yrs` : 'Not provided'}</strong>
            </div>
            <div className="elig-pill-item">
              <span className="pill-k">State:</span>
              <strong className="pill-v">{eligibility.state || 'Not provided'}</strong>
            </div>
            <div className="elig-pill-item">
              <span className="pill-k">Occupation:</span>
              <strong className="pill-v">{eligibility.occupation || 'Not provided'}</strong>
            </div>
            <div className="elig-pill-item">
              <span className="pill-k">Annual Income:</span>
              <strong className="pill-v">{eligibility.income ? `₹${Number(eligibility.income).toLocaleString('en-IN')}` : 'Not provided'}</strong>
            </div>
          </div>
        </div>

        <div className="elig-criteria-card">
          <h3>Official Scheme Criteria</h3>
          <p className="elig-criteria-desc">{scheme.eligibility}</p>
        </div>

        <div className="elig-score-banner">
          <div className={`elig-score-circle ${fitScore >= 70 ? 'high' : fitScore >= 50 ? 'medium' : 'low'}`}>
            <span>{fitScore}%</span>
            <small>Fit</small>
          </div>
          <div className="elig-score-feedback">
            <p className="score-headline">
              {fitScore >= 70
                ? 'Strong potential relevance to your recorded profile.'
                : fitScore >= 50
                ? 'Moderate relevance to your criteria.'
                : 'Limited match based on available profile factors.'}
            </p>
            {scheme.fit?.reasons && scheme.fit.reasons.length > 0 && (
              <ul className="score-reasons-list">
                {scheme.fit.reasons.map((r, i) => (
                  <li key={i}>
                    <CheckCircle2 size={14} className="reason-check" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="modal-actions-row">
          {scheme.applicationLink && (
            <a
              href={scheme.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-btn-apply"
            >
              <span>Go to Official Portal</span>
              <ExternalLink size={16} />
            </a>
          )}
          <button type="button" className="modal-btn-save" onClick={onClose}>
            Close Check
          </button>
        </div>
      </div>
    </div>
  );
}
