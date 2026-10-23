import { PAGE_PATHS } from 'lib/pagesPaths';

describe('PAGE_PATHS', () => {
  it('has all 14 path keys', () => {
    const keys = Object.keys(PAGE_PATHS);
    expect(keys).toHaveLength(14);
  });

  it('has the expected keys', () => {
    expect(PAGE_PATHS).toHaveProperty('LOGIN');
    expect(PAGE_PATHS).toHaveProperty('IRRIGATION');
    expect(PAGE_PATHS).toHaveProperty('ZONES');
    expect(PAGE_PATHS).toHaveProperty('SCHEDULES');
    expect(PAGE_PATHS).toHaveProperty('LIVE');
    expect(PAGE_PATHS).toHaveProperty('HISTORY');
    expect(PAGE_PATHS).toHaveProperty('DEVICES');
    expect(PAGE_PATHS).toHaveProperty('EVENTS');
    expect(PAGE_PATHS).toHaveProperty('TODO');
    expect(PAGE_PATHS).toHaveProperty('PEOPLE');
    expect(PAGE_PATHS).toHaveProperty('PERMISSIONS');
    expect(PAGE_PATHS).toHaveProperty('ROWING');
    expect(PAGE_PATHS).toHaveProperty('ROWING_RACE');
    expect(PAGE_PATHS).toHaveProperty('ROWING_STROKE_RATE');
  });

  it('all paths start with /', () => {
    for (const path of Object.values(PAGE_PATHS)) {
      expect(path).toMatch(/^\//);
    }
  });
});
