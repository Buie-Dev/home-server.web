import React, { ReactElement, useEffect, useRef, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GrassIcon from '@mui/icons-material/Grass';
import HomeIcon from '@mui/icons-material/Home';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import OpacityIcon from '@mui/icons-material/Opacity';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EmptyState from 'components/EmptyState/EmptyState';
import ManualIrrigationModal from 'components/ManualIrrigationModal/ManualIrrigationModal';
import PageContainer from 'components/PageContainer/PageContainer';
import useIrrigation, { Zone, ZoneType } from 'hooks/useIrrigation.hook';
import { formatTime } from 'lib/datetime';
import styles from './Zones.module.scss';

const ZONE_ICONS: Record<string, React.ElementType> = {
  garden: LocalFloristIcon,
  lawn: GrassIcon,
  drip: WaterDropIcon,
  patio: HomeIcon,
  shrub: LocalFloristIcon,
  default: OpacityIcon,
};

const getZoneIcon = (type: string): React.ElementType => ZONE_ICONS[type?.toLowerCase()] ?? OpacityIcon;

const getZoneStatus = (
  zone: Zone,
  priorityQueue: ReturnType<typeof useIrrigation>['priorityQueue']
): 'active' | 'queued' | 'idle' => {
  if (zone.state) return 'active';
  const inQueue = priorityQueue.find((item) => item.zone === zone.zone);
  if (inQueue) return 'queued';
  return 'idle';
};

function Zones(): ReactElement {
  const { fetchZones, zones, priorityQueue, fetchZoneTypes, zoneTypes } = useIrrigation();
  const [selectedZone, setSelectedZone] = useState<Zone | undefined>();
  const [selectedFilter, setSelectedFilter] = useState<ZoneType | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchZoneTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchZones(selectedFilter?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  useEffect(() => {
    if (!filterOpen) return;
    const handleOutside = (e: MouseEvent): void => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setFilterOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [filterOpen]);

  const handleSelectType = (zoneType: ZoneType | undefined): void => {
    setSelectedFilter(zoneType);
    setFilterOpen(false);
  };

  return (
    <PageContainer>
      {zoneTypes.length > 0 && (
        <div className={styles.filterBar} ref={filterRef}>
          <button
            type="button"
            className={`${styles.trigger} ${filterOpen ? styles.triggerOpen : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <span className={styles.triggerLabel}>{selectedFilter?.type ?? 'All types'}</span>
            <ExpandMoreIcon className={`${styles.triggerIcon} ${filterOpen ? styles.iconOpen : ''}`} />
          </button>

          {filterOpen && (
            <div className={styles.panel}>
              <button
                type="button"
                className={`${styles.option} ${!selectedFilter ? styles.optionActive : ''}`}
                onClick={() => handleSelectType(undefined)}
              >
                <span className={styles.checkSlot}>
                  {!selectedFilter && <CheckIcon className={styles.checkIcon} />}
                </span>
                <span>All types</span>
              </button>
              <div className={styles.divider} />
              {zoneTypes.map((zoneType) => (
                <button
                  key={zoneType.id}
                  type="button"
                  className={`${styles.option} ${selectedFilter?.id === zoneType.id ? styles.optionActive : ''}`}
                  onClick={() => handleSelectType(zoneType)}
                >
                  <span className={styles.checkSlot}>
                    {selectedFilter?.id === zoneType.id && <CheckIcon className={styles.checkIcon} />}
                  </span>
                  <span>{zoneType.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {zones.length === 0 ? (
        <EmptyState icon={OpacityIcon} title="No zones found" />
      ) : (
        <div className={styles.list}>
          {zones.map((zone) => {
            const status = getZoneStatus(zone, priorityQueue);
            const queueItem = priorityQueue.find((item) => item.zone === zone.zone);
            const ZoneIcon = getZoneIcon(zone.type);

            return (
              <button
                key={zone.id}
                type="button"
                className={`${styles.card} ${styles[status]}`}
                onClick={() => setSelectedZone(zone)}
              >
                <div className={`${styles.iconWrap} ${styles[`${status}Icon`]}`}>
                  <ZoneIcon className={styles.zoneIcon} />
                </div>

                <div className={styles.cardInfo}>
                  <span className={styles.zoneName}>{zone.name}</span>
                  <span className={styles.zoneType}>{zone.type}</span>
                  <span className={styles.zoneNumber}>Zone #{zone.zone}</span>
                </div>

                <div className={styles.cardRight}>
                  {status !== 'idle' && (
                    <span className={`${styles.badge} ${styles[`${status}Badge`]}`}>
                      {status === 'active' ? 'Active' : 'Queued'}
                    </span>
                  )}
                  {queueItem && <span className={styles.queueTimer}>{formatTime(queueItem.duration)}</span>}
                  {zone.subzones && zone.subzones.length > 0 && (
                    <span className={styles.subzoneCount}>{zone.subzones.length} zones</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <ManualIrrigationModal open={!!selectedZone} zone={selectedZone} onClose={() => setSelectedZone(undefined)} />
    </PageContainer>
  );
}

export default Zones;
