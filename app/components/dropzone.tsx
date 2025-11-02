// Created from: https://supabase.com/ui/docs/react-router/dropzone
/** biome-ignore-all lint/a11y/noStaticElementInteractions: we need to be able to click on the div */
/** biome-ignore-all lint/a11y/useAnchorContent: we need to be able to use the anchor content */
/** biome-ignore-all lint/a11y/useValidAnchor: we need to be able to use the anchor content */
import {
  CheckCircleIcon,
  FileIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import type { UseSupabaseUploadReturn } from "~/hooks/use-supabase-upload";
import { cn } from "~/lib/utils";

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB",
) => {
  const k = 1000;
  const dm = Math.max(decimals, 0);
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  if (bytes === 0 || bytes === undefined)
    return size === undefined ? "0 bytes" : `0 ${size}`;
  const index =
    size === undefined
      ? Math.floor(Math.log(bytes) / Math.log(k))
      : sizes.indexOf(size);
  return `${Number.parseFloat((bytes / k ** index).toFixed(dm))} ${sizes[index]}`;
};

type DropzoneContextType = Omit<
  UseSupabaseUploadReturn,
  "getRootProps" | "getInputProps"
>;

const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined,
);

type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string;
};

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess;
  const isActive = restProps.isDragActive;
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file) => file.errors.length > 0);

  return (
    <DropzoneContext.Provider value={{ ...restProps }}>
      <div
        {...getRootProps({
          className: cn(
            "border border-input rounded-lg p-6 text-center dark:bg-input/30 transition-colors duration-300 text-foreground shadow-xs",
            className,
            isSuccess ? "border-solid" : "border-dashed",
            isActive && "border-primary bg-primary/10 dark:bg-primary/10",
            isInvalid && "border-destructive bg-destructive/10",
          ),
        })}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </DropzoneContext.Provider>
  );
};

const DropzoneContent = ({
  className,
  renderButton = false,
}: {
  className?: string;
  renderButton?: boolean;
}) => {
  const { t } = useTranslation("dropzone");
  const {
    files,
    setFiles,
    onUpload,
    loading,
    successes,
    errors,
    maxFileSize,
    maxFiles,
    isSuccess,
  } = useDropzoneContext();

  const exceedMaxFiles = files.length > maxFiles;

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file) => file.name !== fileName));
    },
    [files, setFiles],
  );

  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex flex-row items-center justify-center gap-x-2",
          className,
        )}
      >
        <CheckCircleIcon className="text-primary" size={16} />
        <p className="text-primary text-sm">
          {t("upload-success.message", { count: files.length })}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {files.map((file, index) => {
        const fileError = errors.find((error) => error.name === file.name);
        const isSuccessfullyUploaded = successes.includes(file.name);

        return (
          <div
            className="flex items-center gap-x-4 border-b py-2 first:mt-4 last:mb-4"
            key={`${file.name}-${index}`}
          >
            {file.type.startsWith("image/") ? (
              <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border">
                <img
                  alt={file.name}
                  className="object-cover"
                  src={file.preview}
                />
              </div>
            ) : (
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded border">
                <FileIcon size={18} />
              </div>
            )}

            <div className="flex shrink grow flex-col items-start truncate">
              <p className="max-w-full truncate text-sm" title={file.name}>
                {file.name}
              </p>
              {file.errors.length > 0 ? (
                <p className="text-destructive text-xs">
                  {file.errors
                    .map((error) =>
                      error.message.startsWith("File is larger than")
                        ? t("file-status.file-too-large", {
                            currentSize: formatBytes(file.size, 2),
                            maxSize: formatBytes(maxFileSize, 2),
                          })
                        : error.message,
                    )
                    .join(", ")}
                </p>
              ) : loading && !isSuccessfullyUploaded ? (
                <p className="text-muted-foreground text-xs">
                  {t("file-status.uploading")}
                </p>
              ) : fileError ? (
                <p className="text-destructive text-xs">
                  {t("file-status.upload-failed", {
                    message: fileError.message,
                  })}
                </p>
              ) : isSuccessfullyUploaded ? (
                <p className="text-primary text-xs">
                  {t("file-status.upload-success")}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {t("file-status.file-size", {
                    size: formatBytes(file.size, 2),
                  })}
                </p>
              )}
            </div>

            {!loading && !isSuccessfullyUploaded && (
              <Button
                aria-label={t("file-status.remove-file")}
                className="text-muted-foreground hover:text-foreground shrink-0 justify-self-end"
                onClick={() => handleRemoveFile(file.name)}
                size="icon"
                type="button"
                variant="link"
              >
                <XIcon />
              </Button>
            )}
          </div>
        );
      })}
      {exceedMaxFiles && (
        <p className="text-destructive mt-2 text-left text-sm">
          {t("max-files-error.message", {
            count: files.length - maxFiles,
            maxFiles,
            overflow: files.length - maxFiles,
          })}
        </p>
      )}
      {renderButton && files.length > 0 && !exceedMaxFiles && (
        <div className="mt-2">
          <Button
            disabled={files.some((file) => file.errors.length > 0) || loading}
            onClick={onUpload}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2Icon className="animate-spin" />
                {t("upload-button.uploading")}
              </>
            ) : (
              t("upload-button.upload")
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { t } = useTranslation("dropzone");
  const { maxFiles, maxFileSize, inputRef, isSuccess } = useDropzoneContext();

  if (isSuccess) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center gap-y-2", className)}>
      <UploadIcon className="text-muted-foreground" size={20} />

      <p className="text-sm">
        {t("empty-state.title", { count: maxFiles || 2 })}
      </p>

      <div className="flex flex-col items-center gap-y-1">
        <p className="text-muted-foreground text-xs">
          <Trans
            components={{
              1: (
                <a
                  className="hover:text-foreground cursor-pointer underline transition"
                  onClick={() => inputRef.current?.click()}
                />
              ),
            }}
            count={maxFiles === 1 ? 1 : 2}
            i18nKey="dropzone:empty-state.drag-drop"
          />
        </p>
        {maxFileSize !== Number.POSITIVE_INFINITY && (
          <p className="text-muted-foreground text-xs">
            {t("empty-state.max-size", {
              size: formatBytes(maxFileSize, 2),
            })}
          </p>
        )}
      </div>
    </div>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext };
