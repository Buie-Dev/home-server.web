import { renderHook } from '@testing-library/react';
import useBodyScrollLock from 'hooks/useBodyScrollLock.hook';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
  });

  it('locks body scroll when active (default)', () => {
    renderHook(() => useBodyScrollLock());

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.left).toBe('0px');
    expect(document.body.style.right).toBe('0px');
  });

  it('does not lock when active is false', () => {
    renderHook(() => useBodyScrollLock(false));

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('unlocks body scroll on unmount', () => {
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.position).toBe('fixed');

    unmount();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.left).toBe('');
    expect(document.body.style.right).toBe('');
  });

  it('unlocks when active changes to false', () => {
    const { rerender } = renderHook(({ active }) => useBodyScrollLock(active), {
      initialProps: { active: true },
    });

    expect(document.body.style.position).toBe('fixed');

    rerender({ active: false });

    expect(document.body.style.position).toBe('');
  });
});
