import { loginRequest, fetchMyPermissions, fetchAllUsers, setUserPermissions, createUser, deleteUser } from 'api/auth.api';

vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';

const mockedGet = vi.mocked(base.get);
const mockedPost = vi.mocked(base.post);
const mockedPut = vi.mocked(base.put);
const mockedDel = vi.mocked(base.del);

describe('auth.api', () => {
  describe('loginRequest', () => {
    it('posts to /auth/login with credentials', async () => {
      mockedPost.mockResolvedValue({ token: 'jwt123' });
      const result = await loginRequest('admin', 'password');
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), { username: 'admin', password: 'password' });
      expect(result).toEqual({ token: 'jwt123' });
    });
  });

  describe('fetchMyPermissions', () => {
    it('gets /auth/me/permissions', async () => {
      mockedGet.mockResolvedValue({ user_id: 1, pages: ['irrigation'] });
      const result = await fetchMyPermissions();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/auth/me/permissions'));
      expect(result).toEqual({ user_id: 1, pages: ['irrigation'] });
    });
  });

  describe('fetchAllUsers', () => {
    it('gets /admin/users', async () => {
      mockedGet.mockResolvedValue([{ id: 1, username: 'admin', permissions: {} }]);
      const result = await fetchAllUsers();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/admin/users'));
      expect(result).toEqual([{ id: 1, username: 'admin', permissions: {} }]);
    });
  });

  describe('setUserPermissions', () => {
    it('puts to /admin/users/:id/permissions', async () => {
      mockedPut.mockResolvedValue(undefined);
      await setUserPermissions(1, { irrigation: true });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/admin/users/1/permissions'), { irrigation: true });
    });
  });

  describe('createUser', () => {
    it('posts to /admin/users', async () => {
      mockedPost.mockResolvedValue({ id: 2, username: 'new' });
      const result = await createUser({ username: 'new', password: 'pass' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/admin/users'), { username: 'new', password: 'pass' });
      expect(result).toEqual({ id: 2, username: 'new' });
    });
  });

  describe('deleteUser', () => {
    it('deletes /admin/users/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteUser({ userId: 3 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/admin/users/3'));
    });
  });
});
