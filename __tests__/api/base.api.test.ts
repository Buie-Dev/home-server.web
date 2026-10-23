import axios from 'axios';
import { get, post, put, del, setUnauthorizedHandler } from 'api/base.api';

vi.mock('axios', async () => {
  const actual: Record<string, unknown> = { default: {} };
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { ...actual, default: instance };
});

// Re-import to get the mocked instance
const mockedAxios = vi.mocked(axios);

describe('base.api', () => {
  describe('get', () => {
    it('calls axios.get with route and params', async () => {
      mockedAxios.get.mockResolvedValue({ data: { result: true } });
      const result = await get('/test', { id: 1 });
      expect(mockedAxios.get).toHaveBeenCalledWith('/test', {
        params: { id: 1 },
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      });
      expect(result).toEqual({ result: true });
    });
  });

  describe('post', () => {
    it('calls axios.post with route and data', async () => {
      mockedAxios.post.mockResolvedValue({ data: { id: 1 } });
      const result = await post('/test', { name: 'foo' });
      expect(mockedAxios.post).toHaveBeenCalledWith('/test', { name: 'foo' }, {
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('put', () => {
    it('calls axios.put with route and data', async () => {
      mockedAxios.put.mockResolvedValue({ data: { updated: true } });
      const result = await put('/test/1', { name: 'bar' });
      expect(mockedAxios.put).toHaveBeenCalledWith('/test/1', { name: 'bar' }, {
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      });
      expect(result).toEqual({ updated: true });
    });
  });

  describe('del', () => {
    it('calls axios.delete with route and data in body', async () => {
      mockedAxios.delete.mockResolvedValue({ data: { deleted: true } });
      const result = await del('/test/1', { reason: 'cleanup' });
      expect(mockedAxios.delete).toHaveBeenCalledWith('/test/1', {
        data: { reason: 'cleanup' },
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      });
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('headers', () => {
    it('includes cache-control headers', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      await get('/test');
      expect(mockedAxios.get).toHaveBeenCalledWith('/test', {
        params: undefined,
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }),
      });
    });
  });

  describe('setUnauthorizedHandler', () => {
    it('is a callable function', () => {
      expect(typeof setUnauthorizedHandler).toBe('function');
    });
  });
});
