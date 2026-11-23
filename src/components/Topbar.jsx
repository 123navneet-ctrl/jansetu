import { Search, Bell, Bot, ChevronRight } from 'lucide-react';
import { useJanSetu } from '../context/JanSetuContext';

const TOP_NAV_LINKS = [
  { label: 'Home', target: 'Dashboard' },
  { label: 'Explore Schemes', target: 'Explore Schemes' },
  { label: 'Recommended', target: 'Recommended' },
  { label: 'AI Assistant', target: 'AI Assistant' },
  { label: 'About', target: 'About Us' },
];

export default function Topbar({ page, go }) {
  const { profileName, visibleNotifications } = useJanSetu();

  return (
    <header className="modern-topbar">
      {/* Breadcrumb Section */}
      <div className="topbar-breadcrumb">
        <span className="crumb-root" onClick={() => go('Dashboard')} role="button" tabIndex={0}>
          JanSetu
        </span>
        <ChevronRight size={14} className="crumb-arrow" />
        <span className="crumb-current">{page}</span>
      </div>

      {/* Center Links (Desktop) */}
      <nav className="topbar-center-links" aria-label="Quick links">
        {TOP_NAV_LINKS.map(item => {
          const isActive =
            page === item.target ||
            (item.target === 'Dashboard' && (page === 'Dashboard' || page === 'Home'));

          return (
            <button
              key={item.label}
              className={`top-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => go(item.target)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Action Icons */}
      <div className="topbar-right-actions">
        {/* Quick Search Button */}
        <button
          className="topbar-icon-action"
          title="Search schemes"
          aria-label="Search schemes"
          onClick={() => go('Explore Schemes')}
        >
          <Search size={18} strokeWidth={1.75} />
        </button>

        {/* AI Assistant Quick Pill */}
        <button
          className="topbar-ai-pill"
          onClick={() => go('AI Assistant')}
          title="Ask JanSetu AI Assistant"
        >
          <Bot size={16} strokeWidth={1.75} />
          <span>Ask AI</span>
        </button>

        {/* Notifications Icon */}
        <button
          className="topbar-icon-action has-badge"
          title="Notifications"
          aria-label="View notifications"
          onClick={() => go('Notifications')}
        >
          <Bell size={18} strokeWidth={1.75} />
          {visibleNotifications.length > 0 && (
            <span className="topbar-ping-badge" aria-label={`${visibleNotifications.length} notifications`} />
          )}
        </button>

        {/* Profile Avatar Button */}
        <button
          className="topbar-avatar-btn"
          onClick={() => go('Profile')}
          title="View Citizen Profile"
          aria-label="View Citizen Profile"
        >
          <span className="topbar-avatar-letter">
            {profileName ? profileName.charAt(0).toUpperCase() : 'C'}
          </span>
        </button>
      </div>
    </header>
  );
}
