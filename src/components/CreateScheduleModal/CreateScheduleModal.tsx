import React, { ReactElement, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import useIrrigation, { Schedule, Zone, ZoneType } from 'hooks/useIrrigation.hook';
import styles from './CreateScheduleModal.module.scss';

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editSchedule?: Schedule;
}

const DAYS_CONFIG = [
  { label: 'Mon', key: 'monday' as const },
  { label: 'Tue', key: 'tuesday' as const },
  { label: 'Wed', key: 'wednesday' as const },
  { label: 'Thu', key: 'thursday' as const },
  { label: 'Fri', key: 'friday' as const },
  { label: 'Sat', key: 'saturday' as const },
  { label: 'Sun', key: 'sunday' as const },
];

type DayFlags = {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
};

function CreateScheduleModal({ open, onClose, onSave, editSchedule }: CreateScheduleModalProps): ReactElement {
  const { zones, fetchZones, createSchedule, updateSchedule, fetchZoneTypes, zoneTypes } = useIrrigation();
  const [selectedZone, setSelectedZone] = useState<Zone | undefined>();
  const [selectedSubzoneIds, setSelectedSubzoneIds] = useState<number[]>([]);
  const [zoneType, setZoneType] = useState<ZoneType | undefined>();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [days, setDays] = useState<DayFlags>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });

  useEffect(() => {
    fetchZones(zoneType?.id);
    if (!editSchedule) setSelectedZone(undefined);
  }, [zoneType]);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    fetchZoneTypes();
    if (editSchedule) {
      setName(editSchedule.name);
      setDuration(String(editSchedule.duration));
      setStartTime(editSchedule.startTime);
      setDays({
        monday: editSchedule.monday,
        tuesday: editSchedule.tuesday,
        wednesday: editSchedule.wednesday,
        thursday: editSchedule.thursday,
        friday: editSchedule.friday,
        saturday: editSchedule.saturday,
        sunday: editSchedule.sunday,
      });
      setSelectedSubzoneIds(editSchedule.subzoneIds ?? []);
    }
  }, [open]);

  useEffect(() => {
    if (editSchedule && zones.length > 0 && !selectedZone) {
      const match = zones.find((zone) => zone.id === editSchedule.zoneId);
      if (match) setSelectedZone(match);
    }
  }, [zones, editSchedule]);

  const resetForm = (): void => {
    setSelectedZone(undefined);
    setSelectedSubzoneIds([]);
    setZoneType(undefined);
    setName('');
    setStartTime('06:00');
    setDuration('');
    setDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
  };

  const toggleDay = (key: keyof DayFlags): void => {
    setDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const anyDaySelected = (): boolean => Object.values(days).some(Boolean);

  const handleSave = async (): Promise<void> => {
    if (!selectedZone) return;
    if (selectedZone.subzones && selectedZone.subzones.length > 0 && selectedSubzoneIds.length === 0) return;
    if (!anyDaySelected()) return;
    if (!name.trim() || !startTime.trim()) return;
    if (!duration.trim() || isNaN(+duration)) return;

    const params = {
      zoneId: selectedZone.id,
      subzoneIds: selectedSubzoneIds,
      ...days,
      name,
      duration: +duration,
      startTime,
    };

    if (editSchedule) {
      await updateSchedule(editSchedule.id, params);
    } else {
      await createSchedule(params);
    }
    onSave();
  };

  const toggleSubzone = (subzoneId: number): void => {
    setSelectedSubzoneIds((prev) =>
      prev.includes(subzoneId) ? prev.filter((id) => id !== subzoneId) : [...prev, subzoneId]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className={styles.title}>{editSchedule ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
      <DialogContent className={styles.content}>
        <div className={styles.section}>
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            size="small"
            className={styles.field}
          />
          <TextField
            label="Start time"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            fullWidth
            size="small"
            className={styles.field}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Duration (minutes)"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            fullWidth
            size="small"
            className={styles.field}
          />
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Days</p>
          <div className={styles.daysRow}>
            {DAYS_CONFIG.map(({ label, key }) => (
              <button
                key={key}
                type="button"
                className={`${styles.dayPill} ${days[key] ? styles.active : ''}`}
                onClick={() => toggleDay(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Zone</p>
          <FormControl size="small" fullWidth className={styles.field}>
            <InputLabel>Zone type</InputLabel>
            <Select
              value={zoneType?.id ?? ''}
              label="Zone type"
              onChange={(event) => {
                const id = event.target.value;
                setZoneType(id ? zoneTypes.find((zt) => zt.id === id) : undefined);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {zoneTypes.map((zt) => (
                <MenuItem key={zt.id} value={zt.id}>
                  {zt.type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className={styles.zoneList}>
            {zones.map((zone: Zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <div key={zone.id}>
                  <button
                    type="button"
                    className={`${styles.zoneCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedZone(zone);
                      setSelectedSubzoneIds([]);
                    }}
                  >
                    <span className={styles.zoneName}>{zone.name}</span>
                    <span className={styles.zoneType}>{zone.type}</span>
                  </button>

                  {isSelected && zone.subzones && zone.subzones.length > 0 && (
                    <div className={styles.subzoneList}>
                      {zone.subzones.map((subzone) => {
                        const isChecked = selectedSubzoneIds.includes(subzone.id);
                        return (
                          <button
                            key={subzone.id}
                            type="button"
                            className={`${styles.subzoneCard} ${isChecked ? styles.selected : ''}`}
                            onClick={() => toggleSubzone(subzone.id)}
                          >
                            {subzone.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={onClose} className={styles.cancelBtn}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" className={styles.saveBtn}>
          {editSchedule ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateScheduleModal;
