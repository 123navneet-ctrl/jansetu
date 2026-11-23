import { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Bot,
  BookmarkCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  ExternalLink,
  MapPin,
  CalendarClock,
  Heart,
  UserCheck,
  Filter,
  FileText,
  Star,
  Quote,
} from 'lucide-react';
import { useJanSetu } from '../context/JanSetuContext';
import { ALL_INDIAN_STATES } from '../services/schemeService';
import { categories } from '../data/categories';
import SchemeCard from '../components/SchemeCard';
import CategoryIcon from '../components/CategoryIcon';

// SAMPLE CONTENT - replace with real feedback
const TESTIMONIALS = [
  {
    quote:
      'JanSetu helped me discover the Post Matric Scholarship when I started university. Having the required document list in one place saved me multiple visits to local offices.',
    author: 'Priya K.',
    role: 'Undergraduate Student',
    location: 'Amritsar, Punjab',
    scheme: 'Post Matric Scholarship',
  },
  {
    quote:
      'Finding agricultural credit details used to mean asking around at local banks. Here, the terms and interest subventions were explained in plain words.',
    author: 'Rameshwar S.',
    role: 'Farmer',
    location: 'Nashik, Maharashtra',
    scheme: 'Kisan Credit Card (KCC)',
  },
  {
    quote:
      'The AI assistant answered my exact questions about eligibility for my mother’s pension in seconds. It made a complicated process feel manageable.',
    author: 'Ananya D.',
    role: 'Community Worker',
    location: 'Bengaluru, Karnataka',
    scheme: 'Senior Citizens Support',
  },
];

export default function Dashboard({ go }) {
  const {
    schemes,
    saved,
    toggleSave,
    setSelectedScheme,
    setExploreCategory,
    setExploreState,
    setExploreQuery,
    apiLoading,
    apiError,
    loadSchemes,
    profileName,
  } = useJanSetu();

  // Floating search card local state
  const [searchState, setSearchState] = useState('All States');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchOccupation, setSearchOccupation] = useState('');

  // Handle floating search submit
  function handleFloatingSearch(e) {
    e.preventDefault();
    if (searchState && searchState !== 'All States') {
      setExploreState(searchState);
    }
    if (searchCategory && searchCategory !== 'All') {
      setExploreCategory(searchCategory);
    }
    if (searchOccupation) {
      setExploreQuery(searchOccupation);
    }
    go('Explore Schemes');
  }

  // 3 Featured schemes for the card grid
  const featuredSchemes = (schemes && schemes.length >= 3)
    ? [schemes[0], schemes[2], schemes[4]]
    : (schemes || []).slice(0, 3);

  return (
    <div className="modern-dashboard">
      {/* ========================================================
          1. HERO SECTION WITH PARLIAMENT PHOTO & FLOATING SEARCH
         ======================================================== */}
      <section className="hero-property-style">
        <div className="hero-banner-frame">
          {/* Background Image with Gradient Overlay */}
          <div className="hero-bg-media">
            <picture>
              <source srcSet="/images/parliament-hero.webp" type="image/webp" />
              <img
                src="/images/parliament-hero.jpg"
                alt="Indian Parliament Sansad Bhavan in New Delhi under warm golden hour dusk sky"
                className="hero-parliament-img"
                fetchPriority="high"
                width="1600"
                height="900"
              />
            </picture>
            <div className="hero-gradient-overlay" />
          </div>

          {/* Hero Content on top */}
          <div className="hero-copy-container">
            <div className="hero-kicker-pill">
              <span className="saffron-dot" />
              <span>National Welfare Scheme Gateway</span>
            </div>

            <h1 className="hero-headline">
              Discover Schemes That <span className="accent-highlight">Fit Your Life</span>
            </h1>

            <p className="hero-subtext">
              Find government welfare schemes you may qualify for, in your language and state. Verified eligibility rules, required documents, and official application portals.
            </p>

            <div className="hero-cta-group">
              <button
                className="hero-btn-primary"
                onClick={() => go('Find My Schemes')}
              >
                <span>Find Schemes For Me</span>
                <ArrowRight size={18} strokeWidth={2} />
              </button>
              <button
                className="hero-btn-glass"
                onClick={() => go('AI Assistant')}
              >
                <Bot size={18} strokeWidth={1.8} />
                <span>Ask JanSetu AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Search Card Overlapping Hero Bottom */}
        <div className="hero-floating-card-wrap">
          <form className="hero-floating-search-card" onSubmit={handleFloatingSearch}>
            <div className="search-field-col">
              <label htmlFor="hero-state-select">
                <MapPin size={15} className="field-icon" />
                <span>Your State / UT</span>
              </label>
              <select
                id="hero-state-select"
                value={searchState}
                onChange={e => setSearchState(e.target.value)}
                className="floating-select"
              >
                {ALL_INDIAN_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="search-divider" aria-hidden="true" />

            <div className="search-field-col">
              <label htmlFor="hero-category-select">
                <Filter size={15} className="field-icon" />
                <span>Category</span>
              </label>
              <select
                id="hero-category-select"
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}
                className="floating-select"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c[0]} value={c[0]}>{c[0]}</option>
                ))}
              </select>
            </div>

            <div className="search-divider" aria-hidden="true" />

            <div className="search-field-col">
              <label htmlFor="hero-occupation-input">
                <UserCheck size={15} className="field-icon" />
                <span>Age / Occupation</span>
              </label>
              <input
                id="hero-occupation-input"
                type="text"
                placeholder="e.g. Student, Farmer, Senior"
                value={searchOccupation}
                onChange={e => setSearchOccupation(e.target.value)}
                className="floating-input"
              />
            </div>

            <button type="submit" className="hero-search-submit-btn">
              <Search size={18} strokeWidth={2} />
              <span>Search Schemes</span>
            </button>
          </form>
        </div>
      </section>

      {/* ========================================================
          2. ROW OF 4 FEATURE HIGHLIGHTS
         ======================================================== */}
      <section className="section-feature-highlights">
        <div className="features-four-grid">
          <div className="feature-highlight-card">
            <div className="feature-icon-box bg-tint-blue">
              <ShieldCheck size={26} strokeWidth={1.75} className="icon-blue" />
            </div>
            <div className="feature-text-block">
              <h3 className="feature-title">Verified Sources</h3>
              <p className="feature-desc">Grounded in official gazettes and portals across central and state ministries.</p>
            </div>
          </div>

          <div className="feature-highlight-card">
            <div className="feature-icon-box bg-tint-amber">
              <Sparkles size={26} strokeWidth={1.75} className="icon-amber" />
            </div>
            <div className="feature-text-block">
              <h3 className="feature-title">Free to Use</h3>
              <p className="feature-desc">100% free discovery platform with no registration charges, paywalls, or ads.</p>
            </div>
          </div>

          <div className="feature-highlight-card clickable" onClick={() => go('AI Assistant')}>
            <div className="feature-icon-box bg-tint-violet">
              <Bot size={26} strokeWidth={1.75} className="icon-violet" />
            </div>
            <div className="feature-text-block">
              <h3 className="feature-title">AI Assistant</h3>
              <p className="feature-desc">Gemini-powered guidance answering eligibility questions in plain conversational language.</p>
            </div>
          </div>

          <div className="feature-highlight-card clickable" onClick={() => go('Saved Schemes')}>
            <div className="feature-icon-box bg-tint-emerald">
              <BookmarkCheck size={26} strokeWidth={1.75} className="icon-emerald" />
            </div>
            <div className="feature-text-block">
              <h3 className="feature-title">Save & Track Schemes</h3>
              <p className="feature-desc">Bookmark potential schemes, manage checklists, and track important deadlines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. "WHY CHOOSE US" SPLIT SECTION
         ======================================================== */}
      <section className="section-why-us">
        <div className="why-us-split-grid">
          {/* Left Text & Bullet Points */}
          <div className="why-us-content">
            <div className="section-kicker">
              <Sparkles size={13} strokeWidth={2} />
              <span>WHY CHOOSE JANSETU</span>
            </div>

            <h2 className="section-title">
              Cut Through Complexity. Access Your Entitlements.
            </h2>

            <p className="section-intro">
              Government schemes provide crucial financial, healthcare, and educational lifelines. Yet millions of eligible citizens miss out simply because criteria are hard to find and confusing to decipher.
            </p>

            <ul className="why-us-checklist">
              <li>
                <div className="check-bullet">
                  <CheckCircle2 size={18} strokeWidth={2} />
                </div>
                <div>
                  <strong>Curated Central & State Catalog</strong>
                  <p>Comprehensive schemes across education, agriculture, healthcare, housing, and social security.</p>
                </div>
              </li>
              <li>
                <div className="check-bullet">
                  <CheckCircle2 size={18} strokeWidth={2} />
                </div>
                <div>
                  <strong>Plain-Language Eligibility Check</strong>
                  <p>No jargon. Transparent criteria so you can easily see what applies to your family situation.</p>
                </div>
              </li>
              <li>
                <div className="check-bullet">
                  <CheckCircle2 size={18} strokeWidth={2} />
                </div>
                <div>
                  <strong>Direct Official Application Links</strong>
                  <p>We connect you directly to authentic government portals to ensure safety and authenticity.</p>
                </div>
              </li>
            </ul>

            <div className="why-us-actions">
              <button className="btn-modern-primary" onClick={() => go('About Us')}>
                <span>Learn More About JanSetu</span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Right Rounded Architectural Image */}
          <div className="why-us-media-frame">
            <div className="why-us-image-card">
              <picture>
                <source srcSet="/images/parliament-secondary.webp" type="image/webp" />
                <img
                  src="/images/parliament-secondary.jpg"
                  alt="Dignified facade of Indian Parliament colonnades and Ashoka emblem in New Delhi"
                  className="why-us-portrait-img"
                  loading="lazy"
                  width="800"
                  height="1000"
                />
              </picture>
              <div className="why-us-floating-badge">
                <div className="badge-icon-wrap">
                  <MapPin size={18} />
                </div>
                <div className="badge-text-wrap">
                  <strong>All 28 States & UTs</strong>
                  <span>Central & State Coverage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. "FEATURED" CARD GRID (3 Cards with Rounded Corners)
         ======================================================== */}
      <section className="section-featured-schemes">
        <div className="section-header-row">
          <div>
            <div className="section-kicker">
              <Sparkles size={13} strokeWidth={2} />
              <span>OPPORTUNITIES FOR YOU</span>
            </div>
            <h2 className="section-title">Featured Welfare Programs</h2>
            <p className="section-subtitle">
              High-impact welfare schemes across healthcare, education, and financial security.
            </p>
          </div>
          <button className="btn-view-all-outline" onClick={() => go('Explore Schemes')}>
            <span>View All Schemes</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="featured-cards-grid">
          {featuredSchemes.map((scheme, index) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              saved={saved.includes(scheme.id)}
              badge={index === 0 ? 'Popular' : index === 1 ? 'High Match' : 'New'}
              onSave={() => toggleSave(scheme.id)}
              onOpen={() => setSelectedScheme(scheme)}
            />
          ))}
        </div>
      </section>

      {/* ========================================================
          5. "HOW IT WORKS" IN 3 NUMBERED STEPS
         ======================================================== */}
      <section className="section-how-it-works">
        <div className="section-center-heading">
          <div className="section-kicker">
            <Sparkles size={13} strokeWidth={2} />
            <span>SIMPLE PROCESS</span>
          </div>
          <h2 className="section-title">How JanSetu Works</h2>
          <p className="section-subtitle">
            Three straightforward steps to discover, evaluate, and prepare for government assistance.
          </p>
        </div>

        <div className="steps-three-grid">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-number-bubble">1</div>
            <div className="step-icon-wrap bg-tint-violet">
              <UserCheck size={28} strokeWidth={1.75} className="icon-violet" />
            </div>
            <h3 className="step-title">Create your profile</h3>
            <p className="step-desc">
              Share basic details such as your state, age, occupation, and family background to tailor relevant schemes.
            </p>
          </div>

          {/* Connector Line 1 */}
          <div className="step-connector-line" aria-hidden="true" />

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-number-bubble">2</div>
            <div className="step-icon-wrap bg-tint-blue">
              <Filter size={28} strokeWidth={1.75} className="icon-blue" />
            </div>
            <h3 className="step-title">See schemes that match</h3>
            <p className="step-desc">
              Browse preliminary eligibility matches, review benefits in simple terms, and check required documents.
            </p>
          </div>

          {/* Connector Line 2 */}
          <div className="step-connector-line" aria-hidden="true" />

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-number-bubble">3</div>
            <div className="step-icon-wrap bg-tint-emerald">
              <ExternalLink size={28} strokeWidth={1.75} className="icon-emerald" />
            </div>
            <h3 className="step-title">Apply on the official portal</h3>
            <p className="step-desc">
              Follow step-by-step instructions and proceed directly to verified government application portals with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. TESTIMONIALS ROW (Sample Content)
         ======================================================== */}
      <section className="section-testimonials">
        <div className="section-center-heading">
          <div className="section-kicker">
            <Sparkles size={13} strokeWidth={2} />
            <span>COMMUNITY VOICES</span>
          </div>
          <h2 className="section-title">Citizens Finding Support Everyday</h2>
          <p className="section-subtitle">
            Hear how simplified scheme discovery makes a genuine difference across India.
          </p>
        </div>

        <div className="testimonials-three-grid">
          {/* SAMPLE CONTENT - replace with real feedback */}
          {TESTIMONIALS.map((t, idx) => (
            <div className="testimonial-card" key={idx}>
              <div className="testimonial-quote-icon">
                <Quote size={24} strokeWidth={1.5} />
              </div>
              <p className="testimonial-body">“{t.quote}”</p>
              <div className="testimonial-footer">
                <div className="testimonial-avatar-letter">
                  {t.author.charAt(0)}
                </div>
                <div className="testimonial-meta">
                  <h4 className="testimonial-name">{t.author}</h4>
                  <span className="testimonial-role">{t.role} • {t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          7. FULL-WIDTH ROUNDED GRADIENT CTA BANNER
         ======================================================== */}
      <section className="section-gradient-cta">
        <div className="cta-gradient-box">
          <div className="cta-content-column">
            <span className="cta-pill-tag">
              <Sparkles size={14} /> AI-Powered Government Discovery
            </span>
            <h2 className="cta-headline">
              Ready to Discover Your Eligible Schemes?
            </h2>
            <p className="cta-sub">
              Take two minutes to answer a few quick questions. JanSetu will highlight potential schemes, grants, and subsidies tailored to your life.
            </p>
            <div className="cta-btn-row">
              <button className="cta-primary-btn" onClick={() => go('Find My Schemes')}>
                <span>Find Schemes For Me</span>
                <ArrowRight size={17} strokeWidth={2} />
              </button>
              <button className="cta-secondary-btn" onClick={() => go('AI Assistant')}>
                <Bot size={17} strokeWidth={1.8} />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
