import React, { ReactElement, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import { useWebSocket } from 'context/WebSocketContext';
import { Subzone, Zone } from 'hooks/useIrrigation.hook';
import styles from './ManualIrrigationModal.module.scss';

interface ManualIrrigationModalProps {
  open: boolean;
  zone?: Zone;
  onClose: () => void;
}

type SubzoneControl = Subzone & {
  isChecked: boolean;
};

function ManualIrrigationModal({ open, zone, onClose }: ManualIrrigationModalProps): ReactElement {
  const [duration, setDuration] = useState('');
  const [subzones, setSubzones] = useState<SubzoneControl[]>([]);
  const [durationError, setDurationError] = useState('');
  const { sendMessage } = useWebSocket();

  useEffect(() => {
    if (zone) {
      setSubzones((zone.subzones ?? []).map((subzone) => ({ ...subzone, isChecked: false })));
    }
    setDuration('');
    setDurationError('');
  }, [zone]);

  const toggleSubzone = (subzoneId: number): void => {
    setSubzones((prev) =>
      prev.map((subzone) => (subzone.id === subzoneId ? { ...subzone, isChecked: !subzone.isChecked } : subzone))
    );
  };

  const handleStart = (): void => {
    const parsedDuration = parseFloat(duration);
    if (!duration || isNaN(parsedDuration) || parsedDuration <= 0) {
      setDurationError('Enter a valid duration in minutes');
      return;
    }

    sendMessage('request', {
      priority: 1,
      duration: parsedDuration,
      zone: zone!.zone,
      subzones: subzones.filter((subzone) => subzone.isChecked).map((subzone) => ({ id: subzone.subzone, state: 1 })),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle className={styles.title}>{zone?.name ?? 'Start Irrigation'}</DialogTitle>
      <DialogContent className={styles.content}>
        <TextField
          label="Duration (minutes)"
          value={duration}
          onChange={(event) => {
            setDuration(event.target.value);
            setDurationError('');
          }}
          type="number"
          inputProps={{ min: 0, step: 1 }}
          error={!!durationError}
          helperText={durationError || ' '}
          fullWidth
          autoFocus
          size="small"
          className={styles.durationField}
        />

        {subzones.length > 0 && (
          <div className={styles.subzones}>
            <p className={styles.subzonesLabel}>Subzones</p>
            {subzones.map((subzone) => (
              <FormControlLabel
                key={subzone.id}
                control={
                  <Checkbox
                    checked={subzone.isChecked}
                    onChange={() => toggleSubzone(subzone.id)}
                    size="small"
                    className={styles.checkbox}
                  />
                }
                label={subzone.name}
                className={styles.checkboxLabel}
              />
            ))}
          </div>
        )}
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={onClose} className={styles.cancelBtn}>
          Cancel
        </Button>
        <Button onClick={handleStart} variant="contained" className={styles.startBtn}>
          Start
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManualIrrigationModal;
