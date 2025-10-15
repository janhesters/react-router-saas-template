import { TriangleAlert, User, X } from 'lucide-react';

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '~/components/ui/alert-re';
import { Button } from '~/components/ui/button';
import {
  type FileWithPreview,
  formatBytes,
  useFileUpload,
} from '~/hooks/use-file-upload';
import { cn } from '~/lib/utils';

type AvatarUploadProps = {
  maxSize?: number;
  className?: string;
  onFileChange?: (file: FileWithPreview | null) => void;
  defaultAvatar?: string;
};

export default function AvatarUpload({
  maxSize = 2 * 1024 * 1024, // 2MB
  className,
  onFileChange,
  defaultAvatar,
}: AvatarUploadProps) {
  const [
    { files, isDragging, errors },
    {
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept: 'image/*',
    multiple: false,
    onFilesChange: files => {
      // eslint-disable-next-line unicorn/no-null
      onFileChange?.(files[0] ?? null);
    },
  });

  const currentFile = files[0];
  const previewUrl = currentFile?.preview ?? defaultAvatar;

  const handleRemove = () => {
    if (currentFile) {
      removeFile(currentFile.id);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className="relative shrink-0">
          <div
            className={cn(
              'group/avatar relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-dashed transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/20',
              previewUrl && 'border-solid',
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input {...getInputProps()} className="sr-only" />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="text-muted-foreground size-6" />
              </div>
            )}
          </div>

          {/* Remove Button - only show when file is uploaded */}
          {currentFile && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleRemove}
              className="absolute end-0 top-0 size-6 rounded-full"
              aria-label="Remove avatar"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Upload Instructions */}
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {currentFile ? 'Avatar uploaded' : 'Upload avatar'}
          </p>

          <p className="text-muted-foreground text-xs">
            PNG, JPG up to {formatBytes(maxSize)}
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>File upload error(s)</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index} className="last:mb-0">
                  {error}
                </p>
              ))}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
