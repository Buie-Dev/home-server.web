import React, { ReactElement, useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import DeleteConfirmationModal from 'components/DeleteConfirmationModal/DeleteConfirmationModal';
import EmptyState from 'components/EmptyState/EmptyState';
import LoadingSpinner from 'components/LoadingSpinner/LoadingSpinner';
import PageContainer from 'components/PageContainer/PageContainer';
import ZoneSubzoneFilter from 'components/ZoneSubzoneFilter/ZoneSubzoneFilter';
import useHistory, { HistoryFilters, IrrigationRun } from 'hooks/useHistory.hook';
import useIrrigation from 'hooks/useIrrigation.hook';
import { usePreferences } from 'context/PreferencesContext';
import { formatDate, dateFormats } from 'lib/date';
import { formatTime, formatVolume } from 'lib/datetime';
import styles from './History.module.scss';

function History(): ReactElement {
  const { history, totals, fetchHistory, loadMore, deleteHistory, loading, loadingMore, hasMore } = useHistory();
  const { zoneDetails, fetchZones } = useIrrigation();
  const { useGallons } = usePreferences();
  const [runToDelete, setRunToDelete] = useState<IrrigationRun | undefined>();
  const [filters, setFilters] = useState<HistoryFilters>({});

  useEffect(() => {
    fetchZones();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleZoneFilter = (zoneId: number | undefined): void => {
    const updatedFilters: HistoryFilters = { ...filters, zoneId, subzoneId: undefined };
    setFilters(updatedFilters);
    fetchHistory(updatedFilters);
  };

  const handleSubzoneFilter = (subzoneId: number | undefined): void => {
    const updatedFilters: HistoryFilters = { ...filters, subzoneId };
    setFilters(updatedFilters);
    fetchHistory(updatedFilters);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!runToDelete) return;
    await deleteHistory(runToDelete.id);
    setRunToDelete(undefined);
  };

  return (
    <PageContainer>
      {totals && (
        <div className={styles.totalsRow}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Today</span>
            <span className={styles.totalValue}>{formatVolume(totals.today.litres, useGallons)}</span>
            <span className={styles.totalSub}>
              {totals.today.runs} runs · {totals.today.minutes} min
            </span>
          </div>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>This Week</span>
            <span className={styles.totalValue}>{formatVolume(totals.week.litres, useGallons)}</span>
            <span className={styles.totalSub}>
              {totals.week.runs} runs · {totals.week.minutes} min
            </span>
          </div>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>This Month</span>
            <span className={styles.totalValue}>{formatVolume(totals.month.litres, useGallons)}</span>
            <span className={styles.totalSub}>
              {totals.month.runs} runs · {totals.month.minutes} min
            </span>
          </div>
        </div>
      )}

      {zoneDetails.length > 0 && (
        <ZoneSubzoneFilter
          zoneDetails={zoneDetails}
          activeZoneId={filters.zoneId}
          activeSubzoneId={filters.subzoneId}
          onZoneChange={handleZoneFilter}
          onSubzoneChange={handleSubzoneFilter}
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : history.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No history found" />
      ) : (
        <>
          <div className={styles.list}>
            {history.map((run) => (
              <div key={run.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardInfo}>
                    <span className={styles.runName}>{run.zoneName}</span>
                    {run.subzoneName && <span className={styles.subzoneName}>{run.subzoneName}</span>}
                    <span className={styles.runDate}>
                      {formatDate(run.startedAt, dateFormats.abbreviatedPrettyWithWeekday)}
                    </span>
                    <span className={styles.runTime}>
                      {formatDate(run.startedAt, dateFormats.time)} – {formatDate(run.endedAt, dateFormats.time)}
                    </span>
                  </div>
                  <div className={styles.cardStats}>
                    <span className={styles.statValue}>{formatVolume(run.totalLitres, useGallons)}</span>
                    <span className={styles.statLabel}>{formatTime(run.durationSeconds)}</span>
                  </div>
                </div>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => setRunToDelete(run)} className={styles.deleteBtn}>
                    <DeleteIcon className={styles.deleteIcon} fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMoreRow}>
              <button type="button" className={styles.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <CircularProgress size={16} className={styles.spinner} /> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      <DeleteConfirmationModal
        open={!!runToDelete}
        title="Delete History Entry"
        message={`Remove this irrigation run from ${runToDelete ? formatDate(runToDelete.startedAt, dateFormats.abbreviatedPretty) : ''}?`}
        onCancel={() => setRunToDelete(undefined)}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}

export default History;
