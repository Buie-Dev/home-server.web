import { ReactElement } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'default';
  mode: 'confirm' | 'alert' | 'prompt';
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  variant,
  mode,
  inputValue,
  onInputChange,
  onConfirm,
  onCancel,
}: ConfirmModalProps): ReactElement {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle className={styles.title}>{title}</DialogTitle>
      <DialogContent>
        <p className={styles.message}>{message}</p>
        {mode === 'prompt' && (
          <input
            className={styles.input}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
            autoFocus
          />
        )}
      </DialogContent>
      <DialogActions className={styles.actions}>
        {mode !== 'alert' && (
          <Button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </Button>
        )}
        <Button
          onClick={onConfirm}
          variant="contained"
          className={variant === 'danger' ? styles.dangerBtn : styles.confirmBtn}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmModal;
