import React, { ReactElement, useEffect, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import EmptyState from 'components/EmptyState/EmptyState';
import PageContainer from 'components/PageContainer/PageContainer';
import useIrrigation from 'hooks/useIrrigation.hook';
import { useWebSocket } from 'context/WebSocketContext';
import { usePreferences } from 'context/PreferencesContext';
import { formatTime, formatVolume } from 'lib/datetime';
import styles from './Queue.module.scss';

function Queue(): ReactElement {
  const { priorityQueue, stopAll, stopQueueItem } = useIrrigation();
  const { liveFlow } = useWebSocket();
  const { useGallons } = usePreferences();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeItem = priorityQueue[0] ?? null;
  const queuedItems = priorityQueue.slice(1);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!activeItem) {
      setRemainingTime(null);
      return;
    }

    const totalDuration = activeItem.duration;
    let initialRemaining = totalDuration;

    if (activeItem.startTime) {
      const elapsed = Math.floor((Date.now() - activeItem.startTime * 1000) / 1000);
      initialRemaining = Math.max(0, totalDuration - elapsed);
    }

    setRemainingTime(initialRemaining);

    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeItem?.id, activeItem?.startTime]);

  const getProgressPercent = (): number => {
    if (!activeItem || remainingTime === null) return 0;
    const elapsed = activeItem.duration - remainingTime;
    return Math.min(100, (elapsed / activeItem.duration) * 100);
  };

  if (!activeItem && priorityQueue.length === 0) {
    return (
      <PageContainer>
        <EmptyState icon={PlayCircleIcon} title="No active irrigation" subtitle="Start a zone from the Zones tab" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {activeItem && (
        <div className={styles.activeCard}>
          <div className={styles.activeHeader}>
            <div className={styles.activeInfo}>
              <span className={styles.activeLabel}>Now Running</span>
              <h2 className={styles.activeName}>{activeItem.name}</h2>
              {activeItem.subZones && activeItem.subZones.length > 0 && (
                <p className={styles.activeSubzones}>{activeItem.subZones.map((zone) => zone.name).join(', ')}</p>
              )}
            </div>
            <Tooltip title="Stop">
              <IconButton onClick={() => stopQueueItem(activeItem.id)} className={styles.stopBtn}>
                <StopCircleIcon className={styles.stopIcon} />
              </IconButton>
            </Tooltip>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${getProgressPercent()}%` }} />
          </div>

          <div className={styles.activeStats}>
            <span className={styles.statItem}>
              {remainingTime !== null ? formatTime(remainingTime) : '—'} left
            </span>
            <span className={styles.statItem}>{formatTime(activeItem.duration)} total</span>
            {liveFlow && (
              <span className={styles.statItem}>
                {formatVolume(liveFlow.litres, useGallons)} flowing
              </span>
            )}
          </div>
        </div>
      )}

      {queuedItems.length > 0 && (
        <div className={styles.queue}>
          <div className={styles.queueHeader}>
            <h3 className={styles.queueTitle}>Up Next ({queuedItems.length})</h3>
            <button type="button" className={styles.stopAllBtn} onClick={stopAll}>
              Stop All
            </button>
          </div>

          <div className={styles.queueList}>
            {queuedItems.map((item, index) => (
              <div key={item.id} className={styles.queueItem}>
                <span className={styles.queuePosition}>{index + 2}</span>
                <div className={styles.queueInfo}>
                  <span className={styles.queueName}>{item.name}</span>
                  {item.subZones && item.subZones.length > 0 && (
                    <span className={styles.queueSubzones}>{item.subZones.map((zone) => zone.name).join(', ')}</span>
                  )}
                </div>
                <span className={styles.queueDuration}>{formatTime(item.duration)}</span>
                <Tooltip title="Remove from queue">
                  <IconButton size="small" onClick={() => stopQueueItem(item.id)}>
                    <StopCircleIcon className={styles.queueStopIcon} fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeItem && queuedItems.length === 0 && (
        <div className={styles.stopAllRow}>
          <button type="button" className={styles.stopAllBtn} onClick={stopAll}>
            Stop All
          </button>
        </div>
      )}
    </PageContainer>
  );
}

export default Queue;
