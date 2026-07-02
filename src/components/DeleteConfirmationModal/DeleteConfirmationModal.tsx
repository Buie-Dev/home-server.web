import React, { ReactElement } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import styles from './DeleteConfirmationModal.module.scss';

interface DeleteConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmationModal({ open, title, message, onCancel, onConfirm }: DeleteConfirmationModalProps): ReactElement {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle className={styles.title}>
        <WarningAmberIcon className={styles.warningIcon} />
        {title}
      </DialogTitle>
      <DialogContent>
        <p className={styles.message}>{message}</p>
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" className={styles.deleteBtn}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirmationModal;
