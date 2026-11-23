import { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  CalendarClock,
  Sparkles,
  FileText,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import PageTitle from '../components/PageTitle';
import EligibilityModal from '../components/EligibilityModal';
import CategoryIcon from '../components/CategoryIcon';
import { useJanSetu } from '../context/JanSetuContext';

const TABS = ['Overview', 'Eligibility', 'Documents', 'How to Apply'];

export default function SchemeDetailPage({ scheme, onBack }) {
  const { saved, toggleSave, eligibility, profileName } = useJanSetu();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  if (!scheme) {
    return (
      <section className="page-content">
        <div className="modern-empty-state">
          <p>No scheme selected. Please go back and select a scheme.</p>
          <button className="card-btn-outline" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>
      </section>
    );
  }

  const isSaved = saved.includes(scheme.id);
  const fitScore = scheme.fit?.score ?? scheme.match ?? 60;

  return (
    <section className="page-content scheme-detail-page">
      {/* Back button */}
      <button className="back-link-modern" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        <span>Back to schemes</span>
      </button>

      {/* Scheme Header */}
      <div className="scheme-detail-header-card">
        <div className="scheme-detail-hero-row">
          <CategoryIcon category={scheme.category} size={36} boxed />

          <div className="scheme-detail-meta">
            <div className="detail-tags-row">
              <span className="badge-pill badge-accent">
                <Sparkles size={12} strokeWidth={2} />
                {scheme.category?.toUpperCase()}
              </span>
              <span className="badge-pill badge-soft">
                <MapPin size={12} />
                {scheme.state || 'All India'}
              </span>
            </div>

            <h1 className="scheme-detail-title">{scheme.name}</h1>
            <p className="scheme-detail-desc">{scheme.description}</p>

            <div className="scheme-detail-chips">
              <span className="detail-fit-chip">
                <Sparkles size={13} />
                <span>{fitScore}% potential fit</span>
              </span>
              {scheme.deadline && (
                <span className="detail-deadline-chip">
                  <CalendarClock size={14} />
                  <span>{scheme.deadline}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="scheme-detail-actions-bar">
          <button
            className={`save-btn-modern ${isSaved ? 'saved' : ''}`}
            onClick={() => toggleSave(scheme.id)}
            aria-pressed={isSaved}
          >
            <Heart size={18} fill={isSaved ? '#E11D48' : 'none'} color={isSaved ? '#E11D48' : 'currentColor'} strokeWidth={1.8} />
            <span>{isSaved ? 'Saved to Shortlist' : 'Save Scheme'}</span>
          </button>
          <button
            className="btn-eligibility-check"
            onClick={() => setShowEligibilityModal(true)}
          >
            Check My Eligibility
          </button>
          <a
            href={scheme.applicationLink || 'https://www.myscheme.gov.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-apply-primary"
            style={{ textDecoration: 'none' }}
          >
            <span>Apply on Official Portal</span>
            <ExternalLink size={17} strokeWidth={2} />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="scheme-tabs-modern" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`scheme-tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="scheme-tab-content-panel" role="tabpanel">
        {activeTab === 'Overview' && (
          <div className="tab-pane-overview">
            <h2 className="tab-heading">About This Scheme</h2>
            <p className="tab-body-text">{scheme.description}</p>

            <div className="overview-facts-grid">
              <div className="overview-fact-card">
                <small>Key Benefit</small>
                <b>{scheme.benefit}</b>
              </div>
              <div className="overview-fact-card">
                <small>Application Deadline</small>
                <b>{scheme.deadline}</b>
              </div>
              <div className="overview-fact-card">
                <small>Eligible Region</small>
                <b>{scheme.state}</b>
              </div>
              <div className="overview-fact-card">
                <small>Category / Tag</small>
                <b>{scheme.category}</b>
              </div>
            </div>

            <div className="detail-advisory-note">
              <ShieldAlert size={18} className="advisory-icon" />
              <span>Information shown is compiled from official government portals for citizen guidance. Criteria and application dates can change without notice.</span>
            </div>
          </div>
        )}

        {activeTab === 'Eligibility' && (
          <div className="tab-pane-eligibility">
            <h2 className="tab-heading">Who Can Apply</h2>
            <div className="criteria-highlight-box">
              <h3>Scheme Eligibility Summary</h3>
              <p>{scheme.eligibility}</p>
            </div>

            <div className="eligibility-comparison-card">
              <h3>Comparison With Your Profile</h3>
              <div className="match-rows-list">
                <div className="match-field-row">
                  <span className="field-name">Your State</span>
                  <strong className="field-val">{eligibility.state || 'Not set'}</strong>
                </div>
                <div className="match-field-row">
                  <span className="field-name">Your Occupation</span>
                  <strong className="field-val">{eligibility.occupation || 'Not set'}</strong>
                </div>
                <div className="match-field-row">
                  <span className="field-name">Your Age</span>
                  <strong className="field-val">{eligibility.age ? `${eligibility.age} years` : 'Not set'}</strong>
                </div>
                <div className="match-field-row">
                  <span className="field-name">Annual Income</span>
                  <strong className="field-val">{eligibility.income ? `₹${Number(eligibility.income).toLocaleString('en-IN')}` : 'Not set'}</strong>
                </div>
              </div>

              {scheme.fit?.reasons && scheme.fit.reasons.length > 0 && (
                <div className="fit-reasons-box">
                  <h4>Why this scheme may be relevant:</h4>
                  <ul>
                    {scheme.fit.reasons.map((r, i) => (
                      <li key={i}>
                        <CheckCircle2 size={15} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-advisory-note">
                <ShieldAlert size={18} className="advisory-icon" />
                <span>This analysis is for guidance only. JanSetu does not confirm official eligibility. Terms may have changed — check the official portal.</span>
              </div>

              <button
                className="btn-modern-primary mt-3"
                onClick={() => setShowEligibilityModal(true)}
              >
                Check Detailed Eligibility Checklist
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="tab-pane-documents">
            <h2 className="tab-heading">Documents That May Be Required</h2>
            <p className="tab-body-text">
              Document requirements vary by state and category. Confirm the exact list on the official scheme portal.
            </p>
            {scheme.documents && scheme.documents.length > 0 ? (
              <ul className="documents-cards-grid">
                {scheme.documents.map((doc, i) => (
                  <li key={i} className="document-card-item">
                    <div className="doc-icon-wrap">
                      <FileText size={18} strokeWidth={1.8} />
                    </div>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tab-body-text">Document details are not available in the demo data. Please check the official scheme portal.</p>
            )}
            <div className="detail-advisory-note">
              <ShieldAlert size={18} className="advisory-icon" />
              <span>The above list is indicative. Official requirements may differ. Always verify on the scheme's official portal.</span>
            </div>
          </div>
        )}

        {activeTab === 'How to Apply' && (
          <div className="tab-pane-apply">
            <h2 className="tab-heading">How to Apply</h2>
            {scheme.howToApply ? (
              <div className="how-to-apply-callout">
                <p>{scheme.howToApply}</p>
              </div>
            ) : (
              <p className="tab-body-text">Application information is not available in the demo. Please visit the official scheme portal.</p>
            )}

            <div className="apply-steps-stack">
              <div className="apply-step-item">
                <div className="apply-step-num">1</div>
                <div>
                  <strong>Check Eligibility</strong>
                  <p>Review the eligibility tab above and verify on the official portal.</p>
                </div>
              </div>
              <div className="apply-step-item">
                <div className="apply-step-num">2</div>
                <div>
                  <strong>Gather Documents</strong>
                  <p>Prepare all required documents from the Documents tab above.</p>
                </div>
              </div>
              <div className="apply-step-item">
                <div className="apply-step-num">3</div>
                <div>
                  <strong>Apply Online or Offline</strong>
                  <p>Visit the official portal or nearest government office to submit your application.</p>
                </div>
              </div>
              <div className="apply-step-item">
                <div className="apply-step-num">4</div>
                <div>
                  <strong>Track Your Application</strong>
                  <p>Use the Track Application button above to keep a note in JanSetu.</p>
                </div>
              </div>
            </div>

            {scheme.applicationLink && (
              <a
                href={scheme.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-portal-external"
              >
                <span>Go to Official Scheme Portal</span>
                <ExternalLink size={17} />
              </a>
            )}

            <div className="detail-advisory-note">
              <ShieldAlert size={18} className="advisory-icon" />
              <span>JanSetu is a discovery tool. We do not process applications. Always apply through official government channels.</span>
            </div>
          </div>
        )}
      </div>

      {/* Eligibility Modal */}
      {showEligibilityModal && (
        <EligibilityModal
          scheme={scheme}
          eligibility={eligibility}
          profileName={profileName}
          onClose={() => setShowEligibilityModal(false)}
        />
      )}
    </section>
  );
}
