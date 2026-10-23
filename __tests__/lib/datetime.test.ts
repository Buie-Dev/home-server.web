import { formatTime, formatVolume } from 'lib/datetime';

describe('formatTime', () => {
  it('formats zero seconds', () => {
    expect(formatTime(0)).toBe('0m 0s');
  });

  it('formats sub-minute values', () => {
    expect(formatTime(30)).toBe('0m 30s');
  });

  it('formats exact minutes', () => {
    expect(formatTime(120)).toBe('2m 0s');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatTime(90)).toBe('1m 30s');
  });

  it('formats large values', () => {
    expect(formatTime(3661)).toBe('61m 1s');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(30.9)).toBe('0m 30s');
  });
});

describe('formatVolume', () => {
  it('formats litres', () => {
    expect(formatVolume(10.5, false)).toBe('10.5 L');
  });

  it('formats gallons with conversion', () => {
    expect(formatVolume(10, true)).toBe('2.6 gal');
  });

  it('formats zero litres', () => {
    expect(formatVolume(0, false)).toBe('0.0 L');
  });

  it('formats zero gallons', () => {
    expect(formatVolume(0, true)).toBe('0.0 gal');
  });

  it('uses correct conversion factor', () => {
    const litres = 3.78541;
    expect(formatVolume(litres, true)).toBe('1.0 gal');
  });
});
