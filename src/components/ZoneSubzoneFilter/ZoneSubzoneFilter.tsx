import React, { ReactElement, useEffect, useRef, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ZoneDetail } from 'hooks/useIrrigation.hook';
import styles from './ZoneSubzoneFilter.module.scss';

interface ZoneSubzoneFilterProps {
  zoneDetails: ZoneDetail[];
  activeZoneId?: number;
  activeSubzoneId?: number;
  onZoneChange: (zoneId: number | undefined) => void;
  onSubzoneChange: (subzoneId: number | undefined) => void;
  allLabel?: string;
}

function ZoneSubzoneFilter({
  zoneDetails,
  activeZoneId,
  activeSubzoneId,
  onZoneChange,
  onSubzoneChange,
  allLabel = 'All zones',
}: ZoneSubzoneFilterProps): ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeZone = zoneDetails.find((z) => z.id === activeZoneId);
  const activeSubzone = activeZone?.subzones?.find((sz) => sz.id === activeSubzoneId);
  const triggerLabel = activeSubzone
    ? `${activeZone?.name} › ${activeSubzone.name}`
    : (activeZone?.name ?? allLabel);

  // Group zones by type for section headers
  const groupedZones = zoneDetails.reduce<Record<string, ZoneDetail[]>>((acc, zone) => {
    const key = zone.type ?? 'Other';
    (acc[key] = acc[key] ?? []).push(zone);
    return acc;
  }, {});
  const typeGroups = Object.entries(groupedZones);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelectAll = (): void => {
    onZoneChange(undefined);
    setOpen(false);
  };

  const handleSelectZone = (zone: ZoneDetail): void => {
    if (activeZoneId !== zone.id) {
      onZoneChange(zone.id);
    } else if (activeSubzoneId !== undefined) {
      onSubzoneChange(undefined);
    }
    const hasSubzones = (zone.subzones?.length ?? 0) > 0;
    if (!hasSubzones) setOpen(false);
  };

  const handleSelectSubzone = (subzoneId: number): void => {
    onSubzoneChange(subzoneId);
    setOpen(false);
  };

  const handleClearSubzone = (): void => {
    onSubzoneChange(undefined);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <ExpandMoreIcon className={`${styles.triggerIcon} ${open ? styles.iconOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.panel}>
          <button
            type="button"
            className={`${styles.option} ${!activeZoneId ? styles.optionActive : ''}`}
            onClick={handleSelectAll}
          >
            <span className={styles.checkSlot}>{!activeZoneId && <CheckIcon className={styles.checkIcon} />}</span>
            <span className={styles.optionLabel}>{allLabel}</span>
          </button>

          {typeGroups.map(([type, zones], groupIndex) => (
            <div key={type}>
              <div className={`${styles.divider} ${groupIndex === 0 ? styles.dividerFirst : ''}`} />
              <div className={styles.sectionHeader}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>

              {zones.map((zone) => {
                const isActive = activeZoneId === zone.id;
                const hasSubzones = (zone.subzones?.length ?? 0) > 0;
                return (
                  <div key={zone.id}>
                    <button
                      type="button"
                      className={`${styles.option} ${isActive && !activeSubzoneId ? styles.optionActive : ''}`}
                      onClick={() => handleSelectZone(zone)}
                    >
                      <span className={styles.checkSlot}>
                        {isActive && !activeSubzoneId && <CheckIcon className={styles.checkIcon} />}
                      </span>
                      <span className={styles.optionLabel}>{zone.name}</span>
                    </button>

                    {isActive && hasSubzones && (
                      <>
                        <button
                          type="button"
                          className={`${styles.option} ${styles.subOption} ${!activeSubzoneId ? styles.optionActive : ''}`}
                          onClick={handleClearSubzone}
                        >
                          <span className={styles.checkSlot}>
                            {!activeSubzoneId && <CheckIcon className={styles.checkIcon} />}
                          </span>
                          <span className={styles.optionLabel}>All {zone.name}</span>
                        </button>
                        {zone.subzones!.map((subzone) => (
                          <button
                            key={subzone.id}
                            type="button"
                            className={`${styles.option} ${styles.subOption} ${activeSubzoneId === subzone.id ? styles.optionActive : ''}`}
                            onClick={() => handleSelectSubzone(subzone.id)}
                          >
                            <span className={styles.checkSlot}>
                              {activeSubzoneId === subzone.id && <CheckIcon className={styles.checkIcon} />}
                            </span>
                            <span className={styles.optionLabel}>{subzone.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ZoneSubzoneFilter;
