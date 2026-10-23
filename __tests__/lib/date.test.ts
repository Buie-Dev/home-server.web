import { formatDate, sqlToday, isValid, dateFormats } from 'lib/date';
import dayjs from 'dayjs';

describe('dateFormats', () => {
  it('has all expected format keys', () => {
    expect(dateFormats).toEqual({
      fullPretty: 'MMMM D, YYYY',
      abbreviatedPretty: 'MMM D, YYYY',
      abbreviatedPrettyWithWeekday: 'ddd, MMM D, YYYY',
      dateOnlyPretty: 'YYYY-MM-DD',
      time: 'HH:mm',
      timeWithSeconds: 'HH:mm:ss',
      dateTimeShort: 'MMM D, HH:mm',
    });
  });
});

describe('formatDate', () => {
  it('formats a valid date string', () => {
    expect(formatDate('2024-06-15', dateFormats.fullPretty)).toBe('June 15, 2024');
  });

  it('formats with abbreviated format', () => {
    expect(formatDate('2024-06-15', dateFormats.abbreviatedPretty)).toBe('Jun 15, 2024');
  });

  it('returns empty string for null', () => {
    expect(formatDate(null, dateFormats.fullPretty)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined, dateFormats.fullPretty)).toBe('');
  });

  it('formats a Date object', () => {
    const date = new Date('2024-01-01T12:00:00');
    expect(formatDate(date, dateFormats.dateOnlyPretty)).toBe('2024-01-01');
  });
});

describe('sqlToday', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const expected = dayjs().format('YYYY-MM-DD');
    expect(sqlToday()).toBe(expected);
  });
});

describe('isValid', () => {
  it('returns true for a valid date string', () => {
    expect(isValid('2024-06-15')).toBe(true);
  });

  it('returns true for a Date object', () => {
    expect(isValid(new Date())).toBe(true);
  });

  it('returns false for an invalid string', () => {
    expect(isValid('not-a-date')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValid(null)).toBe(false);
  });
});
