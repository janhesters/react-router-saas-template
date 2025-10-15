import type { Avatar as AvatarPrimitive } from 'radix-ui';
import type {
  ChangeEvent,
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
} from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const index = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + sizes[index]!
  );
}

type AvatarUploadContextType = {
  file: File | undefined;
  handleFileChange: ChangeEventHandler<HTMLInputElement>;
  handleRemoveFile: () => void;
  inputKey: number;
  previewUrl: string;
};

const AvatarUploadContext = createContext<AvatarUploadContextType>(
  undefined as never,
);

export function AvatarUpload({
  children,
  maxFileSize,
}: {
  children: ReactNode | ((props: { error: string }) => ReactNode);
  maxFileSize?: number;
}) {
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const [inputKey, setInputKey] = useState(Date.now());
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const currentFile = event.target.files?.[0];

      if (currentFile) {
        if (typeof maxFileSize === 'number' && currentFile.size > maxFileSize) {
          setError(
            `File "${currentFile.name}" exceeds the maximum size of ${formatBytes(maxFileSize)}.`,
          );
          // Clear the invalid file from the input.
          event.target.value = '';
          return;
        }

        setError('');
        const url = URL.createObjectURL(currentFile);
        setPreviewUrl(url);
        setFile(currentFile);
      } else {
        setPreviewUrl('');
        setFile(undefined);
      }
    },
    [],
  );

  const handleRemoveFile = useCallback(() => {
    setError('');
    setFile(undefined);
    setPreviewUrl('');
    // By changing the key, we force React to re-mount the input,
    // which is the cleanest way to reset an uncontrolled component.
    setInputKey(Date.now());
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <AvatarUploadContext.Provider
      value={{ file, handleFileChange, handleRemoveFile, previewUrl, inputKey }}
    >
      {typeof children === 'function' ? children({ error }) : children}
    </AvatarUploadContext.Provider>
  );
}

function useAvatarUpload() {
  return useContext(AvatarUploadContext);
}

export function AvatarUploadImage({
  className,
  src,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
  const { previewUrl } = useAvatarUpload();

  return (
    <AvatarImage className={className} src={previewUrl || src} {...props} />
  );
}

export function AvatarUploadInput({
  onChange,
  ...props
}: ComponentProps<'input'>) {
  const { handleFileChange, inputKey } = useAvatarUpload();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleFileChange(event);
    onChange?.(event);
  }

  return <Input key={inputKey} {...props} onChange={handleChange} />;
}

export function AvatarUploadDescription({
  className,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p className={cn('text-muted-foreground text-xs', className)} {...props} />
  );
}

export function AvatarUploadRemoveButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const { handleRemoveFile } = useAvatarUpload();

  return <Button onClick={handleRemoveFile} {...props} />;
}
