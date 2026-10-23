import React, { ReactElement, useEffect, useRef } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmptyState from 'components/EmptyState/EmptyState';
import LoadingSpinner from 'components/LoadingSpinner/LoadingSpinner';
import PageContainer from 'components/PageContainer/PageContainer';
import useDevices from 'hooks/useDevices.hook';
import { useWebSocket } from 'context/WebSocketContext';
import styles from './Devices.module.scss';

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking…',
};

function Devices(): ReactElement {
  const { devices, fetchDevices, checkConnectivity, loading } = useDevices();
  const { isConnected } = useWebSocket();
  const hasAutoPinged = useRef(false);

  useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (devices.length > 0 && isConnected && !hasAutoPinged.current) {
      hasAutoPinged.current = true;
      checkConnectivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.length, isConnected]);

  const handleRefresh = async (): Promise<void> => {
    hasAutoPinged.current = false;
    await fetchDevices();
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Devices</h2>
        <Tooltip title="Refresh &amp; ping devices">
          <span>
            <IconButton onClick={handleRefresh} disabled={loading || !isConnected} className={styles.refreshBtn}>
              <RefreshIcon className={styles.refreshIcon} />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {!isConnected && <div className={styles.wsBanner}>WebSocket disconnected — health checks unavailable</div>}

      {loading ? (
        <LoadingSpinner />
      ) : devices.length === 0 ? (
        <EmptyState icon={DevicesOtherIcon} title="No devices found" />
      ) : (
        <div className={styles.list}>
          {devices.map((device) => (
            <div key={device.id} className={styles.card}>
              <div className={`${styles.statusDot} ${styles[device.status]}`} />
              <div className={styles.deviceInfo}>
                <span className={styles.deviceName}>{device.name}</span>
                {device.description && <span className={styles.deviceDesc}>{device.description}</span>}
                {device.lastChecked && (
                  <span className={styles.lastChecked}>
                    Last checked {device.lastChecked.toLocaleTimeString()}
                    {device.responseTimeMs !== undefined && ` · ${device.responseTimeMs}ms`}
                  </span>
                )}
              </div>
              <span className={`${styles.statusBadge} ${styles[`${device.status}Badge`]}`}>
                {device.status === 'checking' ? (
                  <CircularProgress size={10} className={styles.checkingSpinner} />
                ) : null}
                {STATUS_LABELS[device.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      {devices.length > 0 && !loading && (
        <div className={styles.pingRow}>
          <button
            type="button"
            className={styles.pingBtn}
            onClick={checkConnectivity}
            disabled={!isConnected || devices.length === 0}
          >
            Ping All Devices
          </button>
        </div>
      )}
    </PageContainer>
  );
}

export default Devices;
