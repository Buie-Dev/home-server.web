import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import StopIcon from '@mui/icons-material/Stop';
import { useRowing } from 'hooks/useRowing.hook';
import { useWebSocket, WEBSOCKET_TOPICS } from 'context/WebSocketContext';
import type { RaceEntry } from 'api/rowing.api';
import { PAGE_PATHS } from 'lib/pagesPaths';
import styles from './RaceTimer.module.scss';

type Role = 'start' | 'finish' | 'observer';

type LiveStartMap = Record<number, number>;

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function ElapsedTicker({ startTimestamp }: { startTimestamp: number }): ReactElement {
  const [now, setNow] = useState(Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (): void => {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <span className={styles.ticker}>{formatElapsed(Math.max(0, now - startTimestamp))}</span>;
}

function RaceTimer(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const navigate = useNavigate();

  const {
    activeRace,
    isLoading,
    loadRace,
    openRace,
    finishRace,
    sendBoatStart,
    sendBoatFinish,
    setEntryDns,
    setEntryDnf,
  } = useRowing();

  const { latestRowingStartEvent, latestRowingFinishEvent } = useWebSocket();

  const [role, setRole] = useState<Role | null>(null);
  const [liveStarts, setLiveStarts] = useState<LiveStartMap>({});
  const [finishing, setFinishing] = useState<Record<number, boolean>>({});
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);

  useEffect(() => {
    loadRace({ id: raceId });
  }, [raceId, loadRace]);

  // When a rowing/start event arrives from WebSocket (from another device),
  // record the start timestamp locally and refresh race state.
  useEffect(() => {
    if (!latestRowingStartEvent || latestRowingStartEvent.raceId !== raceId) return;
    setLiveStarts((prev) => ({ ...prev, [latestRowingStartEvent.entryId]: latestRowingStartEvent.timestamp }));
    loadRace({ id: raceId });
  }, [latestRowingStartEvent, raceId, loadRace]);

  // When a rowing/finish event arrives, remove from live starts and refresh race state
  // so the entry moves out of onCourseEntries and the ticker stops.
  useEffect(() => {
    if (!latestRowingFinishEvent || latestRowingFinishEvent.raceId !== raceId) return;
    setLiveStarts((prev) => {
      const next = { ...prev };
      delete next[latestRowingFinishEvent.entryId];
      return next;
    });
    loadRace({ id: raceId });
  }, [latestRowingFinishEvent, raceId, loadRace]);

  // Seed liveStarts from already-persisted start_times when the race loads.
  useEffect(() => {
    if (!activeRace) return;
    setLiveStarts((prev) => {
      const next = { ...prev };
      for (const entry of activeRace.entries) {
        if (entry.startTime !== null && entry.finishTime === null && !entry.dns && !entry.dnf) {
          if (!(entry.id in next)) {
            next[entry.id] = entry.startTime;
          }
        }
      }
      return next;
    });
  }, [activeRace]);

  const handleActivate = useCallback(async () => {
    await openRace({ id: raceId });
  }, [openRace, raceId]);

  const handleStart = useCallback(async (entry: RaceEntry) => {
    const timestamp = Date.now();
    setLiveStarts((prev) => ({ ...prev, [entry.id]: timestamp }));
    await sendBoatStart({ raceId, entryId: entry.id, boatName: entry.boatName, timestamp });
  }, [raceId, sendBoatStart]);

  const handleFinish = useCallback(async (entry: RaceEntry) => {
    const timestamp = Date.now();
    const startTimestamp = liveStarts[entry.id] ?? entry.startTime;
    if (startTimestamp === null || startTimestamp === undefined) return;
    const elapsedMs = timestamp - startTimestamp;
    setFinishing((prev) => ({ ...prev, [entry.id]: true }));
    try {
      await sendBoatFinish({ raceId, entryId: entry.id, boatName: entry.boatName, timestamp, elapsedMs });
      setLiveStarts((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
    } finally {
      setFinishing((prev) => ({ ...prev, [entry.id]: false }));
    }
  }, [raceId, liveStarts, sendBoatFinish]);

  const handleDns = useCallback(async (entryId: number) => {
    await setEntryDns({ entryId });
  }, [setEntryDns]);

  const handleDnf = useCallback(async (entryId: number) => {
    await setEntryDnf({ entryId });
  }, [setEntryDnf]);

  const handleCompleteRace = useCallback(async () => {
    await finishRace({ id: raceId });
    setConfirmCompleteOpen(false);
  }, [finishRace, raceId]);

  if (isLoading && !activeRace) {
    return <div className={styles.loading}>Loading race…</div>;
  }

  if (!activeRace) {
    return <div className={styles.loading}>Race not found.</div>;
  }

  const isSideBySide = activeRace.raceType === 'side_by_side';
  const allBoatsStarted = activeRace.entries.every((e) => e.startTime !== null || e.dns);
  const allBoatsFinished = activeRace.entries.every((e) => e.finishTime !== null || e.dns || e.dnf);

  const pendingEntries = activeRace.entries.filter((e) => e.startTime === null && !e.dns && !e.dnf);
  const onCourseEntries = activeRace.entries.filter((e) => e.startTime !== null && e.finishTime === null && !e.dns && !e.dnf);
  const finishedEntries = activeRace.entries.filter((e) => e.finishTime !== null && !e.dns && !e.dnf).sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
  const dnsEntries = activeRace.entries.filter((e) => e.dns);
  const dnfEntries = activeRace.entries.filter((e) => e.dnf);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(PAGE_PATHS.ROWING)}>
          <ArrowBackIcon fontSize="small" /> Races
        </button>
        <div className={styles.raceInfo}>
          <span className={styles.raceTitle}>{activeRace.distance}m</span>
          <span className={styles.raceType}>{activeRace.raceType === 'time_trial' ? 'Time Trial' : 'Side by Side'}</span>
          <span className={`${styles.statusPill} ${styles[activeRace.status]}`}>{activeRace.status}</span>
        </div>
        {activeRace.status === 'active' && allBoatsFinished && (
          <button className={styles.completeBtn} onClick={() => setConfirmCompleteOpen(true)}>
            <CheckCircleIcon fontSize="small" /> Complete Race
          </button>
        )}
      </div>

      {activeRace.windConditions && (
        <p className={styles.raceMeta}>Wind: {activeRace.windConditions}{activeRace.notes ? ` · ${activeRace.notes}` : ''}</p>
      )}

      {/* Role Selector */}
      {activeRace.status !== 'completed' && (
        <div className={styles.roleBar}>
          <span className={styles.roleLabel}>Your role:</span>
          {(['start', 'finish', 'observer'] as Role[]).map((r) => (
            <button
              key={r}
              className={`${styles.roleBtn} ${role === r ? styles.roleBtnActive : ''}`}
              onClick={() => setRole(r)}
            >
              {r === 'start' && <FlagIcon fontSize="small" />}
              {r === 'finish' && <SportsMartialArtsIcon fontSize="small" />}
              {r === 'observer' && <CheckCircleIcon fontSize="small" />}
              {r.charAt(0).toUpperCase() + r.slice(1)} Line
            </button>
          ))}
        </div>
      )}

      {/* Activate race */}
      {activeRace.status === 'pending' && role === 'start' && (
        <div className={styles.activatePanel}>
          <p className={styles.activateHint}>Race is not yet active. Activate it to begin timing.</p>
          <button className={styles.activateBtn} onClick={handleActivate}>
            <PlayArrowIcon /> Activate Race
          </button>
        </div>
      )}

      {/* Side by Side: single start for all boats */}
      {activeRace.status === 'active' && isSideBySide && role === 'start' && !allBoatsStarted && (
        <div className={styles.globalStartPanel}>
          <p className={styles.globalStartHint}>Tap Start All when all boats are on the line.</p>
          <button
            className={styles.globalStartBtn}
            onClick={async () => {
              const timestamp = Date.now();
              for (const entry of pendingEntries) {
                setLiveStarts((prev) => ({ ...prev, [entry.id]: timestamp }));
                await sendBoatStart({ raceId, entryId: entry.id, boatName: entry.boatName, timestamp });
              }
            }}
          >
            <PlayArrowIcon fontSize="large" /> Start All
          </button>
        </div>
      )}

      {/* Pending (not yet started) */}
      {activeRace.status === 'active' && pendingEntries.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Waiting to Start</h2>
          <div className={styles.entryGrid}>
            {pendingEntries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <span className={styles.entryBoat}>{entry.boatName}</span>
                {role === 'start' && !isSideBySide && (
                  <button className={styles.startBtn} onClick={() => handleStart(entry)}>
                    <PlayArrowIcon fontSize="small" /> Start
                  </button>
                )}
                {role === 'start' && (
                  <button className={styles.dnsBtn} onClick={() => handleDns(entry.id)}>DNS</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* On course (started, not yet finished) */}
      {onCourseEntries.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>On Course</h2>
          <div className={styles.entryGrid}>
            {onCourseEntries.map((entry) => {
              const startTs = liveStarts[entry.id] ?? entry.startTime;
              return (
                <div key={entry.id} className={`${styles.entryCard} ${styles.entryOnCourse}`}>
                  <span className={styles.entryBoat}>{entry.boatName}</span>
                  {startTs !== null && <ElapsedTicker startTimestamp={startTs} />}
                  {role === 'finish' && (
                    <button
                      className={styles.finishBtn}
                      onClick={() => handleFinish(entry)}
                      disabled={finishing[entry.id]}
                    >
                      <StopIcon fontSize="small" />
                      {finishing[entry.id] ? 'Saving…' : 'Finish'}
                    </button>
                  )}
                  {role === 'finish' && (
                    <button className={styles.dnfBtn} onClick={() => handleDnf(entry.id)}>DNF</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Finished results */}
      {finishedEntries.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Results</h2>
          <div className={styles.resultsTable}>
            {finishedEntries.map((entry) => (
              <div key={entry.id} className={styles.resultRow}>
                <span className={styles.resultPlacement}>
                  {entry.placement === 1 ? '🥇' : entry.placement === 2 ? '🥈' : entry.placement === 3 ? '🥉' : entry.placement !== null ? `#${entry.placement}` : '—'}
                </span>
                <span className={styles.resultBoat}>{entry.boatName}</span>
                <span className={styles.resultTime}>
                  {entry.elapsedMs !== null ? formatElapsed(entry.elapsedMs) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DNS / DNF */}
      {(dnsEntries.length > 0 || dnfEntries.length > 0) && (
        <div className={styles.section}>
          {dnsEntries.map((entry) => (
            <div key={entry.id} className={`${styles.entryCard} ${styles.entryDns}`}>
              <span className={styles.dnsBadge}>DNS</span>
              <span className={styles.entryBoat}>{entry.boatName}</span>
            </div>
          ))}
          {dnfEntries.map((entry) => (
            <div key={entry.id} className={`${styles.entryCard} ${styles.entryDnf}`}>
              <span className={styles.dnfBadge}>DNF</span>
              <span className={styles.entryBoat}>{entry.boatName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confirm complete modal */}
      {confirmCompleteOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmCompleteOpen(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.confirmTitle}>Complete Race?</h2>
            <p className={styles.confirmText}>This will finalise placements and mark the race as completed.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmCompleteOpen(false)}>Cancel</button>
              <button className={styles.completeConfirmBtn} onClick={handleCompleteRace}>Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RaceTimer;
