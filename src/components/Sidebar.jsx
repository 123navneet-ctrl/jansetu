import {
  LayoutDashboard,
  Compass,
  Search,
  Sparkles,
  ClipboardList,
  Bookmark,
  CalendarClock,
  Bot,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useJanSetu } from '../context/JanSetuContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Explore Schemes', icon: Compass },
  { label: 'Find My Schemes', icon: Search },
  { label: 'Recommended', icon: Sparkles },
  { label: 'Saved Schemes', icon: Bookmark },
  { label: 'Deadlines', icon: CalendarClock },
  { label: 'AI Assistant', icon: Bot },
  { label: 'Notifications', icon: Bell },
  { label: 'Profile', icon: User },
  { label: 'Settings', icon: Settings },
];

export default function Sidebar({ page, go, onLogout }) {
  const { dark, setDark, profileName, visibleNotifications } = useJanSetu();

  return (
    <aside className="modern-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <button className="sidebar-brand-btn" onClick={() => go('Dashboard')} aria-label="JanSetu Home">
          <div className="sidebar-brand-logo">J</div>
          <div className="sidebar-brand-text">
            <span className="brand-title">JanSetu</span>
            <span className="brand-subtitle">Welfare Gateway</span>
          </div>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        {NAV_ITEMS.map(({ label, icon: IconComponent }) => {
          const isActive = page === label;
          const isNotification = label === 'Notifications';
          const badgeCount = isNotification ? visibleNotifications.length : 0;

          return (
            <button
              key={label}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => go(label)}
            >
              <span className="nav-icon-wrap">
                <IconComponent size={19} strokeWidth={1.75} />
              </span>
              <span className="nav-label-text">{label}</span>
              {badgeCount > 0 && (
                <span className="nav-badge-pill" aria-label={`${badgeCount} unread notifications`}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User & Theme Strip */}
      <div className="sidebar-footer-box">
        {/* Theme Switcher Button */}
        <button
          className="theme-toggle-btn"
          onClick={() => setDark(!dark)}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div className="theme-toggle-info">
            {dark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
            <span>{dark ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="theme-toggle-pill">
            <span className={`toggle-dot ${dark ? 'dark' : ''}`} />
          </span>
        </button>

        {/* User Mini Card */}
        <div className="sidebar-user-card" onClick={() => go('Profile')} role="button" tabIndex={0}>
          <div className="sidebar-avatar-circle">
            {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="sidebar-user-details">
            <span className="user-name">{profileName || 'JanSetu Citizen'}</span>
            <span className="user-sub">Verified Profile</span>
          </div>
          {onLogout && (
            <button
              className="sidebar-logout-icon"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
