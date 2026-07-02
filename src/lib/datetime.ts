export const formatTime = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const formatVolume = (litres: number, useGallons: boolean): string => {
  if (useGallons) {
    return `${(litres * 0.264172).toFixed(1)} gal`;
  }
  return `${litres.toFixed(1)} L`;
};
