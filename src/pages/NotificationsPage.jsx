import { useState, useMemo } from 'react';
import {
  Bell,
  CalendarClock,
  Lightbulb,
  ShieldCheck,
  SlidersHorizontal,
  Check,
  RotateCcw,
  X,
  PartyPopper,
  Clock,
  Sparkles,
} from 'lucide-react';
import PageTitle from '../components/PageTitle';
import Empty from '../components/Empty';
import { useJanSetu } from '../context/JanSetuContext';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const {
    notifications,
    visibleNotifications,
    reminderPreferences,
    setReminderPreferences,
    dismissNotification,
    dismissAllNotifications,
    restoreNotifications,
  } = useJanSetu();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'deadline' | 'general'
  const [searchQuery, setSearchQuery] = useState('');

  // Counts for tabs
  const deadlineCount = useMemo(
    () => visibleNotifications.filter(n => n.kind === 'deadline').length,
    [visibleNotifications]
  );
  const generalCount = useMemo(
    () => visibleNotifications.filter(n => n.kind === 'general').length,
    [visibleNotifications]
  );

  // Filtered notifications
  const displayedNotifications = useMemo(() => {
    return visibleNotifications.filter(item => {
      const matchesTab = activeTab === 'all' || item.kind === activeTab;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.time && item.time.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTab && matchesSearch;
    });
  }, [visibleNotifications, activeTab, searchQuery]);

  return (
    <section className="page-content notifications-page">
      <PageTitle
        eyebrow="STAY INFORMED"
        title="Notifications"
        subtitle="Manage your personal update feed, dismiss read tips, and configure in-app reminder preferences."
      />

      {/* 1. Overview Statistics Bar */}
      <div className="notifications-overview-grid">
        <div className="notifications-stat-card stat-violet">
          <div className="stat-card-icon icon-violet">
            <Bell size={20} strokeWidth={1.75} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-val">{visibleNotifications.length}</span>
            <span className="stat-card-label">Active Notifications</span>
          </div>
        </div>

        <div className="notifications-stat-card stat-cyan">
          <div className="stat-card-icon icon-cyan">
            <CalendarClock size={20} strokeWidth={1.75} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-val">{deadlineCount}</span>
            <span className="stat-card-label">Deadline Notices</span>
          </div>
        </div>

        <div className="notifications-stat-card stat-mint">
          <div className="stat-card-icon icon-mint">
            <Lightbulb size={20} strokeWidth={1.75} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-val">{generalCount}</span>
            <span className="stat-card-label">Tips & Recommendations</span>
          </div>
        </div>

        <div className="notifications-stat-card stat-orange">
          <div className="stat-card-icon icon-orange">
            <ShieldCheck size={20} strokeWidth={1.75} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-val">Local</span>
            <span className="stat-card-label">Browser Privacy Mode</span>
          </div>
        </div>
      </div>

      {/* 2. Modern Preferences & Alert Channels Card */}
      <div className="notifications-preferences-card">
        <div className="preferences-card-header">
          <div className="preferences-header-icon">
            <SlidersHorizontal size={22} strokeWidth={1.75} />
          </div>
          <div className="preferences-header-texts">
            <h2>Notification & Alert Channels</h2>
            <p>
              Customize what appears in your dashboard and notification feed. Preferences are saved locally in your browser.
            </p>
          </div>
        </div>

        <div className="preferences-toggles-grid">
          {/* Toggle 1: Deadline Reminders */}
          <div className="preference-toggle-item">
            <div className="toggle-item-info">
              <span className="toggle-item-title">Deadline Reminders</span>
              <span className="toggle-item-desc">Impending application cutoffs and date alerts</span>
            </div>
            <label className="switch-control" title="Toggle deadline reminders">
              <input
                type="checkbox"
                checked={reminderPreferences.upcomingDeadlines}
                onChange={e =>
                  setReminderPreferences(prev => ({
                    ...prev,
                    upcomingDeadlines: e.target.checked,
                  }))
                }
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Toggle 2: Helpful Tips */}
          <div className="preference-toggle-item">
            <div className="toggle-item-info">
              <span className="toggle-item-title">Helpful In-App Tips</span>
              <span className="toggle-item-desc">Guidance on scheme eligibility and discovery</span>
            </div>
            <label className="switch-control" title="Toggle helpful in-app tips">
              <input
                type="checkbox"
                checked={reminderPreferences.inAppTips}
                onChange={e =>
                  setReminderPreferences(prev => ({
                    ...prev,
                    inAppTips: e.target.checked,
                  }))
                }
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Toggle 3: Weekly Digest */}
          <div className="preference-toggle-item">
            <div className="toggle-item-info">
              <span className="toggle-item-title">Weekly Digest (Demo)</span>
              <span className="toggle-item-desc">Periodic summary of newly announced initiatives</span>
            </div>
            <label className="switch-control" title="Toggle weekly digest">
              <input
                type="checkbox"
                checked={reminderPreferences.weeklyDigest}
                onChange={e =>
                  setReminderPreferences(prev => ({
                    ...prev,
                    weeklyDigest: e.target.checked,
                  }))
                }
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Actions Toolbar */}
      <div className="notifications-toolbar">
        <div className="notifications-tabs-group">
          <button
            className={`notif-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Updates
            <span className="notif-tab-count">{visibleNotifications.length}</span>
          </button>
          <button
            className={`notif-tab-btn ${activeTab === 'deadline' ? 'active' : ''}`}
            onClick={() => setActiveTab('deadline')}
          >
            <CalendarClock size={16} strokeWidth={1.75} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
            Deadlines
            <span className="notif-tab-count">{deadlineCount}</span>
          </button>
          <button
            className={`notif-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Lightbulb size={16} strokeWidth={1.75} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
            Tips
            <span className="notif-tab-count">{generalCount}</span>
          </button>
        </div>

        <div className="notifications-actions-group">
          <button
            className="notif-action-btn"
            onClick={dismissAllNotifications}
            disabled={visibleNotifications.length === 0}
            title="Dismiss all visible notifications"
          >
            <Check size={16} strokeWidth={1.75} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
            Dismiss All
          </button>
          <button
            className="notif-action-btn btn-restore"
            onClick={restoreNotifications}
            title="Restore default demo notifications"
          >
            <RotateCcw size={15} strokeWidth={1.75} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
            Restore Demo Alerts
          </button>
        </div>
      </div>

      {/* 4. Notification Cards List */}
      {displayedNotifications.length > 0 ? (
        <div className="notifications-cards-list">
          {displayedNotifications.map(item => {
            const isDeadline = item.kind === 'deadline';

            return (
              <div
                className={`notification-card-item ${isDeadline ? 'notif-deadline' : 'notif-general'
                  }`}
                key={item.id}
              >
                {/* Visual Avatar Icon */}
                <div
                  className={`notification-avatar-icon ${isDeadline ? 'icon-deadline' : 'icon-general'
                    }`}
                >
                  {isDeadline ? (
                    <CalendarClock size={20} strokeWidth={1.75} />
                  ) : (
                    <Lightbulb size={20} strokeWidth={1.75} />
                  )}
                </div>

                {/* Body Content */}
                <div className="notification-body-content">
                  <div className="notification-tags-row">
                    <span
                      className={`notif-category-chip ${isDeadline ? 'chip-deadline' : 'chip-general'
                        }`}
                    >
                      {isDeadline ? 'Deadline Notice' : 'Helpful Tip'}
                    </span>
                    {item.time && (
                      <span className="notif-time-badge">{item.time}</span>
                    )}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.message}</p>
                </div>

                {/* Dismiss Button */}
                <button
                  className="notif-dismiss-btn"
                  aria-label={`Dismiss ${item.title}`}
                  title="Dismiss notification"
                  onClick={() => dismissNotification(item.id)}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      ) : visibleNotifications.length === 0 ? (
        <div className="notifications-empty-box">
          <div className="notifications-empty-icon">
            <PartyPopper size={36} strokeWidth={1.75} />
          </div>
          <h3>You're All Caught Up!</h3>
          <p>
            There are no active notifications. Check back later for scheme updates, or restore the demo notices to see sample alerts.
          </p>
          <button className="notif-action-btn btn-restore" onClick={restoreNotifications}>
            <RotateCcw size={15} strokeWidth={1.75} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
            Restore Demo Notifications
          </button>
        </div>
      ) : (
        <Empty
          title="No notifications in this filter"
          text="There are no notifications matching the selected tab. Try switching to 'All Updates'."
          action="Show all updates"
          onAction={() => setActiveTab('all')}
        />
      )}
    </section>
  );
}
