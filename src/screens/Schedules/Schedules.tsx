import React, { ReactElement, useEffect, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import CreateScheduleModal from 'components/CreateScheduleModal/CreateScheduleModal';
import DeleteConfirmationModal from 'components/DeleteConfirmationModal/DeleteConfirmationModal';
import EmptyState from 'components/EmptyState/EmptyState';
import PageContainer from 'components/PageContainer/PageContainer';
import ZoneSubzoneFilter from 'components/ZoneSubzoneFilter/ZoneSubzoneFilter';
import useIrrigation, { Schedule, SyncStatus } from 'hooks/useIrrigation.hook';
import useConfirm from 'hooks/useConfirm.hook';
import styles from './Schedules.module.scss';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_KEYS: (keyof Schedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formatDaysLabel = (schedule: Schedule): string => {
  const activeDays = DAY_KEYS.filter((key) => schedule[key]);
  if (activeDays.length === 7) return 'Every day';
  if (activeDays.length === 5 && !schedule.saturday && !schedule.sunday) return 'Weekdays';
  if (activeDays.length === 0) return 'No days set';
  return activeDays.map((key) => DAYS[DAY_KEYS.indexOf(key)]).join(', ');
};

const getSyncMessage = (syncStatus: SyncStatus, scheduleList: Schedule[]): string => {
  const nameById = new Map(scheduleList.map((s) => [s.id, s.name]));
  const nameOrId = (id: number): string => nameById.get(id) ?? `ID ${id}`;

  const lines: string[] = [];
  if (syncStatus.missing_from_automation.length > 0) {
    lines.push(`Missing from automation: ${syncStatus.missing_from_automation.map(nameOrId).join(', ')}`);
  }
  if (syncStatus.extra_in_automation.length > 0) {
    lines.push(`Extra in automation: ${syncStatus.extra_in_automation.map(nameOrId).join(', ')}`);
  }
  syncStatus.mismatched.forEach((item) => {
    lines.push(`"${nameOrId(item.id)}" mismatched: ${item.diffs.join(', ')}`);
  });
  return lines.join('\n');
};

interface SortableCardProps {
  schedule: Schedule;
  onToggle: (id: number, active: boolean) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

function SortableCard({ schedule, onToggle, onEdit, onDelete }: SortableCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: schedule.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${schedule.active ? styles.scheduleActive : styles.scheduleInactive} ${isDragging ? styles.cardDragging : ''}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.timeBlock}>
          <span className={styles.dragHandle} {...attributes} {...listeners}>
            <DragHandleIcon className={styles.dragIcon} />
          </span>
          <span className={`${styles.statusBadge} ${schedule.active ? styles.badgeActive : styles.badgePaused}`}>
            {schedule.active ? 'Active' : 'Paused'}
          </span>
          <span className={styles.startTime}>{schedule.startTime}</span>
        </div>
        <div className={styles.headerRight}>
          <Switch
            checked={!!schedule.active}
            onChange={(event) => onToggle(schedule.id, event.target.checked)}
            size="small"
            className={styles.toggle}
          />
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(schedule)}>
              <EditIcon className={styles.editIcon} fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(schedule)}>
              <DeleteIcon className={styles.deleteIcon} fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <p className={styles.scheduleName}>{schedule.name}</p>

      <div className={styles.dayRow}>
        {DAYS.map((day, index) => {
          const isOn = schedule[DAY_KEYS[index]] as boolean;
          return (
            <span key={day} className={`${styles.dayPill} ${isOn ? styles.dayOn : ''}`}>
              {day[0]}
            </span>
          );
        })}
        <span className={styles.daysLabel}>{formatDaysLabel(schedule)}</span>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>{schedule.duration} min</span>
        <span className={styles.metaItem}>{schedule.zoneName}</span>
        {schedule.subzoneNames && <span className={styles.metaItem}>{schedule.subzoneNames}</span>}
      </div>
    </div>
  );
}

function Schedules(): ReactElement {
  const {
    schedules,
    fetchSchedules,
    toggleSchedule,
    deleteSchedule,
    reorderSchedules,
    checkSync,
    forceSync,
    zoneDetails,
    fetchZones,
  } = useIrrigation();
  const { confirm, confirmElement } = useConfirm();
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | undefined>();
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | undefined>();
  const [syncChecking, setSyncChecking] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [activeZoneId, setActiveZoneId] = useState<number | undefined>();
  const [activeSubzoneId, setActiveSubzoneId] = useState<number | undefined>();

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchSchedules();
    fetchZones();
  }, []);

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  const handleZoneFilter = (zoneId: number | undefined): void => {
    setActiveZoneId(zoneId);
    setActiveSubzoneId(undefined);
    fetchSchedules(zoneId, undefined);
  };

  const handleSubzoneFilter = (subzoneId: number | undefined): void => {
    setActiveSubzoneId(subzoneId);
    fetchSchedules(activeZoneId, subzoneId);
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSchedules.findIndex((s) => s.id === active.id);
    const newIndex = localSchedules.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(localSchedules, oldIndex, newIndex);
    setLocalSchedules(reordered);
    await reorderSchedules(reordered.map((s: Schedule) => s.id));
  };

  const handleCheckSync = async (): Promise<void> => {
    setSyncChecking(true);
    setSyncMessage('');
    const result = await checkSync();
    setSyncChecking(false);

    if (!result) {
      setSyncMessage('Could not reach the automation service.');
      return;
    }
    if (result.timeout) {
      setSyncMessage('Timeout: no response from automation service.');
      return;
    }
    if (result.in_sync) {
      setSyncMessage('All schedules are in sync.');
      return;
    }

    const message = getSyncMessage(result, localSchedules);
    const confirmed = await confirm({
      title: 'Out of sync',
      message: `${message}\n\nForce sync now?`,
      confirmLabel: 'Sync',
    });
    if (confirmed) {
      const syncResult = await forceSync();
      if (syncResult) {
        setSyncMessage(`${syncResult.synced} schedule(s) re-synced.`);
      }
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!scheduleToDelete) return;
    await deleteSchedule(scheduleToDelete.id);
    setScheduleToDelete(undefined);
    fetchSchedules(activeZoneId, activeSubzoneId);
  };

  const handleSaved = (): void => {
    setOpenCreate(false);
    setScheduleToEdit(undefined);
    fetchSchedules(activeZoneId, activeSubzoneId);
  };

  return (
    <PageContainer className={styles.pageOverride}>
      {zoneDetails.length > 0 && (
        <ZoneSubzoneFilter
          zoneDetails={zoneDetails}
          activeZoneId={activeZoneId}
          activeSubzoneId={activeSubzoneId}
          onZoneChange={handleZoneFilter}
          onSubzoneChange={handleSubzoneFilter}
        />
      )}

      {syncMessage && (
        <div
          className={`${styles.syncBanner} ${syncMessage.includes('in sync') || syncMessage.includes('re-synced') ? styles.syncSuccess : styles.syncWarning}`}
        >
          {syncMessage}
        </div>
      )}

      {localSchedules.length === 0 ? (
        <EmptyState icon={CalendarMonthIcon} title="No schedules yet" subtitle="Create your first schedule below" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localSchedules.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.list}>
              {localSchedules.map((schedule) => (
                <SortableCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={toggleSchedule}
                  onEdit={setScheduleToEdit}
                  onDelete={setScheduleToDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.createBtn} onClick={() => setOpenCreate(true)}>
          <AddIcon className={styles.addIcon} />
          Create Schedule
        </button>
        <Tooltip title="Check sync with automation service">
          <button type="button" className={styles.syncBtn} onClick={handleCheckSync} disabled={syncChecking}>
            {syncChecking ? (
              <CircularProgress size={18} className={styles.syncSpinner} />
            ) : (
              <SyncIcon className={styles.syncIcon} />
            )}
          </button>
        </Tooltip>
      </div>

      <CreateScheduleModal open={openCreate} onClose={() => setOpenCreate(false)} onSave={handleSaved} />
      <CreateScheduleModal
        open={!!scheduleToEdit}
        editSchedule={scheduleToEdit}
        onClose={() => setScheduleToEdit(undefined)}
        onSave={handleSaved}
      />
      <DeleteConfirmationModal
        open={!!scheduleToDelete}
        title="Delete Schedule"
        message={`Delete "${scheduleToDelete?.name}"? This cannot be undone.`}
        onCancel={() => setScheduleToDelete(undefined)}
        onConfirm={handleDeleteConfirm}
      />
      {confirmElement}
    </PageContainer>
  );
}

export default Schedules;
