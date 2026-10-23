describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses domain when VITE_DOMAIN is set', async () => {
    vi.stubEnv('VITE_DOMAIN', 'example.com');
    const { baseAPIUrl, baseWebSocketUrl } = await import('config/config');
    expect(baseAPIUrl).toBe('https://example.com/api');
    expect(baseWebSocketUrl).toBe('wss://example.com/ws');
  });

  it('uses IP and port when VITE_DOMAIN is empty', async () => {
    vi.stubEnv('VITE_DOMAIN', '');
    vi.stubEnv('VITE_SERVER', '192.168.1.100');
    vi.stubEnv('VITE_API_PORT', '5001');
    vi.stubEnv('VITE_WEBSOCKET', '192.168.1.100');
    vi.stubEnv('VITE_WS_PORT', '8765');
    const { baseAPIUrl, baseWebSocketUrl } = await import('config/config');
    expect(baseAPIUrl).toBe('http://192.168.1.100:5001');
    expect(baseWebSocketUrl).toBe('ws://192.168.1.100:8765');
  });

  it('uses IP and port when VITE_DOMAIN is undefined', async () => {
    vi.stubEnv('VITE_DOMAIN', undefined as unknown as string);
    vi.stubEnv('VITE_SERVER', '10.0.0.1');
    vi.stubEnv('VITE_API_PORT', '3000');
    vi.stubEnv('VITE_WEBSOCKET', '10.0.0.1');
    vi.stubEnv('VITE_WS_PORT', '9000');
    const { baseAPIUrl, baseWebSocketUrl } = await import('config/config');
    expect(baseAPIUrl).toBe('http://10.0.0.1:3000');
    expect(baseWebSocketUrl).toBe('ws://10.0.0.1:9000');
  });
});
