import { ReactElement, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { PAGE_PATHS } from 'lib/pagesPaths';
import styles from './StrokeRate.module.scss';

function calcSpm(taps: number[]): number {
  const last3 = taps.slice(-3);
  const avgIntervalMs = (last3[2] - last3[0]) / 2;
  return Math.round(60000 / avgIntervalMs);
}

function StrokeRate(): ReactElement {
  const navigate = useNavigate();
  const [taps, setTaps] = useState<number[]>([]);

  const tapCount = taps.length;
  const spm = tapCount >= 3 ? calcSpm(taps) : null;

  const handleTap = (): void => {
    setTaps((prev) => [...prev, Date.now()]);
  };

  const handleReset = (): void => {
    setTaps([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(PAGE_PATHS.ROWING)}>
          <ArrowBackIcon fontSize="small" /> Rowing
        </button>
        <h1 className={styles.title}>Stroke Rate</h1>
        <button className={styles.resetBtn} onClick={handleReset} disabled={tapCount === 0}>
          <RestartAltIcon fontSize="small" /> Reset
        </button>
      </div>

      <div className={styles.display}>
        {spm !== null ? (
          <>
            <span className={styles.spmValue}>{spm}</span>
            <span className={styles.spmLabel}>strokes / min</span>
          </>
        ) : (
          <>
            <span className={styles.spmPlaceholder}>—</span>
            <span className={styles.spmLabel}>
              {tapCount === 0 ? 'Tap to begin' : tapCount === 1 ? '2 more taps…' : '1 more tap…'}
            </span>
          </>
        )}
      </div>

      <button className={styles.tapBtn} onClick={handleTap}>
        TAP
      </button>
    </div>
  );
}

export default StrokeRate;
