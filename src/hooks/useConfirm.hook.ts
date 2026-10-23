import { ReactElement, createElement, useCallback, useRef, useState } from 'react';
import ConfirmModal from 'components/ConfirmModal/ConfirmModal';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
};

type PromptOptions = ConfirmOptions & {
  defaultValue?: string;
};

type ModalState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'default';
  mode: 'confirm' | 'alert' | 'prompt';
};

type UseConfirmReturn = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: ConfirmOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  confirmElement: ReactElement;
};

export default function useConfirm(): UseConfirmReturn {
  const [open, setOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    title: '',
    message: '',
    confirmLabel: 'OK',
    variant: 'default',
    mode: 'confirm',
  });
  const [inputValue, setInputValue] = useState('');

  const resolveRef = useRef<((value: any) => void) | null>(null);
  const modeRef = useRef<'confirm' | 'alert' | 'prompt'>('confirm');
  const inputRef = useRef('');

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    inputRef.current = value;
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    const mode = modeRef.current;
    if (mode === 'prompt') {
      resolveRef.current?.(inputRef.current);
    } else if (mode === 'confirm') {
      resolveRef.current?.(true);
    } else {
      resolveRef.current?.(undefined);
    }
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    const mode = modeRef.current;
    if (mode === 'prompt') {
      resolveRef.current?.(null);
    } else {
      resolveRef.current?.(false);
    }
    resolveRef.current = null;
  }, []);

  const showModal = useCallback(
    (mode: 'confirm' | 'alert' | 'prompt', options: ConfirmOptions & { defaultValue?: string }): Promise<any> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        modeRef.current = mode;
        const defaultVal = (options as PromptOptions).defaultValue ?? '';
        inputRef.current = defaultVal;
        setInputValue(defaultVal);
        setModalState({
          title: options.title ?? (mode === 'alert' ? 'Notice' : 'Confirm'),
          message: options.message,
          confirmLabel: options.confirmLabel ?? (mode === 'confirm' ? 'Yes' : 'OK'),
          variant: options.variant ?? 'default',
          mode,
        });
        setOpen(true);
      });
    },
    []
  );

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => showModal('confirm', options),
    [showModal]
  );

  const alertFn = useCallback((options: ConfirmOptions): Promise<void> => showModal('alert', options), [showModal]);

  const promptFn = useCallback(
    (options: PromptOptions): Promise<string | null> => showModal('prompt', options),
    [showModal]
  );

  const confirmElement = createElement(ConfirmModal, {
    open,
    title: modalState.title,
    message: modalState.message,
    confirmLabel: modalState.confirmLabel,
    variant: modalState.variant,
    mode: modalState.mode,
    inputValue,
    onInputChange: handleInputChange,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  });

  return { confirm, alert: alertFn, prompt: promptFn, confirmElement };
}
