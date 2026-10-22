import { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SpeedIcon from '@mui/icons-material/Speed';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import TimerIcon from '@mui/icons-material/Timer';
import { useRowing } from 'hooks/useRowing.hook';
import useBodyScrollLock from 'hooks/useBodyScrollLock.hook';
import useConfirm from 'hooks/useConfirm.hook';
import type { Boat, BoatClass, Crew, CrewMember, CrewSeats, Race, RaceType, Gender, AgeCategory } from 'api/rowing.api';
import { PAGE_PATHS } from 'lib/pagesPaths';
import { formatDate, dateFormats } from 'lib/date';
import styles from './Rowing.module.scss';

type Tab = 'races' | 'crews' | 'boats' | 'members';

type CreateRaceFormState = {
  distance: string;
  raceType: RaceType;
  crewIds: number[];
  windConditions: string;
  notes: string;
};

type CreateBoatFormState = {
  name: string;
  boatClassId: number | null;
};

const AGE_CATEGORIES = ['Open', 'U15', 'U17', 'U19', 'U23'] as const;

const EMPTY_SEATS: CrewSeats = {
  cox: null, seat1: null, seat2: null, seat3: null, seat4: null,
  seat5: null, seat6: null, seat7: null, seat8: null,
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

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = elapsedMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function formatStartTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ── Race Card ──────────────────────────────────────────────────────────────────

function RaceCard({ race, onDelete, onOpen }: { race: Race; onDelete: () => void; onOpen: () => void }): ReactElement {
  const [rankBy, setRankBy] = useState<'time' | 'wbt'>('wbt');
  const finishedEntries = race.entries.filter((e) => e.elapsedMs !== null && !e.dns && !e.dnf);
  const pendingEntries = race.entries.filter((e) => e.elapsedMs === null && !e.dns && !e.dnf);
  const hasWbt = finishedEntries.some((e) => e.wbtPct !== null);
  const sortedFinished = rankBy === 'wbt' && hasWbt
    ? [...finishedEntries].sort((a, b) => (b.wbtPct ?? -1) - (a.wbtPct ?? -1))
    : [...finishedEntries].sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));
  const firstStartTime = race.entries.reduce<number | null>((min, e) => {
    if (e.startTime === null) return min;
    return min === null || e.startTime < min ? e.startTime : min;
  }, null);

  return (
    <div className={styles.raceCard}>
      <div className={styles.raceCardHeader}>
        <div className={styles.raceCardMeta}>
          <span className={styles.raceDistance}>{race.distance}m</span>
          <span className={`${styles.raceTypeBadge} ${race.raceType === 'time_trial' ? styles.timeTrial : styles.sideBySide}`}>
            {race.raceType === 'time_trial' ? 'Time Trial' : 'Side by Side'}
          </span>
          <span className={`${styles.statusBadge} ${styles[race.status]}`}>{race.status}</span>
        </div>
        <div className={styles.raceCardActions}>
          <button className={styles.openBtn} onClick={onOpen}>
            <TimerIcon fontSize="small" />
            {race.status === 'completed' ? 'View Results' : 'Open Timer'}
          </button>
          <button className={styles.deleteBtn} onClick={onDelete} aria-label="Delete race">
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>
      <div className={styles.raceCardBody}>
        <span className={styles.raceDate}>
          {formatDate(race.createdAt, dateFormats.abbreviatedPrettyWithWeekday)}
          {firstStartTime !== null && <span className={styles.raceStartTime}>{formatStartTime(firstStartTime)}</span>}
        </span>
        {race.windConditions && <span className={styles.raceMeta}>Wind: {race.windConditions}</span>}
        {race.notes && <span className={styles.raceMeta}>{race.notes}</span>}
      </div>
      {race.entries.length > 0 && (
        <div className={styles.entryList}>
          {hasWbt && finishedEntries.length >= 2 && (
            <div className={styles.entryListHeader}>
              <span className={styles.rankLabel}>Rank by</span>
              <button className={`${styles.rankBtn} ${rankBy === 'time' ? styles.rankBtnActive : ''}`} onClick={() => setRankBy('time')}>Time</button>
              <button className={`${styles.rankBtn} ${rankBy === 'wbt' ? styles.rankBtnActive : ''}`} onClick={() => setRankBy('wbt')}>WBT%</button>
            </div>
          )}
          {sortedFinished.map((entry, index) => (
            <div key={entry.id} className={styles.entryRow}>
              <span className={styles.entryPlacement}>
                {rankBy === 'wbt' ? `#${index + 1}` : entry.placement != null ? `#${entry.placement}` : '—'}
              </span>
              <span className={styles.entryInfo}>
                <span className={styles.entryBoat}>{entry.boatName}</span>
                {entry.keyPerson && <span className={styles.entryKeyPerson}>{entry.keyPerson}</span>}
              </span>
              <div className={styles.entryTimeBlock}>
                <span className={styles.entryTime}>{entry.elapsedMs !== null ? formatElapsed(entry.elapsedMs) : '—'}</span>
                {entry.wbtPct !== null && (
                  <span className={styles.wbtBadge}>{entry.wbtPct.toFixed(1)}% WBT{entry.wbtIsEstimated ? '*' : ''}</span>
                )}
              </div>
            </div>
          ))}
          {pendingEntries.map((entry) => (
            <div key={entry.id} className={`${styles.entryRow} ${styles.entryPending}`}>
              <span className={styles.entryPlacement}>—</span>
              <span className={styles.entryInfo}>
                <span className={styles.entryBoat}>{entry.boatName}</span>
                {entry.keyPerson && <span className={styles.entryKeyPerson}>{entry.keyPerson}</span>}
              </span>
              <span className={styles.entryTime}>Pending</span>
            </div>
          ))}
          {race.entries.filter((e) => e.dns).map((entry) => (
            <div key={entry.id} className={`${styles.entryRow} ${styles.entryDns}`}>
              <span className={styles.entryPlacement}>DNS</span>
              <span className={styles.entryInfo}>
                <span className={styles.entryBoat}>{entry.boatName}</span>
                {entry.keyPerson && <span className={styles.entryKeyPerson}>{entry.keyPerson}</span>}
              </span>
              <span className={styles.entryTime}>—</span>
            </div>
          ))}
          {race.entries.filter((e) => e.dnf).map((entry) => (
            <div key={entry.id} className={`${styles.entryRow} ${styles.entryDnf}`}>
              <span className={styles.entryPlacement}>DNF</span>
              <span className={styles.entryInfo}>
                <span className={styles.entryBoat}>{entry.boatName}</span>
                {entry.keyPerson && <span className={styles.entryKeyPerson}>{entry.keyPerson}</span>}
              </span>
              <span className={styles.entryTime}>—</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Race Modal ──────────────────────────────────────────────────────────

function CreateRaceModal({ crews, onClose, onSubmit }: {
  crews: Crew[];
  onClose: () => void;
  onSubmit: (form: CreateRaceFormState) => Promise<void>;
}): ReactElement {
  useBodyScrollLock();
  const [form, setForm] = useState<CreateRaceFormState>({ distance: '', raceType: 'time_trial', crewIds: [], windConditions: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleCrew = (id: number): void => {
    setForm((prev) => ({
      ...prev,
      crewIds: prev.crewIds.includes(id) ? prev.crewIds.filter((c) => c !== id) : [...prev.crewIds, id],
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.distance.trim()) { setFormError('Distance is required'); return; }
    if (form.crewIds.length === 0) { setFormError('Select at least one crew'); return; }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create race');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Race</h2>

        <div className={styles.field}>
          <label className={styles.label}>Distance (m)</label>
          <input className={styles.input} type="number" placeholder="e.g. 2000" value={form.distance}
            onChange={(e) => setForm((prev) => ({ ...prev, distance: e.target.value }))} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Race Type</label>
          <div className={styles.raceTypeToggle}>
            <button className={`${styles.toggleBtn} ${form.raceType === 'time_trial' ? styles.toggleActive : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, raceType: 'time_trial' }))}>Time Trial</button>
            <button className={`${styles.toggleBtn} ${form.raceType === 'side_by_side' ? styles.toggleActive : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, raceType: 'side_by_side' }))}>Side by Side</button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Crews</label>
          {crews.length === 0 ? (
            <p className={styles.emptyHint}>No crews yet — create a crew first.</p>
          ) : (
            <div className={styles.crewCheckList}>
              {crews.map((crew) => (
                <button key={crew.id}
                  className={`${styles.crewChip} ${form.crewIds.includes(crew.id) ? styles.crewChipSelected : ''}`}
                  onClick={() => toggleCrew(crew.id)}>
                  <DirectionsBoatIcon fontSize="small" />
                  <span>{crew.boatName}</span>
                  {crew.crewClassName && <span className={styles.boatChipCrew}>{crew.crewClassName}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Wind Conditions</label>
          <input className={styles.input} type="text" placeholder="e.g. 10 knots NW" value={form.windConditions}
            onChange={(e) => setForm((prev) => ({ ...prev, windConditions: e.target.value }))} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notes</label>
          <textarea className={styles.textarea} placeholder="Optional notes" value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Race'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Crew Modal (create / edit) ─────────────────────────────────────────────────

type CrewModalSubmitParams = { boatId: number; gender: Gender; ageCategory: AgeCategory; seats: CrewSeats };

function CrewModal({ boats, crewMembers, initialCrew, onClose, onSubmit }: {
  boats: Boat[];
  crewMembers: CrewMember[];
  initialCrew?: Crew | null;
  onClose: () => void;
  onSubmit: (params: CrewModalSubmitParams) => Promise<void>;
}): ReactElement {
  useBodyScrollLock();
  const [selectedBoatId, setSelectedBoatId] = useState<number | null>(initialCrew?.boatId ?? null);
  const [gender, setGender] = useState<Gender>(initialCrew?.gender ?? 'Men');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>(initialCrew?.ageCategory ?? 'Open');
  const [seats, setSeats] = useState<CrewSeats>(() => {
    if (!initialCrew) return { ...EMPTY_SEATS };
    return {
      cox: initialCrew.cox?.crewMemberId ?? null,
      seat1: initialCrew.seat1?.crewMemberId ?? null,
      seat2: initialCrew.seat2?.crewMemberId ?? null,
      seat3: initialCrew.seat3?.crewMemberId ?? null,
      seat4: initialCrew.seat4?.crewMemberId ?? null,
      seat5: initialCrew.seat5?.crewMemberId ?? null,
      seat6: initialCrew.seat6?.crewMemberId ?? null,
      seat7: initialCrew.seat7?.crewMemberId ?? null,
      seat8: initialCrew.seat8?.crewMemberId ?? null,
    };
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = !!initialCrew;
  const selectedBoat = boats.find((b) => b.id === selectedBoatId) ?? null;

  // Auto-derive gender from assigned rowers' genders
  useEffect(() => {
    const assignedIds = Object.values(seats).filter((v): v is number => v !== null);
    if (assignedIds.length === 0) return;
    const assignedMembers = assignedIds.map((id) => crewMembers.find((m) => m.id === id)).filter(Boolean);
    const genderSet = new Set(assignedMembers.map((m) => m!.gender).filter(Boolean));
    if (genderSet.size === 0) return;
    if (genderSet.size === 1) {
      const derived = [...genderSet][0];
      if (derived === 'Men' || derived === 'Women') setGender(derived as Gender);
    } else {
      setGender('Mixed');
    }
  }, [seats, crewMembers]);
  const crewCount = selectedBoat?.boatClassCrewCount ?? 1;
  const hasCox = selectedBoat?.boatClassHasCox ?? false;
  const seatKeys = buildSeatKeys(hasCox, crewCount);

  const usedIds = new Set(
    Object.values(seats).filter((v): v is number => v !== null)
  );

  const handleSeatChange = (key: string, value: string): void => {
    setSeats((prev) => ({ ...prev, [key]: value === '' ? null : Number(value) }));
  };

  const handleBoatSelect = (boatId: number, resetSeats = true): void => {
    setSelectedBoatId(boatId);
    if (resetSeats) setSeats({ ...EMPTY_SEATS });
  };

  const sameClassBoats = isEditing
    ? boats.filter((b) => b.boatClassId !== null && b.boatClassId === initialCrew?.boatClassId)
    : [];

  const handleSubmit = async (): Promise<void> => {
    if (!selectedBoatId) { setFormError('Select a boat'); return; }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({ boatId: selectedBoatId, gender, ageCategory, seats });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save crew');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{isEditing ? `Edit Crew — ${initialCrew?.boatName}` : 'New Crew'}</h2>

        {isEditing && sameClassBoats.length > 1 && (
          <div className={styles.field}>
            <label className={styles.label}>Boat <span className={styles.optionalHint}>({initialCrew?.boatClassSymbol})</span></label>
            <div className={styles.boatSelectList}>
              {sameClassBoats.map((boat) => (
                <button key={boat.id}
                  className={`${styles.boatSelectItem} ${selectedBoatId === boat.id ? styles.boatSelectActive : ''}`}
                  onClick={() => handleBoatSelect(boat.id, false)}>
                  <span className={styles.boatSelectSymbol}>{boat.boatClassSymbol ?? '—'}</span>
                  <span className={styles.boatSelectName}>{boat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isEditing && (
          <div className={styles.field}>
            <label className={styles.label}>Boat</label>
            <div className={styles.boatSelectList}>
              {boats.map((boat) => (
                <button key={boat.id}
                  className={`${styles.boatSelectItem} ${selectedBoatId === boat.id ? styles.boatSelectActive : ''}`}
                  onClick={() => handleBoatSelect(boat.id)}>
                  <span className={styles.boatSelectSymbol}>{boat.boatClassSymbol ?? '—'}</span>
                  <span className={styles.boatSelectName}>{boat.name}</span>
                </button>
              ))}
              {boats.length === 0 && <p className={styles.emptyHint}>No boats yet — create a boat first.</p>}
            </div>
          </div>
        )}

        {selectedBoatId && (
          <div className={styles.field}>
            <label className={styles.label}>Seats</label>
            {!selectedBoat?.boatClassId && (
              <p className={styles.emptyHint}>Boat has no class — showing one seat. Assign a class to the boat for the full layout.</p>
            )}
            <div className={styles.seatTable}>
              {seatKeys.map((key) => {
                const label = getSeatLabel(key, crewCount);
                const selectedId = seats[key as keyof CrewSeats];
                return (
                  <div key={key} className={styles.seatRow}>
                    <span className={`${styles.seatLabel} ${key === 'cox' ? styles.seatLabelCox : ''}`}>{label}</span>
                    <select
                      className={styles.seatSelect}
                      value={selectedId ?? ''}
                      onChange={(e) => handleSeatChange(key, e.target.value)}
                    >
                      <option value="">— unassigned —</option>
                      {crewMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.gender ? ` (${m.gender})` : ''}{usedIds.has(m.id) && selectedId !== m.id ? ' — in boat' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Gender</label>
          <div className={styles.chipRow}>
            {(['Men', 'Women', 'Mixed'] as Gender[]).map((g) => (
              <button key={g}
                className={`${styles.toggleBtn} ${gender === g ? styles.toggleActive : ''}`}
                onClick={() => setGender(g)}>{g}</button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Age Category</label>
          <div className={styles.chipRow}>
            {AGE_CATEGORIES.map((age) => (
              <button key={age}
                className={`${styles.toggleBtn} ${styles.toggleBtnSm} ${ageCategory === age ? styles.toggleActive : ''}`}
                onClick={() => setAgeCategory(age)}>{age}</button>
            ))}
          </div>
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving || !selectedBoatId}>
            {saving ? 'Saving…' : isEditing ? 'Save Crew' : 'Create Crew'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Crew Card ─────────────────────────────────────────────────────────────────

function CrewCard({ crew, onEdit, onDelete }: { crew: Crew; onEdit: () => void; onDelete: () => void }): ReactElement {
  const crewCount = crew.boatClassCrewCount ?? 1;
  const seatKeys = buildSeatKeys(crew.boatClassHasCox, crewCount);

  return (
    <div className={styles.crewCard}>
      <div className={styles.crewCardHeader}>
        <GroupsIcon className={styles.crewCardIcon} />
        <div className={styles.crewCardInfo}>
          <span className={styles.crewCardBoatName}>{crew.boatName}</span>
          {crew.crewClassName && <span className={styles.crewCardClassName}>{crew.crewClassName}</span>}
        </div>
        <div className={styles.crewCardActions}>
          <button className={styles.editBtn} onClick={onEdit} aria-label="Edit crew">
            <EditIcon fontSize="small" />
          </button>
          <button className={styles.deleteBtn} onClick={onDelete} aria-label="Delete crew">
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>
      <div className={styles.crewSeatList}>
        {seatKeys.map((key) => {
          const slot = key === 'cox' ? crew.cox : crew[key as keyof Crew] as ({ name: string; gender: string } | null);
          const label = getSeatLabel(key, crewCount);
          return (
            <div key={key} className={styles.crewSeatItem}>
              <span className={`${styles.crewSeatLabel} ${key === 'cox' ? styles.crewSeatLabelCox : ''}`}>{label}</span>
              <span className={styles.crewSeatName}>{slot ? slot.name : <em className={styles.crewSeatEmpty}>unassigned</em>}</span>
            </div>
          );
        })}
      </div>
      {crew.hasResults && <span className={styles.crewHasResultsBadge}>has race results</span>}
    </div>
  );
}

// ── Create Boat Modal ──────────────────────────────────────────────────────────

function CreateBoatModal({ boatClasses, onClose, onSubmit }: {
  boatClasses: BoatClass[];
  onClose: () => void;
  onSubmit: (form: CreateBoatFormState) => Promise<void>;
}): ReactElement {
  useBodyScrollLock();
  const [form, setForm] = useState<CreateBoatFormState>({ name: '', boatClassId: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (!form.name.trim()) { setFormError('Boat name is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create boat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Boat</h2>

        <div className={styles.field}>
          <label className={styles.label}>Boat Name</label>
          <input className={styles.input} type="text" placeholder="e.g. Blue Thunder" value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} autoFocus />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Boat Class <span className={styles.optionalHint}>(optional)</span></label>
          <div className={styles.boatClassList}>
            <button
              className={`${styles.boatClassItem} ${form.boatClassId === null ? styles.boatClassSelected : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, boatClassId: null }))}>
              <span className={styles.boatClassSymbol}>—</span>
              <span className={styles.boatClassLabel}>No class</span>
            </button>
            {boatClasses.map((bc) => (
              <button key={bc.id}
                className={`${styles.boatClassItem} ${form.boatClassId === bc.id ? styles.boatClassSelected : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, boatClassId: bc.id }))}>
                <span className={styles.boatClassSymbol}>{bc.symbol}</span>
                {bc.hasCox && <span className={styles.coxBadge}>+ Cox</span>}
              </button>
            ))}
          </div>
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Boat'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Crew Member Modal ──────────────────────────────────────────────────────────

function CrewMemberModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: ({ name, gender }: { name: string; gender: string }) => Promise<void>;
}): ReactElement {
  useBodyScrollLock();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Men' | 'Women'>('Men');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({ name, gender });
      onClose();
    } catch {
      setFormError('Failed to create crew member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Rower</h2>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input className={styles.input} type="text" placeholder="Full name" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} autoFocus />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Gender</label>
          <div className={styles.chipRow}>
            {(['Men', 'Women'] as const).map((g) => (
              <button key={g} className={`${styles.toggleBtn} ${gender === g ? styles.toggleActive : ''}`}
                onClick={() => setGender(g)}>{g}</button>
            ))}
          </div>
        </div>
        {formError && <p className={styles.formError}>{formError}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Add Rower'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

function Rowing(): ReactElement {
  const navigate = useNavigate();
  const {
    boatClasses, crewMembers, boats, crews, races,
    isLoading, error,
    fetchAllBoatClasses, fetchAllCrew, fetchAllBoats, fetchAllCrews, fetchAllRaces,
    addCrewMember, removeCrewMember,
    addBoat, removeBoat,
    addCrew, editCrew, removeCrew,
    startRace, removeRace,
  } = useRowing();

  const { confirm, confirmElement } = useConfirm();
  const [activeTab, setActiveTab] = useState<Tab>('races');
  const [raceDateFilter, setRaceDateFilter] = useState(() => new Date().toISOString().slice(0, 10));
  const [showCreateRace, setShowCreateRace] = useState(false);
  const [showCreateBoat, setShowCreateBoat] = useState(false);
  const [showCreateCrew, setShowCreateCrew] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);

  useEffect(() => {
    fetchAllBoats();
    fetchAllCrew();
    fetchAllCrews();
    fetchAllBoatClasses();
  }, [fetchAllBoats, fetchAllCrew, fetchAllCrews, fetchAllBoatClasses]);

  useEffect(() => {
    fetchAllRaces({ date: raceDateFilter });
  }, [fetchAllRaces, raceDateFilter]);

  const handleCreateRace = useCallback(async (form: CreateRaceFormState) => {
    const raceId = await startRace({
      distance: form.distance,
      raceType: form.raceType,
      crewIds: form.crewIds,
      windConditions: form.windConditions || undefined,
      notes: form.notes || undefined,
    });
    navigate(`${PAGE_PATHS.ROWING_RACE}/${raceId}`);
  }, [startRace, navigate]);

  const handleDeleteRace = useCallback(async (id: number) => {
    if (!await confirm({ message: 'Delete this race and all its results?', variant: 'danger', confirmLabel: 'Delete' })) return;
    await removeRace({ id, date: raceDateFilter });
  }, [removeRace, raceDateFilter, confirm]);

  const handleDeleteBoat = useCallback(async (id: number) => {
    if (!await confirm({ message: 'Delete this boat?', variant: 'danger', confirmLabel: 'Delete' })) return;
    await removeBoat({ id });
  }, [removeBoat, confirm]);

  const handleDeleteCrew = useCallback(async (id: number) => {
    if (!await confirm({ message: 'Delete this crew?', variant: 'danger', confirmLabel: 'Delete' })) return;
    await removeCrew({ id });
  }, [removeCrew, confirm]);

  const handleDeleteMember = useCallback(async (id: number) => {
    if (!await confirm({ message: 'Remove this rower?', variant: 'danger', confirmLabel: 'Remove' })) return;
    await removeCrewMember({ id });
  }, [removeCrewMember, confirm]);

  const handleCrewSubmit = useCallback(async ({ boatId, gender, ageCategory, seats }: CrewModalSubmitParams) => {
    if (editingCrew) {
      await editCrew({ id: editingCrew.id, boatId, gender, ageCategory, ...seats });
    } else {
      await addCrew({ boatId, gender, ageCategory, ...seats });
    }
  }, [editingCrew, editCrew, addCrew]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rowing</h1>
        <div className={styles.tabs}>
          {(['races', 'crews', 'boats', 'members'] as Tab[]).map((tab) => (
            <button key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button className={styles.strokeRateBtn} onClick={() => navigate(PAGE_PATHS.ROWING_STROKE_RATE)}>
          <SpeedIcon fontSize="small" /> Stroke Rate
        </button>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {activeTab === 'races' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Race History</h2>
            <input
              type="date"
              className={styles.dateFilter}
              value={raceDateFilter}
              onChange={(e) => setRaceDateFilter(e.target.value)}
            />
            <button className={styles.addBtn} onClick={() => setShowCreateRace(true)}>
              <AddIcon fontSize="small" /> New Race
            </button>
          </div>
          {isLoading && <p className={styles.loadingText}>Loading…</p>}
          {!isLoading && races.length === 0 && (
            <div className={styles.emptyState}><TimerIcon className={styles.emptyIcon} /><p>No races yet.</p></div>
          )}
          <div className={styles.raceList}>
            {races.map((race) => (
              <RaceCard key={race.id} race={race}
                onDelete={() => handleDeleteRace(race.id)}
                onOpen={() => navigate(`${PAGE_PATHS.ROWING_RACE}/${race.id}`)} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'crews' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Crews</h2>
            <button className={styles.addBtn} onClick={() => { setEditingCrew(null); setShowCreateCrew(true); }}>
              <AddIcon fontSize="small" /> New Crew
            </button>
          </div>
          {isLoading && <p className={styles.loadingText}>Loading…</p>}
          {!isLoading && crews.length === 0 && (
            <div className={styles.emptyState}><GroupsIcon className={styles.emptyIcon} /><p>No crews yet.</p></div>
          )}
          <div className={styles.crewCardList}>
            {crews.map((crew) => (
              <CrewCard key={crew.id} crew={crew}
                onEdit={() => { setEditingCrew(crew); setShowCreateCrew(true); }}
                onDelete={() => handleDeleteCrew(crew.id)} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'boats' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Boats</h2>
            <button className={styles.addBtn} onClick={() => setShowCreateBoat(true)}>
              <AddIcon fontSize="small" /> New Boat
            </button>
          </div>
          {isLoading && <p className={styles.loadingText}>Loading…</p>}
          {!isLoading && boats.length === 0 && (
            <div className={styles.emptyState}><DirectionsBoatIcon className={styles.emptyIcon} /><p>No boats yet.</p></div>
          )}
          <div className={styles.boatGrid}>
            {boats.map((boat) => (
              <div key={boat.id} className={styles.boatCard}>
                <div className={styles.boatCardHeader}>
                  <DirectionsBoatIcon className={styles.boatIcon} />
                  <div className={styles.boatCardInfo}>
                    <span className={styles.boatName}>{boat.name}</span>
                    {boat.boatClassSymbol && <span className={styles.boatClassName}>{boat.boatClassSymbol}</span>}
                  </div>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteBoat(boat.id)} aria-label="Delete boat">
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Rowers</h2>
            <button className={styles.addBtn} onClick={() => setShowCreateMember(true)}>
              <AddIcon fontSize="small" /> Add Rower
            </button>
          </div>
          {isLoading && <p className={styles.loadingText}>Loading…</p>}
          {!isLoading && crewMembers.length === 0 && (
            <div className={styles.emptyState}><PersonIcon className={styles.emptyIcon} /><p>No rowers yet.</p></div>
          )}
          <div className={styles.crewMemberList}>
            {crewMembers.map((member) => (
              <div key={member.id} className={styles.crewMemberRow}>
                <PersonIcon className={styles.crewMemberIcon} />
                <span className={styles.crewMemberName}>{member.name}</span>
                {member.gender && <span className={styles.crewMemberGender}>{member.gender}</span>}
                <button className={styles.deleteBtn} onClick={() => handleDeleteMember(member.id)} aria-label="Remove rower">
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateRace && (
        <CreateRaceModal crews={crews} onClose={() => setShowCreateRace(false)} onSubmit={handleCreateRace} />
      )}
      {showCreateBoat && (
        <CreateBoatModal boatClasses={boatClasses} onClose={() => setShowCreateBoat(false)}
          onSubmit={({ name, boatClassId }) => addBoat({ name, boatClassId: boatClassId ?? undefined })} />
      )}
      {showCreateCrew && (
        <CrewModal
          boats={boats}
          crewMembers={crewMembers}
          initialCrew={editingCrew}
          onClose={() => { setShowCreateCrew(false); setEditingCrew(null); }}
          onSubmit={handleCrewSubmit}
        />
      )}
      {showCreateMember && (
        <CrewMemberModal onClose={() => setShowCreateMember(false)} onSubmit={addCrewMember} />
      )}
      {confirmElement}
    </div>
  );
}

export default Rowing;
