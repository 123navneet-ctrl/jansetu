import { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { useJanSetu } from '../context/JanSetuContext';
import { ALL_INDIAN_STATES } from '../services/schemeService';

const OCCUPATION_OPTIONS = [
  'Student',
  'Employed (Government)',
  'Employed (Private)',
  'Farmer',
  'Self-employed / Business',
  'Unemployed',
  'Homemaker',
  'Retired',
  'Other',
];

export default function EligibilityPage({ go }) {
  const {
    eligibility,
    setEligibility,
    assessedSchemes,
    setSelectedScheme,
    notify,
  } = useJanSetu();

  const [hasEvaluated, setHasEvaluated] = useState(false);

  const eligibilityMatches = useMemo(() => {
    return assessedSchemes
      .filter(s => (s.fit?.score || 0) >= 55)
      .sort((a, b) => (b.fit?.score || 0) - (a.fit?.score || 0));
  }, [assessedSchemes]);

  function handleCheckGuidance() {
    const age = Number(eligibility.age);
    const income = Number(eligibility.income);

    if (!eligibility.age || age < 0 || age > 120 || eligibility.income === '' || income < 0) {
      notify('Enter a valid age and non-negative annual income', 'error');
      setHasEvaluated(false);
      return;
    }

    setHasEvaluated(true);
    notify('Guidance checklist generated');
  }

  return (
    <section className="page-content">
      <PageTitle
        eyebrow="A STARTING POINT"
        title="Check your eligibility"
        subtitle="This is a demo guidance tool — not an official eligibility decision."
      />

      <div className="eligibility-layout">
        <div className="panel form-panel">
          <h2>Tell us a little about yourself</h2>
          <p>Update your profile details to explore general guidance.</p>

          <div className="form-grid">
            <label>
              Age
              <input
                value={eligibility.age}
                onChange={e => setEligibility(prev => ({ ...prev, age: e.target.value }))}
                type="number"
                min="0"
                max="120"
              />
            </label>

            <label>
              State / UT
              <select
                value={eligibility.state}
                onChange={e => setEligibility(prev => ({ ...prev, state: e.target.value }))}
              >
                {ALL_INDIAN_STATES.filter(s => s !== 'All States').map(st => (
                  <option key={st}>{st}</option>
                ))}
              </select>
            </label>

            <label>
              Occupation
              <select
                value={eligibility.occupation}
                onChange={e => setEligibility(prev => ({ ...prev, occupation: e.target.value }))}
              >
                {OCCUPATION_OPTIONS.map(occ => (
                  <option key={occ}>{occ}</option>
                ))}
              </select>
            </label>

            <label>
              Annual household income (₹)
              <input
                value={eligibility.income}
                onChange={e => setEligibility(prev => ({ ...prev, income: e.target.value }))}
                type="number"
                min="0"
                placeholder="e.g. 250000"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="primary-btn" onClick={handleCheckGuidance} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Find relevant guidance</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            {go && (
              <button className="outline-btn" onClick={() => go('Find My Schemes')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Full Profile Finder</span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        <div className="panel eligibility-result">
          <div className="result-icon">
            <Sparkles size={24} strokeWidth={1.75} />
          </div>
          <h2>{hasEvaluated ? 'Your next steps' : 'Your eligibility snapshot'}</h2>
          <p>
            {hasEvaluated
              ? 'Based on your answers, start by reviewing these categories and confirming the official rules.'
              : 'Complete the short form to see a simple next-step checklist.'}
          </p>

          {hasEvaluated && (
            <div className="eligibility-match-list">
              <h3>Potential matches to review</h3>
              {eligibilityMatches.length > 0 ? (
                eligibilityMatches.slice(0, 5).map(scheme => (
                  <article className="eligibility-match" key={scheme.id}>
                    <div>
                      <b>{scheme.name}</b>
                      <span>
                        {scheme.category} · {scheme.fit?.score}% potential fit
                      </span>
                    </div>
                    <ul>
                      {scheme.fit?.reasons.slice(0, 2).map(reason => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    <button
                      className="outline-btn"
                      onClick={() => setSelectedScheme(scheme)}
                    >
                      Review scheme
                    </button>
                  </article>
                ))
              ) : (
                <p>
                  No strong demo matches were found. Try reviewing all categories and official state resources.
                </p>
              )}
            </div>
          )}

          <div className="disclaimer" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info size={16} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent, #5B4BE8)' }} />
            <span>This is a transparent demo matching score, not an official eligibility result. Criteria may vary or change. Always verify on official portals.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
