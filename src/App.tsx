import React, { ReactElement } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from 'components/Layout/Layout';
import Devices from 'screens/Devices/Devices';
import Events from 'screens/Events/Events';
import History from 'screens/History/History';
import Irrigation from 'screens/Irrigation/Irrigation';
import Login from 'screens/Login/Login';
import People from 'screens/People/People';
import Permissions from 'screens/Permissions/Permissions';
import ToDo from 'screens/ToDo/ToDo';
import Queue from 'screens/Queue/Queue';
import Schedules from 'screens/Schedules/Schedules';
import Zones from 'screens/Zones/Zones';
import { useAuth } from 'context/AuthContext';
import { PAGE_PATHS } from 'lib/pagesPaths';

const FIRST_PAGE_ORDER = [
  { permission: 'irrigation', path: PAGE_PATHS.ZONES },
  { permission: 'todo', path: PAGE_PATHS.TODO },
  { permission: 'people', path: PAGE_PATHS.PEOPLE },
  { permission: 'devices', path: PAGE_PATHS.DEVICES },
  { permission: 'events', path: PAGE_PATHS.EVENTS },
  { permission: 'admin', path: PAGE_PATHS.PERMISSIONS },
];

function NoAccess(): ReactElement {
  return (
    <div style={{ padding: '2rem', color: '#666', fontSize: '0.95rem' }}>
      No pages have been assigned to your account. Contact an admin.
    </div>
  );
}

function DefaultRedirect(): ReactElement {
  const { hasPermission, isLoading } = useAuth();
  if (isLoading) return <></>;
  const first = FIRST_PAGE_ORDER.find((p) => hasPermission(p.permission));
  return first ? <Navigate to={first.path} replace /> : <NoAccess />;
}

function PermissionRoute({ permission, children }: { permission: string; children: ReactElement }): ReactElement {
  const { hasPermission, isLoading } = useAuth();
  if (isLoading) return <></>;
  return hasPermission(permission) ? children : <DefaultRedirect />;
}

const router = createBrowserRouter([
  {
    path: PAGE_PATHS.LOGIN,
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DefaultRedirect /> },
      {
        path: 'irrigation',
        element: <PermissionRoute permission="irrigation"><Irrigation /></PermissionRoute>,
        children: [
          { index: true, element: <Navigate to={PAGE_PATHS.ZONES} replace /> },
          { path: 'zones', element: <Zones /> },
          { path: 'schedules', element: <Schedules /> },
          { path: 'live', element: <Queue /> },
          { path: 'history', element: <History /> },
        ],
      },
      { path: 'todo', element: <PermissionRoute permission="todo"><ToDo /></PermissionRoute> },
      { path: 'devices', element: <PermissionRoute permission="devices"><Devices /></PermissionRoute> },
      { path: 'events', element: <PermissionRoute permission="events"><Events /></PermissionRoute> },
      { path: 'people', element: <PermissionRoute permission="people"><People /></PermissionRoute> },
      { path: 'admin/permissions', element: <PermissionRoute permission="admin"><Permissions /></PermissionRoute> },
    ],
  },
  {
    path: '*',
    element: <Navigate to={PAGE_PATHS.LOGIN} replace />,
  },
]);

function App(): ReactElement {
  return <RouterProvider router={router} />;
}

export default App;
