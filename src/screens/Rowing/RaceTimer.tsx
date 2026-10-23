import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import StopIcon from '@mui/icons-material/Stop';
import { useRowing } from 'hooks/useRowing.hook';
import useBodyScrollLock from 'hooks/useBodyScrollLock.hook';
import useConfirm from 'hooks/useConfirm.hook';
import { useWebSocket } from 'context/WebSocketContext';
import type { Boat, Crew, CrewMember, CrewSeats, RaceEntry, Gender, AgeCategory } from 'api/rowing.api';
import { PAGE_PATHS } from 'lib/pagesPaths';
import styles from './RaceTimer.module.scss';

type Role = 'start' | 'finish' | 'observer';
type LiveStartMap = Record<number, number>;

const AGE_CATEGORIES = ['Open', 'U15', 'U17', 'U19', 'U23'] as const;

const EMPTY_SEATS: CrewSeats = {
  cox: null,
  seat1: null,
  seat2: null,
  seat3: null,
  seat4: null,
  seat5: null,
  seat6: null,
  seat7: null,
  seat8: null,
};

function getSeatLabel(seatKey: string, crewCount: number): string {
  if (seatKey === 'cox') return 'Cox';
  const n = parseInt(seatKey.replace('seat', ''));
  if (crewCount === 1) return 'Sculler';
  if (n === 1) return 'Stroke';
  if (n === crewCount) return 'Bow';
  return String(crewCount - n + 1);
}

function buildSeatKeys(hasCox: boolean, crewCount: number): string[] {
  const keys: string[] = [];
  if (hasCox) keys.push('cox');
  for (let i = 1; i <= crewCount; i++) keys.push(`seat${i}`);
  return keys;
}

function getCrewSummary(crew: Crew | null, entry?: RaceEntry): string {
  const parts: string[] = [];
  if (crew) {
    if (crew.crewClassName) parts.push(crew.crewClassName);
    if (crew.boatClassHasCox) {
      parts.push(crew.cox ? `Cox: ${crew.cox.name}` : 'No cox assigned');
    } else if (crew.seat1) {
      parts.push(`Stroke: ${crew.seat1.name}`);
    }
  } else if (entry?.keyPerson) {
    parts.push(entry.keyPerson);
  }
  return parts.join(' · ');
}

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function formatPlacement(rank: number | null): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank !== null ? `#${rank}` : '—';
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

// ── Lineup View Modal ──────────────────────────────────────────────────────────

function LineupViewModal({
  entry,
  crew,
  onClose,
}: {
  entry: RaceEntry;
  crew: Crew | null;
  onClose: () => void;
}): ReactElement {
  useBodyScrollLock();
  const crewCount = crew?.boatClassCrewCount ?? 1;
  const hasCox = crew?.boatClassHasCox ?? false;
  const seatKeys = buildSeatKeys(hasCox, crewCount);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.lineupModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.lineupViewHeader}>
          <h2 className={styles.confirmTitle}>{entry.boatName}</h2>
          {crew?.crewClassName && <p className={styles.lineupViewClass}>{crew.crewClassName}</p>}
        </div>
        {crew ? (
          <div className={styles.lineupSeatTable}>
            {seatKeys.map((key) => {
              const slot =
                key === 'cox' ? crew.cox : (crew[key as keyof Crew] as { name: string; gender: string } | null);
              const label = getSeatLabel(key, crewCount);
              return (
                <div key={key} className={styles.lineupSeatRow}>
                  <span className={`${styles.lineupSeatLabel} ${key === 'cox' ? styles.lineupSeatLabelCox : ''}`}>
                    {label}
                  </span>
                  <span className={styles.lineupViewName}>
                    {slot ? slot.name : <em className={styles.lineupViewEmpty}>unassigned</em>}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.confirmText}>No crew assigned to this entry.</p>
        )}
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Lineup Modal ──────────────────────────────────────────────────────────

function EditLineupModal({
  entry,
  crew,
  boats,
  crewMembers,
  onClose,
  onSubmit,
}: {
  entry: RaceEntry;
  crew: Crew | null;
  boats: Boat[];
  crewMembers: CrewMember[];
  onClose: () => void;
  onSubmit: (params: { boatId: number; gender: Gender; ageCategory: AgeCategory; seats: CrewSeats }) => Promise<void>;
}): ReactElement {
  useBodyScrollLock();
  const [selectedBoatId, setSelectedBoatId] = useState<number>(crew?.boatId ?? 0);
  const [gender, setGender] = useState<Gender>(crew?.gender ?? 'Men');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>(crew?.ageCategory ?? 'Open');
  const [seats, setSeats] = useState<CrewSeats>(() => {
    if (!crew) return { ...EMPTY_SEATS };
    return {
      cox: crew.cox?.crewMemberId ?? null,
      seat1: crew.seat1?.crewMemberId ?? null,
      seat2: crew.seat2?.crewMemberId ?? null,
      seat3: crew.seat3?.crewMemberId ?? null,
      seat4: crew.seat4?.crewMemberId ?? null,
      seat5: crew.seat5?.crewMemberId ?? null,
      seat6: crew.seat6?.crewMemberId ?? null,
      seat7: crew.seat7?.crewMemberId ?? null,
      seat8: crew.seat8?.crewMemberId ?? null,
    };
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const crewCount = crew?.boatClassCrewCount ?? 1;
  const hasCox = crew?.boatClassHasCox ?? false;
  const seatKeys = buildSeatKeys(hasCox, crewCount);
  const usedIds = new Set(Object.values(seats).filter((v): v is number => v !== null));
  const sameClassBoats = boats.filter((b) => b.boatClassId !== null && b.boatClassId === crew?.boatClassId);

  const handleSeatChange = (key: string, value: string): void => {
    setSeats((prev) => ({ ...prev, [key]: value === '' ? null : Number(value) }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!crew) return;
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({ boatId: selectedBoatId, gender, ageCategory, seats });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save lineup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.lineupModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.confirmTitle}>Edit Lineup — {entry.boatName}</h2>

        {sameClassBoats.length > 1 && (
          <div className={styles.lineupField}>
            <span className={styles.lineupFieldLabel}>
              Boat <span className={styles.lineupFieldHint}>({crew?.boatClassSymbol})</span>
            </span>
            <div className={styles.lineupChipRow}>
              {sameClassBoats.map((boat) => (
                <button
                  key={boat.id}
                  className={`${styles.lineupChip} ${selectedBoatId === boat.id ? styles.lineupChipActive : ''}`}
                  onClick={() => setSelectedBoatId(boat.id)}
                >
                  {boat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.lineupField}>
          <span className={styles.lineupFieldLabel}>Gender</span>
          <div className={styles.lineupChipRow}>
            {(['Men', 'Women', 'Mixed'] as Gender[]).map((g) => (
              <button
                key={g}
                className={`${styles.lineupChip} ${gender === g ? styles.lineupChipActive : ''}`}
                onClick={() => setGender(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.lineupField}>
          <span className={styles.lineupFieldLabel}>Age Category</span>
          <div className={styles.lineupChipRow}>
            {AGE_CATEGORIES.map((age) => (
              <button
                key={age}
                className={`${styles.lineupChip} ${ageCategory === age ? styles.lineupChipActive : ''}`}
                onClick={() => setAgeCategory(age)}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {!crew && <p className={styles.confirmError}>No crew assigned to this entry.</p>}

        {crew && (
          <div className={styles.lineupSeatTable}>
            {seatKeys.map((key) => {
              const label = getSeatLabel(key, crewCount);
              const selectedId = seats[key as keyof CrewSeats];
              return (
                <div key={key} className={styles.lineupSeatRow}>
                  <span className={`${styles.lineupSeatLabel} ${key === 'cox' ? styles.lineupSeatLabelCox : ''}`}>
                    {label}
                  </span>
                  <select
                    className={styles.lineupSeatSelect}
                    value={selectedId ?? ''}
                    onChange={(e) => handleSeatChange(key, e.target.value)}
                  >
                    <option value="">— unassigned —</option>
                    {crewMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.gender ? ` (${m.gender})` : ''}
                        {usedIds.has(m.id) && selectedId !== m.id ? ' — in boat' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {formError && <p className={styles.confirmError}>{formError}</p>}
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.completeConfirmBtn} onClick={handleSubmit} disabled={saving || !crew}>
            {saving ? 'Saving…' : 'Save Lineup'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Race Timer ─────────────────────────────────────────────────────────────────

function RaceTimer(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const navigate = useNavigate();

  const {
    activeRace,
    boats,
    crews,
    crewMembers,
    isLoading,
    loadRace,
    fetchAllCrews,
    fetchAllBoats,
    fetchAllCrew,
    finishRace,
    sendBoatStart,
    sendBoatFinish,
    setEntryDns,
    setEntryDnf,
    editCrewLineup,
    removeEntry,
  } = useRowing();

  const { confirm, confirmElement } = useConfirm();
  const { latestRowingStartEvent, latestRowingFinishEvent } = useWebSocket();

  const [role, setRole] = useState<Role | null>(null);
  const [rankBy, setRankBy] = useState<'time' | 'wbt'>('wbt');
  const [liveStarts, setLiveStarts] = useState<LiveStartMap>({});
  const [finishing, setFinishing] = useState<Record<number, boolean>>({});
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [lineupEditEntry, setLineupEditEntry] = useState<RaceEntry | null>(null);
  const [viewLineupEntry, setViewLineupEntry] = useState<RaceEntry | null>(null);
  useBodyScrollLock(confirmCompleteOpen);
  const stableEntryOrderRef = useRef<number[]>([]);

  useEffect(() => {
    loadRace({ id: raceId });
    fetchAllCrews();
    fetchAllCrew();
    fetchAllBoats();
  }, [raceId, loadRace, fetchAllCrews, fetchAllCrew, fetchAllBoats]);

  useEffect(() => {
    if (!latestRowingStartEvent || latestRowingStartEvent.raceId !== raceId) return;
    setLiveStarts((prev) => ({ ...prev, [latestRowingStartEvent.entryId]: latestRowingStartEvent.timestamp }));
    loadRace({ id: raceId });
  }, [latestRowingStartEvent, raceId, loadRace]);

  useEffect(() => {
    if (!latestRowingFinishEvent || latestRowingFinishEvent.raceId !== raceId) return;
    setLiveStarts((prev) => {
      const next = { ...prev };
      delete next[latestRowingFinishEvent.entryId];
      return next;
    });
    loadRace({ id: raceId });
  }, [latestRowingFinishEvent, raceId, loadRace]);

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

  const handleStart = useCallback(
    async (entry: RaceEntry) => {
      const timestamp = Date.now();
      setLiveStarts((prev) => ({ ...prev, [entry.id]: timestamp }));
      await sendBoatStart({ raceId, entryId: entry.id, boatName: entry.boatName, timestamp });
    },
    [raceId, sendBoatStart]
  );

  const handleFinish = useCallback(
    async (entry: RaceEntry) => {
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
    },
    [raceId, liveStarts, sendBoatFinish]
  );

  const handleDns = useCallback(
    async (entryId: number) => {
      await setEntryDns({ entryId });
    },
    [setEntryDns]
  );

  const handleDnf = useCallback(
    async (entryId: number) => {
      await setEntryDnf({ entryId });
    },
    [setEntryDnf]
  );

  const handleCompleteRace = useCallback(async () => {
    await finishRace({ id: raceId });
    setConfirmCompleteOpen(false);
  }, [finishRace, raceId]);

  const handleRemoveEntry = useCallback(
    async (entry: RaceEntry) => {
      const confirmed = await confirm({
        title: 'Remove Entry',
        message: `Remove ${entry.boatName} from this race?`,
        confirmLabel: 'Remove',
        variant: 'danger',
      });
      if (!confirmed) return;
      await removeEntry({ entryId: entry.id });
    },
    [confirm, removeEntry]
  );

  const handleEditLineup = useCallback(
    async ({
      boatId,
      gender,
      ageCategory,
      seats,
    }: {
      boatId: number;
      gender: Gender;
      ageCategory: AgeCategory;
      seats: CrewSeats;
    }) => {
      if (!lineupEditEntry?.crewId) return;
      await editCrewLineup({ id: lineupEditEntry.crewId, boatId, gender, ageCategory, ...seats });
    },
    [lineupEditEntry, editCrewLineup]
  );

  // Lock entry order on first load so positions never shift during a live race
  useEffect(() => {
    if (activeRace?.entries.length && stableEntryOrderRef.current.length === 0) {
      stableEntryOrderRef.current = activeRace.entries.map((e) => e.id);
    }
  }, [activeRace]);

  if (isLoading && !activeRace) {
    return <div className={styles.loading}>Loading race…</div>;
  }

  if (!activeRace) {
    return <div className={styles.loading}>Race not found.</div>;
  }

  const stableOrder = stableEntryOrderRef.current;
  const byStableOrder = (a: RaceEntry, b: RaceEntry): number => {
    const ai = stableOrder.indexOf(a.id);
    const bi = stableOrder.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  };

  const isSideBySide = activeRace.raceType === 'side_by_side';
  const allBoatsStarted = activeRace.entries.every((e) => e.startTime !== null || e.dns);
  const allBoatsFinished = activeRace.entries.every((e) => e.finishTime !== null || e.dns || e.dnf);
  const hasWbt = activeRace.entries.some((e) => e.wbtPct !== null);

  const pendingEntries = activeRace.entries.filter((e) => e.startTime === null && !e.dns && !e.dnf);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(PAGE_PATHS.ROWING)}>
          <ArrowBackIcon fontSize="small" /> Races
        </button>
        <div className={styles.raceInfo}>
          <span className={styles.raceTitle}>{activeRace.distance}m</span>
          <span className={styles.raceType}>
            {activeRace.raceType === 'time_trial' ? 'Time Trial' : 'Side by Side'}
          </span>
          <span className={`${styles.statusPill} ${styles[activeRace.status]}`}>{activeRace.status}</span>
        </div>
        {activeRace.status !== 'completed' && allBoatsFinished && (
          <button className={styles.completeBtn} onClick={() => setConfirmCompleteOpen(true)}>
            <CheckCircleIcon fontSize="small" /> Complete Race
          </button>
        )}
      </div>

      {activeRace.windConditions && (
        <p className={styles.raceMeta}>
          Wind: {activeRace.windConditions}
          {activeRace.notes ? ` · ${activeRace.notes}` : ''}
        </p>
      )}

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

      {activeRace.status !== 'completed' && isSideBySide && role === 'start' && !allBoatsStarted && (
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

      <div className={styles.section}>
        {activeRace.status === 'completed' && hasWbt && (
          <div className={styles.rankBar}>
            <span className={styles.rankLabel}>Rank by</span>
            <button
              className={`${styles.rankBtn} ${rankBy === 'time' ? styles.rankBtnActive : ''}`}
              onClick={() => setRankBy('time')}
            >
              Time
            </button>
            <button
              className={`${styles.rankBtn} ${rankBy === 'wbt' ? styles.rankBtnActive : ''}`}
              onClick={() => setRankBy('wbt')}
            >
              WBT%
            </button>
          </div>
        )}
        <div className={styles.entryGrid}>
          {(() => {
            const wbtRanks = new Map(
              [...activeRace.entries]
                .filter((e) => e.wbtPct !== null)
                .sort((a, b) => (b.wbtPct ?? -1) - (a.wbtPct ?? -1))
                .map((e, i) => [e.id, i + 1])
            );
            return [...activeRace.entries]
              .sort(
                activeRace.status === 'completed'
                  ? rankBy === 'wbt'
                    ? (a, b) => (b.wbtPct ?? -1) - (a.wbtPct ?? -1)
                    : (a, b) => (a.placement ?? 999) - (b.placement ?? 999)
                  : byStableOrder
              )
              .map((entry) => {
                const crew = crews.find((c) => c.id === entry.crewId) ?? null;
                const startTs = liveStarts[entry.id] ?? entry.startTime;

                if (entry.dns) {
                  return (
                    <div key={entry.id} className={`${styles.entryCard} ${styles.entryDns}`}>
                      <span className={styles.dnsBadge}>DNS</span>
                      <button className={styles.entryInfo} onClick={() => setViewLineupEntry(entry)}>
                        <span className={styles.entryBoat}>{entry.boatName}</span>
                        <span className={styles.entryCrew}>{getCrewSummary(crew, entry)}</span>
                      </button>
                      <button
                        className={styles.reassignBtn}
                        onClick={() => setLineupEditEntry(entry)}
                        title="Edit lineup"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveEntry(entry)}
                        title="Remove from race"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  );
                }

                if (entry.dnf) {
                  return (
                    <div key={entry.id} className={`${styles.entryCard} ${styles.entryDnf}`}>
                      <span className={styles.dnfBadge}>DNF</span>
                      <button className={styles.entryInfo} onClick={() => setViewLineupEntry(entry)}>
                        <span className={styles.entryBoat}>{entry.boatName}</span>
                        <span className={styles.entryCrew}>{getCrewSummary(crew, entry)}</span>
                      </button>
                      <button
                        className={styles.reassignBtn}
                        onClick={() => setLineupEditEntry(entry)}
                        title="Edit lineup"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveEntry(entry)}
                        title="Remove from race"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  );
                }

                if (entry.finishTime !== null) {
                  return (
                    <div key={entry.id} className={`${styles.entryCard} ${styles.entryFinished}`}>
                      <span className={styles.resultPlacement}>
                        {formatPlacement(rankBy === 'wbt' ? (wbtRanks.get(entry.id) ?? null) : entry.placement)}
                      </span>
                      <button className={styles.entryInfo} onClick={() => setViewLineupEntry(entry)}>
                        <span className={styles.entryBoat}>{entry.boatName}</span>
                        <span className={styles.entryCrew}>{getCrewSummary(crew, entry)}</span>
                      </button>
                      <div className={styles.resultTimeBlock}>
                        <span className={styles.resultTime}>
                          {entry.elapsedMs !== null ? formatElapsed(entry.elapsedMs) : '—'}
                        </span>
                        {entry.wbtPct !== null && (
                          <span className={styles.wbtBadge}>
                            {entry.wbtPct.toFixed(1)}% WBT{entry.wbtIsEstimated ? '*' : ''}
                          </span>
                        )}
                      </div>
                      <button
                        className={styles.reassignBtn}
                        onClick={() => setLineupEditEntry(entry)}
                        title="Edit lineup"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveEntry(entry)}
                        title="Remove from race"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  );
                }

                if (entry.startTime !== null) {
                  return (
                    <div key={entry.id} className={`${styles.entryCard} ${styles.entryOnCourse}`}>
                      <button className={styles.entryInfo} onClick={() => setViewLineupEntry(entry)}>
                        <span className={styles.entryBoat}>{entry.boatName}</span>
                        <span className={styles.entryCrew}>{getCrewSummary(crew, entry)}</span>
                      </button>
                      {startTs !== null && <ElapsedTicker startTimestamp={startTs} />}
                      <div className={styles.entryActions}>
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
                          <button className={styles.dnfBtn} onClick={() => handleDnf(entry.id)}>
                            DNF
                          </button>
                        )}
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemoveEntry(entry)}
                          title="Remove from race"
                        >
                          <CloseIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Pending
                return (
                  <div key={entry.id} className={styles.entryCard}>
                    <button className={styles.entryInfo} onClick={() => setViewLineupEntry(entry)}>
                      <span className={styles.entryBoat}>{entry.boatName}</span>
                      <span className={styles.entryCrew}>{getCrewSummary(crew, entry)}</span>
                    </button>
                    <div className={styles.entryActions}>
                      {activeRace.status !== 'completed' && role === 'start' && !isSideBySide && (
                        <button className={styles.startBtn} onClick={() => handleStart(entry)}>
                          <PlayArrowIcon fontSize="small" /> Start
                        </button>
                      )}
                      {activeRace.status !== 'completed' && role === 'start' && (
                        <button className={styles.dnsBtn} onClick={() => handleDns(entry.id)}>
                          DNS
                        </button>
                      )}
                      <button
                        className={styles.reassignBtn}
                        onClick={() => setLineupEditEntry(entry)}
                        title="Edit lineup"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveEntry(entry)}
                        title="Remove from race"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      </div>

      {confirmCompleteOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmCompleteOpen(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.confirmTitle}>Complete Race?</h2>
            <p className={styles.confirmText}>This will finalise placements and mark the race as completed.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmCompleteOpen(false)}>
                Cancel
              </button>
              <button className={styles.completeConfirmBtn} onClick={handleCompleteRace}>
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLineupEntry && (
        <LineupViewModal
          entry={viewLineupEntry}
          crew={crews.find((c) => c.id === viewLineupEntry.crewId) ?? null}
          onClose={() => setViewLineupEntry(null)}
        />
      )}

      {lineupEditEntry && (
        <EditLineupModal
          entry={lineupEditEntry}
          crew={crews.find((c) => c.id === lineupEditEntry.crewId) ?? null}
          boats={boats}
          crewMembers={crewMembers}
          onClose={() => setLineupEditEntry(null)}
          onSubmit={handleEditLineup}
        />
      )}

      {confirmElement}
    </div>
  );
}

export default RaceTimer;
