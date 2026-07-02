import * as base from 'api/base.api';
import { DEVICES } from 'api/routes';

export const fetchDeviceStatus = async () => {
  return base.get(DEVICES);
};
