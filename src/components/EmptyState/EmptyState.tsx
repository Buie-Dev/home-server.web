import React, { ReactElement } from 'react';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}

function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps): ReactElement {
  return (
    <div className={styles.emptyState}>
      <Icon className={styles.emptyIcon} />
      <p className={styles.emptyTitle}>{title}</p>
      {subtitle && <p className={styles.emptySub}>{subtitle}</p>}
    </div>
  );
}

export default EmptyState;
