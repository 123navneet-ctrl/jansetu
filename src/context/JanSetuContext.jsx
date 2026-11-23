import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { readStoredValue, usePersistentState } from '../hooks/usePersistentState';
import { initialNotifications } from '../data/notifications';
import { schemes as defaultSchemes } from '../data/schemes';
import { getSchemesFromApi } from '../services/schemeService';
import { ApiClient } from '../services/apiClient';
import { assessSchemeFit } from '../utils/schemeUtils';
import { useDeadlineItems } from '../hooks/useDeadlineItems';

const JanSetuContext = createContext(null);

const serializeBoolean = value => String(value);
const deserializeBoolean = value => value !== 'false';
const serializeString = value => value;
const deserializeProfileName = value => value || 'Guest User';

const defaultEligibility = {
  age: '20',
  state: 'Punjab',
  occupation: 'Student',
  income: '300000',
  education: 'Undergraduate',
};

const defaultPreferences = {
  upcomingDeadlines: true,
  inAppTips: true,
  weeklyDigest: false,
};

const defaultAdditionalProfile = {
  gender: 'Prefer not to say',
  category: 'General',
  disability: 'No',
  maritalStatus: 'Single',
  areaType: 'Urban',
  minority: 'No',
  phone: '',
  district: '',
  notes: '',
};

export function JanSetuProvider({ children }) {
  // Theme & Identity
  const [dark, setDark] = usePersistentState('jansetu-dark', true, {
    serialize: serializeBoolean,
    deserialize: deserializeBoolean,
  });
  const [profileName, setProfileName] = usePersistentState('jansetu-profile-name', 'Guest User', {
    serialize: serializeString,
    deserialize: deserializeProfileName,
  });

  // User Session
  const [authSession, setAuthSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jansetu-demo-session') || 'null');
    } catch {
      return null;
    }
  });

  // Saved Schemes
  const [saved, setSaved] = usePersistentState('jansetu-saved', [2]);

  // Eligibility Profile & Additional Details
  const [eligibility, setEligibility] = usePersistentState('jansetu-eligibility-profile', defaultEligibility);
  const [additionalProfile, setAdditionalProfile] = usePersistentState('jansetu-additional-profile', defaultAdditionalProfile);

  // Notifications & Reminders
  const [notifications, setNotifications] = usePersistentState('jansetu-notifications', initialNotifications);
  const [reminderPreferences, setReminderPreferences] = usePersistentState('jansetu-reminder-preferences', defaultPreferences);

  // Scheme Catalogue & API
  const [apiSchemes, setApiSchemes] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [backendOnline, setBackendOnline] = useState(null); // null | true | false
  const [verificationTasks, setVerificationTasks] = useState([]);

  // Global explore/search state (avoids prop drilling)
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreCategory, setExploreCategory] = useState('All categories');
  const [exploreState, setExploreState] = useState('All states');

  // Find-My-Schemes form profile (separate from auth profile for the feature)
  const [findProfile, setFindProfile] = usePersistentState('jansetu-find-profile', null);
  const [findResults, setFindResults] = useState(null); // null = not searched yet

  // UI State: Modal & Toast
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error' | 'info'

  // Toast notification helper
  const notify = useCallback((message, type = 'success') => {
    setToast(message);
    setToastType(type);
    window.setTimeout(() => setToast(''), 3000);
  }, []);

  // Fetch schemes from API service
  const loadSchemes = useCallback(async () => {
    setApiLoading(true);
    setApiError('');
    try {
      const data = await getSchemesFromApi();
      setApiSchemes(data);
    } catch (err) {
      setApiError('Unable to load schemes. Please check your connection and try again.');
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  // Derived catalogue
  const displaySchemes = useMemo(() => {
    return apiSchemes.length > 0 ? apiSchemes : defaultSchemes;
  }, [apiSchemes]);

  const assessedSchemes = useMemo(() => {
    return displaySchemes.map(s => ({
      ...s,
      fit: assessSchemeFit(s, eligibility),
    }));
  }, [displaySchemes, eligibility]);

  // Find-my-schemes: filter based on submitted findProfile
  const findSchemeResults = useMemo(() => {
    if (!findProfile) return null;
    return assessedSchemes.filter(s => {
      const catMatch =
        !findProfile.category ||
        findProfile.category === 'All' ||
        s.category.toLowerCase().includes(findProfile.category.toLowerCase());
      const stateMatch =
        !findProfile.state ||
        findProfile.state === 'All States' ||
        s.state === 'All India' ||
        s.state === 'State dependent' ||
        s.state === 'Participating states' ||
        s.state.toLowerCase().includes(findProfile.state.toLowerCase());
      const occMatch =
        !findProfile.occupation ||
        assessSchemeFit(s, {
          ...eligibility,
          occupation: findProfile.occupation,
          income: String(findProfile.income || eligibility.income),
          age: String(findProfile.age || eligibility.age),
        }).score >= 45;
      return catMatch && stateMatch && occMatch;
    }).sort((a, b) => (b.fit?.score || 0) - (a.fit?.score || 0));
  }, [findProfile, assessedSchemes, eligibility]);

  // Derived deadline items
  const deadlineItems = useDeadlineItems(displaySchemes);

  // Visible notifications based on user preferences
  const visibleNotifications = useMemo(() => {
    return notifications
      .filter(n => n.kind !== 'deadline' || reminderPreferences.upcomingDeadlines)
      .filter(n => n.kind !== 'general' || reminderPreferences.inAppTips);
  }, [notifications, reminderPreferences]);

  // Load backend scheme verifications (Multithreaded Producer-Consumer tracking)
  const loadVerifications = useCallback(async () => {
    try {
      const list = await ApiClient.getVerifications();
      if (Array.isArray(list)) {
        setVerificationTasks(list);
      }
    } catch {
      // Backend offline: keep existing state
    }
  }, []);

  // Sync saved schemes from backend (JDBC / SavedSchemeRepository / LinkedHashSet)
  useEffect(() => {
    async function syncBackendData() {
      try {
        const savedList = await ApiClient.getSavedSchemes(1);
        if (Array.isArray(savedList)) {
          setBackendOnline(true);
          const backendIds = savedList.map(s => s.id);
          setSaved(prev => Array.from(new Set([...prev, ...backendIds])));
        }
      } catch (e) {
        setBackendOnline(false);
        console.warn('[JanSetu] Backend offline for saved schemes sync:', e.message);
      }
      loadVerifications();
    }
    syncBackendData();
    const timer = setInterval(loadVerifications, 4000);
    return () => clearInterval(timer);
  }, [setSaved, loadVerifications]);

  // Actions: Saved Schemes (synced with JDBC SavedSchemeRepository)
  const toggleSave = useCallback(async (id) => {
    const exists = saved.includes(id);
    const next = exists ? saved.filter(x => x !== id) : [...saved, id];
    setSaved(next);
    notify(exists ? 'Scheme removed from saved schemes' : 'Scheme saved successfully ✓', exists ? 'info' : 'success');

    try {
      if (exists) {
        await ApiClient.removeSavedScheme(1, id);
      } else {
        await ApiClient.saveScheme(1, id);
      }
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      console.warn('[JanSetu] Could not sync saved scheme with backend:', err.message);
      notify('Saved locally (Backend server offline)', 'info');
    }
  }, [saved, setSaved, notify]);

  // Actions: Scheme Verification (Producer-Consumer Queue)
  const submitVerification = useCallback(async (schemeId, priority = 1, notes = '') => {
    try {
      const res = await ApiClient.submitVerification(schemeId, priority, notes);
      setBackendOnline(true);
      notify(`Verification task #${res.id || 'N/A'} queued (Consumer thread processing...)`, 'success');
      loadVerifications();
      return res;
    } catch (err) {
      setBackendOnline(false);
      console.warn('[JanSetu] Verification request not sent to backend:', err.message);
      notify('Verification could not be queued (Backend offline)', 'error');
      throw err;
    }
  }, [notify, loadVerifications]);

  // Actions: Profile sync to JDBC UserRepository
  const syncProfileToBackend = useCallback(async (userData) => {
    try {
      await ApiClient.updateUser(1, userData);
      setBackendOnline(true);
      notify('Profile synced to MySQL via JDBC', 'success');
    } catch (err) {
      setBackendOnline(false);
      console.warn('[JanSetu] Could not sync profile to backend:', err.message);
      notify('Profile saved locally (Backend offline)', 'info');
    }
  }, [notify]);

  // Actions: Notifications
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  }, [setNotifications]);

  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const restoreNotifications = useCallback(() => {
    setNotifications(initialNotifications);
    notify('Demo notifications restored');
  }, [setNotifications, notify]);

  // Actions: Demo Scenarios
  const loadScenario = useCallback((scenarioType) => {
    if (scenarioType === 'student') {
      setProfileName('Aarav Sharma');
      setEligibility({ age: '20', state: 'Punjab', occupation: 'Student', income: '300000', education: 'Undergraduate' });
      setSaved([1, 2, 5]);
      notify('Student demo scenario loaded');
    } else if (scenarioType === 'clean') {
      setSaved([]);
      notify('Clean demo scenario loaded');
    } else {
      setProfileName('Guest User');
      setEligibility(defaultEligibility);
      setSaved([2]);
      setNotifications(initialNotifications);
      setReminderPreferences(defaultPreferences);
      notify('Demo data reset to default');
    }
  }, [setProfileName, setEligibility, setSaved, setNotifications, setReminderPreferences, notify]);

  const simulateApiError = useCallback(() => {
    setApiLoading(false);
    setApiSchemes([]);
    setApiError('Simulated connection error. Click Retry to reconnect.');
    notify('Simulated API error triggered', 'error');
  }, [notify]);

  const contextValue = {
    // Theme & Profile
    dark, setDark,
    profileName, setProfileName,
    authSession, setAuthSession,

    // Data
    schemes: displaySchemes,
    assessedSchemes,
    deadlineItems,
    saved, setSaved,
    eligibility, setEligibility,
    additionalProfile, setAdditionalProfile,
    notifications, setNotifications,
    visibleNotifications,
    reminderPreferences, setReminderPreferences,

    // Find-my-schemes
    findProfile, setFindProfile,
    findResults: findSchemeResults,
    findResultsReady: findProfile !== null,

    // Global explore state (no prop-drilling)
    exploreQuery, setExploreQuery,
    exploreCategory, setExploreCategory,
    exploreState, setExploreState,

    // API status & Backend Connectivity
    apiLoading, setApiLoading,
    apiError, setApiError,
    loadSchemes,
    simulateApiError,
    backendOnline,
    verificationTasks,
    loadVerifications,
    submitVerification,
    syncProfileToBackend,

    // Modal & Toast
    selectedScheme, setSelectedScheme,
    toast, toastType,
    notify,

    // Action Methods
    toggleSave,
    dismissNotification,
    dismissAllNotifications,
    restoreNotifications,
    loadScenario,
  };

  return (
    <JanSetuContext.Provider value={contextValue}>
      {children}
    </JanSetuContext.Provider>
  );
}

export function useJanSetu() {
  const context = useContext(JanSetuContext);
  if (!context) {
    throw new Error('useJanSetu must be used inside JanSetuProvider');
  }
  return context;
}

// Backwards-compatibility aliases
export const JanSetuConsumer = JanSetuContext.Consumer;
export const WelforaContext = JanSetuContext;
export const WelforaProvider = JanSetuProvider;
export const useWelfora = useJanSetu;
