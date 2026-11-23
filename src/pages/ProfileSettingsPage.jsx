import { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Bookmark,
  Bell,
  GraduationCap,
  Eraser,
  RotateCcw,
  AlertTriangle,
  FolderOpen,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { useJanSetu } from '../context/JanSetuContext';
import { ApiClient } from '../services/apiClient';

export default function ProfileSettingsPage({ title = 'Profile', go }) {
  const {
    profileName,
    setProfileName,
    dark,
    setDark,
    saved,
    schemes,
    verificationTasks,
    submitVerification,
    loadScenario,
    simulateApiError,
    loadSchemes,
    notify,
  } = useJanSetu();

  // Admin CSV & Multithreading State
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Admin Verification Producer-Consumer State
  const [schemeToVerify, setSchemeToVerify] = useState('1');
  const [verifyPriority, setVerifyPriority] = useState('3');
  const [verifyNotes, setVerifyNotes] = useState('Admin eligibility & criteria audit');
  const [isQueuingVerification, setIsQueuingVerification] = useState(false);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleStartImport = async () => {
    try {
      setIsImporting(true);
      const res = await ApiClient.startCsvImport(selectedFile);
      const jobId = res.jobId;
      setActiveJob({
        jobId,
        status: res.status || 'QUEUED',
        progressPercent: 0,
        threadState: res.threadState || 'NEW',
        message: res.message || 'Worker thread started.',
      });

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        try {
          const job = await ApiClient.getJobStatus(jobId);
          setActiveJob(job);
          if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(job.status)) {
            clearInterval(pollTimerRef.current);
            setIsImporting(false);
            if (job.status === 'COMPLETED') {
              notify?.(`CSV Import completed: ${job.report?.importedCount ?? 0} schemes added`, 'success');
              loadSchemes?.();
            } else if (job.status === 'CANCELLED') {
              notify?.('CSV Import job was cancelled', 'info');
            } else {
              notify?.(`CSV Import failed: ${job.message}`, 'error');
            }
          }
        } catch {
          clearInterval(pollTimerRef.current);
          setIsImporting(false);
        }
      }, 700);
    } catch (err) {
      setIsImporting(false);
      notify?.(`Could not start import: ${err.message}`, 'error');
    }
  };

  const handleCancelJob = async () => {
    if (!activeJob?.jobId) return;
    try {
      await ApiClient.cancelJob(activeJob.jobId);
      notify?.('Interrupt signal sent to background Thread', 'info');
    } catch (err) {
      notify?.(`Could not cancel job: ${err.message}`, 'error');
    }
  };

  const handleExportCsv = () => {
    window.open(ApiClient.getExportUrl(), '_blank');
  };

  const handleQueueVerification = async (e) => {
    e.preventDefault();
    if (!schemeToVerify) return;
    try {
      setIsQueuingVerification(true);
      await submitVerification(
        Number(schemeToVerify),
        Number(verifyPriority),
        verifyNotes
      );
    } catch (err) {
      // Handled in context
    } finally {
      setIsQueuingVerification(false);
    }
  };

  return (
    <section className="page-content">
      <PageTitle
        eyebrow="YOUR WORKSPACE"
        title={title}
        subtitle="Personalize your JanSetu demo experience and test application scenarios."
      />

      <div className="panel settings-panel">
        <div className="settings-avatar">
          {profileName.charAt(0).toUpperCase()}
        </div>

        <label>
          Display name
          <input
            aria-label="Display name"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
          />
        </label>

        <div className="setting-row">
          <div>
            <b>Appearance</b>
            <p>Switch between the clean light theme and dark theme.</p>
          </div>
          <button className="outline-btn" onClick={() => setDark(!dark)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>

        <div className="setting-row">
          <div>
            <b>Saved schemes</b>
            <p>{saved.length} scheme(s) saved on this device.</p>
          </div>
          <button className="outline-btn" onClick={() => go('Saved Schemes')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={15} /> View saved
          </button>
        </div>

        <div className="setting-row">
          <div>
            <b>Deadline reminders</b>
            <p>Control in-app deadline and tip notifications.</p>
          </div>
          <button className="outline-btn" onClick={() => go('Notifications')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={15} /> Manage reminders
          </button>
        </div>

        {/* Demo Scenarios & Test Suite */}
        <div className="setting-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <b>Demo Scenarios & Testing</b>
            <p>Switch between demo personas or test error handling.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="outline-btn"
              onClick={() => loadScenario('student')}
              title="Preloads a student profile with education scholarships"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <GraduationCap size={15} /> Student Scenario
            </button>
            <button
              className="outline-btn"
              onClick={() => loadScenario('clean')}
              title="Clears all saved schemes"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Eraser size={15} /> Clean Scenario
            </button>
            <button
              className="outline-btn"
              onClick={() => loadScenario('default')}
              title="Resets profile and demo data to default"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={15} /> Reset Demo Data
            </button>
            <button
              className="outline-btn"
              onClick={simulateApiError}
              title="Simulates network/API error to test banner and retry button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <AlertTriangle size={15} color="#eab308" /> Simulate API Error
            </button>
          </div>
        </div>

        {/* Java Core Practical: Admin CSV Import/Export & Multithreading */}
        <div className="setting-row" style={{ flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '16px' }}>
          <div>
            <b>Scheme Database Administration (Java Backend)</b>
            <p>Import/Export schemes via CSV using Java File I/O (BufferedReader, BufferedWriter) and background Threads.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={e => setSelectedFile(e.target.files[0] || null)}
            />
            <button
              className="outline-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Choose a custom CSV file to import"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FolderOpen size={15} /> {selectedFile ? selectedFile.name : 'Choose CSV'}
            </button>
            <button
              className="primary-btn"
              disabled={isImporting}
              onClick={handleStartImport}
              title="Runs async import on a background Java Thread"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isImporting ? <Loader2 size={15} className="spinner" /> : <Upload size={15} />}
              {isImporting ? 'Importing...' : 'Import Schemes (CSV)'}
            </button>
            <button
              className="outline-btn"
              onClick={handleExportCsv}
              title="Exports schemes to CSV using BufferedWriter with binary backup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> Export Schemes (CSV)
            </button>
          </div>

          {/* Polling Progress Bar & Background Thread Monitor */}
          {activeJob && (
            <div style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>
                  Job ID: <b>{activeJob.jobId}</b> | Status: <b>{activeJob.status}</b> | Thread.getState(): <code>{activeJob.threadState}</code>
                </span>
                <span>{activeJob.progressPercent || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${activeJob.progressPercent || 0}%`,
                  height: '100%',
                  background: activeJob.status === 'FAILED' ? '#ef4444' : activeJob.status === 'CANCELLED' ? '#eab308' : '#38bdf8',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <small style={{ color: 'var(--text-muted, #94a3b8)' }}>{activeJob.message}</small>
                {isImporting && (
                  <button
                    className="outline-btn danger-btn small"
                    onClick={handleCancelJob}
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  >
                    Cancel Job (Thread.interrupt())
                  </button>
                )}
              </div>

              {activeJob.report && (
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', borderTop: '1px dashed var(--border, rgba(255,255,255,0.1))', paddingTop: '8px' }}>
                  Imported: <b>{activeJob.report.importedCount}</b> | Duplicates Skipped: <b>{activeJob.report.duplicatesSkipped}</b>
                  {activeJob.report.invalidRows?.length > 0 && (
                    <div style={{ color: '#ef4444', marginTop: '4px' }}>
                      Invalid rows: {activeJob.report.invalidRows.map(r => `Line ${r.lineNumber}: ${r.reason}`).join('; ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Java Core Practical: Scheme Verification Pipeline (Producer-Consumer Multithreading) */}
        <div className="setting-row" style={{ flexWrap: 'wrap', gap: '14px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '16px' }}>
          <div>
            <b>Scheme Verification Pipeline (Producer-Consumer Queue)</b>
            <p>Producer pushes verification requests into a bounded queue (wait/notifyAll). A background Consumer Thread validates criteria and updates MySQL via JDBC.</p>
          </div>

          <form onSubmit={handleQueueVerification} style={{ width: '100%', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: 'var(--text-muted, #94a3b8)' }}>Select Scheme</label>
              <select
                value={schemeToVerify}
                onChange={e => setSchemeToVerify(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border, #cbd5e1)', background: 'var(--bg, transparent)', color: 'inherit' }}
              >
                {(schemes || []).map(s => (
                  <option key={s.id} value={s.id}>#{s.id} - {s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: 'var(--text-muted, #94a3b8)' }}>Priority</label>
              <select
                value={verifyPriority}
                onChange={e => setVerifyPriority(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border, #cbd5e1)', background: 'var(--bg, transparent)', color: 'inherit' }}
              >
                <option value="1">1 - Standard</option>
                <option value="3">3 - Normal</option>
                <option value="5">5 - High Priority</option>
              </select>
            </div>

            <div style={{ flex: '2 1 200px' }}>
              <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: 'var(--text-muted, #94a3b8)' }}>Audit Notes</label>
              <input
                type="text"
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                placeholder="Verification checklist notes..."
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border, #cbd5e1)', background: 'var(--bg, transparent)', color: 'inherit' }}
              />
            </div>

            <div>
              <button
                type="submit"
                className="primary-btn"
                disabled={isQueuingVerification}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px' }}
              >
                {isQueuingVerification ? <Loader2 size={15} className="spinner" /> : <Upload size={15} />}
                Submit Scheme for Verification (Producer)
              </button>
            </div>
          </form>

          {/* Active Verification Tasks Table */}
          <div style={{ width: '100%', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600 }}>Active Tasks in Queue & Database ({verificationTasks.length})</span>
              <small style={{ color: 'var(--text-muted, #94a3b8)' }}>Consumer thread auto-refreshes every 4s</small>
            </div>

            {verificationTasks.length === 0 ? (
              <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border, #cbd5e1)', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                No verification tasks queued yet. Submit a scheme above to watch the producer-consumer thread lifecycle in action.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid var(--border, #cbd5e1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(128,128,128,0.1)', borderBottom: '1px solid var(--border, #cbd5e1)' }}>
                      <th style={{ padding: '8px 12px' }}>Task #</th>
                      <th style={{ padding: '8px 12px' }}>Scheme</th>
                      <th style={{ padding: '8px 12px' }}>Priority</th>
                      <th style={{ padding: '8px 12px' }}>Status (Thread State)</th>
                      <th style={{ padding: '8px 12px' }}>Notes</th>
                      <th style={{ padding: '8px 12px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationTasks.slice(0, 8).map(task => {
                      const isCompleted = task.status === 'VERIFIED' || task.status === 'COMPLETED';
                      const isProcessing = task.status === 'PROCESSING';
                      return (
                        <tr key={task.id} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>#{task.id}</td>
                          <td style={{ padding: '8px 12px' }}>{task.schemeName || `Scheme #${task.schemeId}`}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: task.priority >= 5 ? '#fef3c7' : 'rgba(128,128,128,0.15)', color: task.priority >= 5 ? '#b45309' : 'inherit', fontWeight: 600 }}>
                              P{task.priority || 1}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: isCompleted ? '#dcfce7' : isProcessing ? '#e0f2fe' : '#fef9c3',
                              color: isCompleted ? '#15803d' : isProcessing ? '#0369a1' : '#a16207'
                            }}>
                              {isProcessing && <Loader2 size={12} className="spinner" />}
                              {isCompleted && <CheckCircle2 size={12} />}
                              {!isProcessing && !isCompleted && <Clock size={12} />}
                              {task.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)' }}>{task.notes || '—'}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>
                            {task.createdAt ? new Date(task.createdAt).toLocaleTimeString() : 'Just now'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <p className="disclaimer">
          Saved schemes, preferences and notification dismissals are stored locally in this browser. Scheme records and dates are illustrative, not official. Reset demo data restores a predictable starting state.
        </p>
      </div>
    </section>
  );
}
