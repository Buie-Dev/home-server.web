import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import TimerIcon from '@mui/icons-material/Timer';
import { useRowing } from 'hooks/useRowing.hook';
import type { Boat, CrewMember, Race, RaceType } from 'api/rowing.api';
import { PAGE_PATHS } from 'lib/pagesPaths';
import { formatDate, dateFormats } from 'lib/date';
import styles from './Rowing.module.scss';

type Tab = 'races' | 'boats' | 'crew';

type CreateRaceFormState = {
  distance: string;
  raceType: RaceType;
  boatIds: number[];
  windConditions: string;
  notes: string;
};

type CreateBoatFormState = {
  name: string;
  crewMemberIds: number[];
};

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = elapsedMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function RaceCard({ race, onDelete, onOpen }: { race: Race; onDelete: () => void; onOpen: () => void }): ReactElement {
  const finishedEntries = race.entries.filter((e) => e.elapsedMs !== null && !e.dns && !e.dnf);
  const pendingEntries = race.entries.filter((e) => e.elapsedMs === null && !e.dns && !e.dnf);

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
            {race.status === 'pending' ? 'Start Race' : race.status === 'active' ? 'Open Timer' : 'View Results'}
          </button>
          <button className={styles.deleteBtn} onClick={onDelete} aria-label="Delete race">
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>

      <div className={styles.raceCardBody}>
        <span className={styles.raceDate}>{formatDate(race.createdAt, dateFormats.abbreviatedPrettyWithWeekday)}</span>
        {race.windConditions && <span className={styles.raceMeta}>Wind: {race.windConditions}</span>}
        {race.notes && <span className={styles.raceMeta}>{race.notes}</span>}
      </div>

      {race.entries.length > 0 && (
        <div className={styles.entryList}>
          {finishedEntries.map((entry) => (
            <div key={entry.id} className={styles.entryRow}>
              <span className={styles.entryPlacement}>{entry.placement != null ? `#${entry.placement}` : '—'}</span>
              <span className={styles.entryBoat}>{entry.boatName}</span>
              <span className={styles.entryTime}>{entry.elapsedMs !== null ? formatElapsed(entry.elapsedMs) : '—'}</span>
            </div>
          ))}
          {pendingEntries.map((entry) => (
            <div key={entry.id} className={`${styles.entryRow} ${styles.entryPending}`}>
              <span className={styles.entryPlacement}>—</span>
              <span className={styles.entryBoat}>{entry.boatName}</span>
              <span className={styles.entryTime}>Pending</span>
            </div>
          ))}
          {race.entries.filter((e) => e.dns).map((entry) => (
            <div key={entry.id} className={`${styles.entryRow} ${styles.entryDns}`}>
              <span className={styles.entryPlacement}>DNS</span>
              <span className={styles.entryBoat}>{entry.boatName}</span>
              <span className={styles.entryTime}>—</span>
            </div>
          ))}
          {race.entries.filter((e) => e.dnf).map((entry) => (
            <div key={entry.id} className={`${styles.entryRow} ${styles.entryDnf}`}>
              <span className={styles.entryPlacement}>DNF</span>
              <span className={styles.entryBoat}>{entry.boatName}</span>
              <span className={styles.entryTime}>—</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateRaceModal({
  boats,
  onClose,
  onSubmit,
}: {
  boats: Boat[];
  onClose: () => void;
  onSubmit: (form: CreateRaceFormState) => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState<CreateRaceFormState>({
    distance: '',
    raceType: 'time_trial',
    boatIds: [],
    windConditions: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleBoat = (id: number): void => {
    setForm((prev) => ({
      ...prev,
      boatIds: prev.boatIds.includes(id) ? prev.boatIds.filter((b) => b !== id) : [...prev.boatIds, id],
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.distance.trim()) {
      setFormError('Distance is required');
      return;
    }
    if (form.boatIds.length === 0) {
      setFormError('Select at least one boat');
      return;
    }
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
          <input
            className={styles.input}
            type="number"
            placeholder="e.g. 2000"
            value={form.distance}
            onChange={(e) => setForm((prev) => ({ ...prev, distance: e.target.value }))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Race Type</label>
          <div className={styles.raceTypeToggle}>
            <button
              className={`${styles.toggleBtn} ${form.raceType === 'time_trial' ? styles.toggleActive : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, raceType: 'time_trial' }))}
            >
              Time Trial
            </button>
            <button
              className={`${styles.toggleBtn} ${form.raceType === 'side_by_side' ? styles.toggleActive : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, raceType: 'side_by_side' }))}
            >
              Side by Side
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Boats</label>
          {boats.length === 0 ? (
            <p className={styles.emptyHint}>No boats registered yet. Add boats first.</p>
          ) : (
            <div className={styles.boatCheckList}>
              {boats.map((boat) => (
                <button
                  key={boat.id}
                  className={`${styles.boatChip} ${form.boatIds.includes(boat.id) ? styles.boatChipSelected : ''}`}
                  onClick={() => toggleBoat(boat.id)}
                >
                  <DirectionsBoatIcon fontSize="small" />
                  <span>{boat.name}</span>
                  <span className={styles.boatChipCrew}>({boat.crew.length} crew)</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Wind Conditions</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. 10 knots NW"
            value={form.windConditions}
            onChange={(e) => setForm((prev) => ({ ...prev, windConditions: e.target.value }))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notes</label>
          <textarea
            className={styles.textarea}
            placeholder="Optional notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Race'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateBoatModal({
  crewMembers,
  onClose,
  onSubmit,
}: {
  crewMembers: CrewMember[];
  onClose: () => void;
  onSubmit: (form: CreateBoatFormState) => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState<CreateBoatFormState>({ name: '', crewMemberIds: [] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleCrew = (id: number): void => {
    setForm((prev) => {
      const already = prev.crewMemberIds.includes(id);
      if (!already && prev.crewMemberIds.length >= 9) return prev;
      return {
        ...prev,
        crewMemberIds: already ? prev.crewMemberIds.filter((c) => c !== id) : [...prev.crewMemberIds, id],
      };
    });
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.name.trim()) {
      setFormError('Boat name is required');
      return;
    }
    if (form.crewMemberIds.length === 0) {
      setFormError('Select at least 1 crew member');
      return;
    }
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
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. Blue Thunder"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Crew Members (1–9)</label>
          {crewMembers.length === 0 ? (
            <p className={styles.emptyHint}>No crew members registered yet.</p>
          ) : (
            <div className={styles.crewCheckList}>
              {crewMembers.map((member) => (
                <button
                  key={member.id}
                  className={`${styles.crewChip} ${form.crewMemberIds.includes(member.id) ? styles.crewChipSelected : ''}`}
                  onClick={() => toggleCrew(member.id)}
                  disabled={!form.crewMemberIds.includes(member.id) && form.crewMemberIds.length >= 9}
                >
                  <PersonIcon fontSize="small" />
                  {member.name}
                </button>
              ))}
            </div>
          )}
          <span className={styles.crewCount}>{form.crewMemberIds.length} / 9 selected</span>
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Boat'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CrewMemberModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: ({ name }: { name: string }) => Promise<void>;
}): ReactElement {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({ name });
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
        <h2 className={styles.modalTitle}>New Crew Member</h2>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        {formError && <p className={styles.formError}>{formError}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Rowing(): ReactElement {
  const navigate = useNavigate();
  const {
    crewMembers, boats, races,
    isLoading, error,
    fetchAllCrew, fetchAllBoats, fetchAllRaces,
    addCrewMember, removeCrewMember,
    addBoat, removeBoat,
    startRace, removeRace,
  } = useRowing();

  const [activeTab, setActiveTab] = useState<Tab>('races');
  const [showCreateRace, setShowCreateRace] = useState(false);
  const [showCreateBoat, setShowCreateBoat] = useState(false);
  const [showCreateCrew, setShowCreateCrew] = useState(false);

  useEffect(() => {
    fetchAllRaces();
    fetchAllBoats();
    fetchAllCrew();
  }, [fetchAllRaces, fetchAllBoats, fetchAllCrew]);

  const handleCreateRace = useCallback(async (form: CreateRaceFormState) => {
    const raceId = await startRace({
      distance: form.distance,
      raceType: form.raceType,
      boatIds: form.boatIds,
      windConditions: form.windConditions || undefined,
      notes: form.notes || undefined,
    });
    navigate(`${PAGE_PATHS.ROWING_RACE}/${raceId}`);
  }, [startRace, navigate]);

  const handleDeleteRace = useCallback(async (id: number) => {
    if (!window.confirm('Delete this race and all its results?')) return;
    await removeRace({ id });
  }, [removeRace]);

  const handleDeleteBoat = useCallback(async (id: number) => {
    if (!window.confirm('Delete this boat?')) return;
    await removeBoat({ id });
  }, [removeBoat]);

  const handleDeleteCrew = useCallback(async (id: number) => {
    if (!window.confirm('Remove this crew member?')) return;
    await removeCrewMember({ id });
  }, [removeCrewMember]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rowing</h1>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'races' ? styles.tabActive : ''}`} onClick={() => setActiveTab('races')}>Races</button>
          <button className={`${styles.tab} ${activeTab === 'boats' ? styles.tabActive : ''}`} onClick={() => setActiveTab('boats')}>Boats</button>
          <button className={`${styles.tab} ${activeTab === 'crew' ? styles.tabActive : ''}`} onClick={() => setActiveTab('crew')}>Crew</button>
        </div>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {activeTab === 'races' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Race History</h2>
            <button className={styles.addBtn} onClick={() => setShowCreateRace(true)}>
              <AddIcon fontSize="small" /> New Race
            </button>
          </div>
          {isLoading && <p className={styles.loadingText}>Loading…</p>}
          {!isLoading && races.length === 0 && (
            <div className={styles.emptyState}>
              <TimerIcon className={styles.emptyIcon} />
              <p>No races yet. Create one to get started.</p>
            </div>
          )}
          <div className={styles.raceList}>
            {races.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                onDelete={() => handleDeleteRace(race.id)}
                onOpen={() => navigate(`${PAGE_PATHS.ROWING_RACE}/${race.id}`)}
              />
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
            <div className={styles.emptyState}>
              <DirectionsBoatIcon className={styles.emptyIcon} />
              <p>No boats yet.</p>
            </div>
          )}
          <div className={styles.boatGrid}>
            {boats.map((boat) => (
              <div key={boat.id} className={styles.boatCard}>
                <div className={styles.boatCardHeader}>
                  <DirectionsBoatIcon className={styles.boatIcon} />
                  <span className={styles.boatName}>{boat.name}</span>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteBoat(boat.id)} aria-label="Delete boat">
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
                <div className={styles.crewList}>
                  {boat.crew.map((slot) => (
                    <span key={slot.id} className={styles.crewTag}>
                      <PersonIcon fontSize="inherit" /> {slot.crewMemberName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'crew' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Crew Members</h2>
            <button className={styles.addBtn} onClick={() => setShowCreateCrew(true)}>
              <AddIcon fontSize="small" /> Add Member
            </button>
          </div>
          {isLoading && <p className={styles.loadingText}>Loading…</p>}
          {!isLoading && crewMembers.length === 0 && (
            <div className={styles.emptyState}>
              <PersonIcon className={styles.emptyIcon} />
              <p>No crew members yet.</p>
            </div>
          )}
          <div className={styles.crewMemberList}>
            {crewMembers.map((member) => (
              <div key={member.id} className={styles.crewMemberRow}>
                <PersonIcon className={styles.crewMemberIcon} />
                <span className={styles.crewMemberName}>{member.name}</span>
                <button className={styles.deleteBtn} onClick={() => handleDeleteCrew(member.id)} aria-label="Remove crew member">
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateRace && (
        <CreateRaceModal
          boats={boats}
          onClose={() => setShowCreateRace(false)}
          onSubmit={handleCreateRace}
        />
      )}
      {showCreateBoat && (
        <CreateBoatModal
          crewMembers={crewMembers}
          onClose={() => setShowCreateBoat(false)}
          onSubmit={({ name, crewMemberIds }) => addBoat({ name, crewMemberIds })}
        />
      )}
      {showCreateCrew && (
        <CrewMemberModal
          onClose={() => setShowCreateCrew(false)}
          onSubmit={addCrewMember}
        />
      )}
    </div>
  );
}

export default Rowing;
