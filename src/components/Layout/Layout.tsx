import React, { ReactElement } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarStarIcon from '@mui/icons-material/Stars';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import PeopleIcon from '@mui/icons-material/People';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { useAuth } from 'context/AuthContext';
import { useWebSocket } from 'context/WebSocketContext';
import { PAGE_PATHS } from 'lib/pagesPaths';
import styles from './Layout.module.scss';

const ALL_NAV_ITEMS = [
  { path: PAGE_PATHS.IRRIGATION, label: 'Irrigation', Icon: WaterDropIcon, permission: 'irrigation' },
  { path: PAGE_PATHS.ROWING, label: 'Rowing', Icon: DirectionsBoatIcon, permission: 'rowing' },
  { path: PAGE_PATHS.TODO, label: 'To Do', Icon: ChecklistIcon, permission: 'todo' },
  { path: PAGE_PATHS.PEOPLE, label: 'People', Icon: PeopleIcon, permission: 'people' },
  { path: PAGE_PATHS.DEVICES, label: 'Devices', Icon: DevicesOtherIcon, permission: 'devices' },
  { path: PAGE_PATHS.EVENTS, label: 'Events', Icon: CalendarStarIcon, permission: 'events' },
  { path: PAGE_PATHS.PERMISSIONS, label: 'Admin', Icon: AdminPanelSettingsIcon, permission: 'admin' },
];

function Layout(): ReactElement {
  const { isAuthenticated, isLoading, logout, hasPermission } = useAuth();
  const { isConnected } = useWebSocket();
  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => hasPermission(item.permission));

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PAGE_PATHS.LOGIN} replace />;
  }

  return (
    <div className={styles.root}>
      <header className={styles.appBar}>
        <span className={styles.title}>Dandelion Lane</span>
        <div className={`${styles.connectionDot} ${isConnected ? styles.connected : styles.disconnected}`} title={isConnected ? 'Connected' : 'Disconnected'} />
        <button className={styles.logoutBtn} onClick={logout}>
          Sign out
        </button>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar}>
          {NAV_ITEMS.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navIcon} fontSize="small" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.active : ''}`}
          >
            <Icon className={styles.navIcon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Layout;
