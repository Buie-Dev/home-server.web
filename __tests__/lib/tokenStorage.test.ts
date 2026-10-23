import { getToken, setToken, clearToken } from 'lib/tokenStorage';

describe('tokenStorage', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setToken('my-jwt-token');
    expect(getToken()).toBe('my-jwt-token');
  });

  it('uses the correct localStorage key', () => {
    setToken('abc');
    expect(localStorage.getItem('dandelion_token')).toBe('abc');
  });

  it('clears the token', () => {
    setToken('my-jwt-token');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('overwrites an existing token', () => {
    setToken('first');
    setToken('second');
    expect(getToken()).toBe('second');
  });
});
