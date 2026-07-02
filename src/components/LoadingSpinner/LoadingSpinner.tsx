import React, { ReactElement } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: number;
}

function LoadingSpinner({ size = 28 }: LoadingSpinnerProps): ReactElement {
  return (
    <div className={styles.loadingState}>
      <CircularProgress size={size} className={styles.spinner} />
    </div>
  );
}

export default LoadingSpinner;
