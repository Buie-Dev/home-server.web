vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import { fetchDeviceStatus } from 'api/devices.api';

const mockedGet = vi.mocked(base.get);

describe('devices.api', () => {
  describe('fetchDeviceStatus', () => {
    it('calls get with devices endpoint', async () => {
      mockedGet.mockResolvedValue([{ id: '1', name: 'garden-pi' }]);
      const result = await fetchDeviceStatus();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/devices'));
      expect(result).toEqual([{ id: '1', name: 'garden-pi' }]);
    });
  });
});
