import { renderHook, act } from '@testing-library/react';

vi.mock('components/ConfirmModal/ConfirmModal', () => ({
  default: () => null,
}));

import useConfirm from 'hooks/useConfirm.hook';

describe('useConfirm', () => {
  it('returns confirm, alert, prompt, and confirmElement', () => {
    const { result } = renderHook(() => useConfirm());
    expect(typeof result.current.confirm).toBe('function');
    expect(typeof result.current.alert).toBe('function');
    expect(typeof result.current.prompt).toBe('function');
    expect(result.current.confirmElement).toBeDefined();
  });

  it('confirm resolves true on confirm', async () => {
    const { result } = renderHook(() => useConfirm());

    let outcome: boolean | undefined;

    await act(async () => {
      const promise = result.current.confirm({ message: 'Are you sure?' });
      // Schedule the confirm action on the next microtask
      queueMicrotask(() => {
        (result.current.confirmElement.props as { onConfirm: () => void }).onConfirm();
      });
      outcome = await promise;
    });

    expect(outcome).toBe(true);
  });

  it('confirm resolves false on cancel', async () => {
    const { result } = renderHook(() => useConfirm());

    let outcome: boolean | undefined;

    await act(async () => {
      const promise = result.current.confirm({ message: 'Are you sure?' });
      queueMicrotask(() => {
        (result.current.confirmElement.props as { onCancel: () => void }).onCancel();
      });
      outcome = await promise;
    });

    expect(outcome).toBe(false);
  });

  it('alert resolves on confirm', async () => {
    const { result } = renderHook(() => useConfirm());

    let resolved = false;

    await act(async () => {
      const promise = result.current.alert({ message: 'Notice!' });
      queueMicrotask(() => {
        (result.current.confirmElement.props as { onConfirm: () => void }).onConfirm();
      });
      await promise;
      resolved = true;
    });

    expect(resolved).toBe(true);
  });

  it('prompt resolves with null on cancel', async () => {
    const { result } = renderHook(() => useConfirm());

    let outcome: string | null | undefined;

    await act(async () => {
      const promise = result.current.prompt({ message: 'Enter value' });
      queueMicrotask(() => {
        (result.current.confirmElement.props as { onCancel: () => void }).onCancel();
      });
      outcome = await promise;
    });

    expect(outcome).toBeNull();
  });

  it('prompt resolves with input value on confirm', async () => {
    const { result } = renderHook(() => useConfirm());

    let outcome: string | null | undefined;

    await act(async () => {
      const promise = result.current.prompt({ message: 'Name?', defaultValue: 'hello' });
      queueMicrotask(() => {
        (result.current.confirmElement.props as { onInputChange: (v: string) => void }).onInputChange('world');
        (result.current.confirmElement.props as { onConfirm: () => void }).onConfirm();
      });
      outcome = await promise;
    });

    expect(outcome).toBe('world');
  });

  it('sets correct default title for confirm mode', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({ message: 'Test' });
    });

    expect((result.current.confirmElement.props as { title: string }).title).toBe('Confirm');
  });

  it('sets correct default title for alert mode', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.alert({ message: 'Test' });
    });

    expect((result.current.confirmElement.props as { title: string }).title).toBe('Notice');
  });
});
