import React, { ReactElement, ReactNode } from 'react';
import styles from './PageContainer.module.scss';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

function PageContainer({ children, className }: PageContainerProps): ReactElement {
  return (
    <div className={[styles.page, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export default PageContainer;
