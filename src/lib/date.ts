import dayjs from 'dayjs';

export const dateFormats = {
  fullPretty: 'MMMM D, YYYY',
  abbreviatedPretty: 'MMM D, YYYY',
  abbreviatedPrettyWithWeekday: 'ddd, MMM D, YYYY',
  dateOnlyPretty: 'YYYY-MM-DD',
  time: 'HH:mm',
  timeWithSeconds: 'HH:mm:ss',
  dateTimeShort: 'MMM D, HH:mm',
};

export const formatDate = (date: string | Date | null | undefined, format: string): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const sqlToday = (): string => dayjs().format('YYYY-MM-DD');

export const isValid = (date: string | Date | null | undefined): boolean => dayjs(date).isValid();
