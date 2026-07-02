import React, { ReactElement } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { usePreferences } from 'context/PreferencesContext';
import { PAGE_PATHS } from 'lib/pagesPaths';
import styles from './Irrigation.module.scss';

const TABS = [
  { path: PAGE_PATHS.ZONES, label: 'Zones', Icon: WaterDropIcon },
  { path: PAGE_PATHS.SCHEDULES, label: 'Schedules', Icon: CalendarMonthIcon },
  { path: PAGE_PATHS.LIVE, label: 'Live', Icon: PlayCircleIcon },
  { path: PAGE_PATHS.HISTORY, label: 'History', Icon: HistoryIcon },
];

function Irrigation(): ReactElement {
  const { useGallons, toggleUnit } = usePreferences();

  return (
    <div className={styles.root}>
      <nav className={styles.tabBar}>
        {TABS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            <Icon fontSize="small" className={styles.tabIcon} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className={styles.unitToggle}>
          <button className={`${styles.unitBtn} ${!useGallons ? styles.unitActive : ''}`} onClick={() => useGallons && toggleUnit()}>L</button>
          <button className={`${styles.unitBtn} ${useGallons ? styles.unitActive : ''}`} onClick={() => !useGallons && toggleUnit()}>gal</button>
        </div>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default Irrigation;
