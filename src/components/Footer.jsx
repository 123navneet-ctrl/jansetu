import { Compass, Sparkles, Heart, MessageSquare, ExternalLink, Mail, ShieldAlert, Coffee } from 'lucide-react';

// Easy-to-edit personal creator placeholder
export const CREATOR_NAME = '[YOUR NAME]';

export default function Footer({ go }) {
  const currentYear = new Date().getFullYear();

  function handleNav(destination) {
    if (go) {
      go(destination);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Top Split */}
        <div className="footer-top-grid">
          {/* Brand & Purpose Column */}
          <div className="footer-brand-col">
            <div className="footer-logo" onClick={() => handleNav('Dashboard')} role="button" tabIndex={0}>
              <div className="footer-logo-mark">J</div>
              <span className="footer-logo-text">JanSetu</span>
            </div>
            <p className="footer-mission">
              Finding the right government scheme is confusing when information is scattered across dozens of portals.
              JanSetu was built to organize these benefits in plain language so ordinary citizens can find the support they qualify for.
            </p>
            <div className="footer-creator-badge">
              <Coffee size={16} strokeWidth={1.75} className="creator-coffee-icon" />
              <span>
                Built by <strong>{CREATOR_NAME}</strong> — a student project made with a lot of chai.
              </span>
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li><button onClick={() => handleNav('Explore Schemes')}>All Schemes</button></li>
                <li><button onClick={() => handleNav('Explore Schemes')}>Categories</button></li>
                <li><button onClick={() => handleNav('Saved Schemes')}>Saved Schemes</button></li>
                <li><button onClick={() => handleNav('Deadlines')}>Application Deadlines</button></li>
                <li><button onClick={() => handleNav('Recommended')}>Recommended for You</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Help & Guidance</h4>
              <ul>
                <li><button onClick={() => handleNav('Dashboard')}>How It Works</button></li>
                <li><button onClick={() => handleNav('AI Assistant')}>Ask the AI Assistant</button></li>
                <li><button onClick={() => handleNav('Find My Schemes')}>Find My Schemes</button></li>
                <li><button onClick={() => handleNav('Eligibility Guide')}>Eligibility Guide</button></li>
                <li><button onClick={() => handleNav('Settings')}>Account & Settings</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>About</h4>
              <ul>
                <li><button onClick={() => handleNav('About Us')}>About This Project</button></li>
                <li>
                  <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="external-link">
                    myScheme Portal <ExternalLink size={14} />
                  </a>
                </li>
                <li>
                  <a href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer" className="external-link">
                    National Scholarship Portal <ExternalLink size={14} />
                  </a>
                </li>
                <li>
                  <a href="https://pmjay.gov.in" target="_blank" rel="noopener noreferrer" className="external-link">
                    Ayushman Bharat <ExternalLink size={14} />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Honest Official Advisory Banner */}
        <div className="footer-advisory">
          <ShieldAlert size={20} className="advisory-icon" />
          <p>
            <strong>Important Notice:</strong> JanSetu is an educational discovery tool and not an official government website.
            Eligibility rules, documents and deadlines can change. Always confirm details and submit applications on the scheme's official government portal.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copy">
            © {currentYear} JanSetu. Making public support simpler to navigate.
          </p>
          <div className="footer-bottom-links">
            <button onClick={() => handleNav('About Us')}>Student Practical Demo</button>
            <span className="dot">•</span>
            <button onClick={() => handleNav('AI Assistant')}>Gemini Powered</button>
            <span className="dot">•</span>
            <button onClick={() => handleNav('Settings')}>Java 17 JDBC Backend</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
