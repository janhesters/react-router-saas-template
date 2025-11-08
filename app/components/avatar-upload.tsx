import type { Avatar as AvatarPrimitive } from "radix-ui";
import type {
  ChangeEvent,
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { AvatarImage } from "./ui/avatar";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const index = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** index).toFixed(dm))} ${sizes[index] ?? "Bytes"}`;
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
  // @ts-expect-error - avatarUpload keyPrefix doesn't exist yet in translations
  const { t } = useTranslation("translation", { keyPrefix: "avatarUpload" });
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [inputKey, setInputKey] = useState(Date.now());
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const currentFile = event.target.files?.[0];
      if (currentFile) {
        if (typeof maxFileSize === "number" && currentFile.size > maxFileSize) {
          setError(
            // @ts-expect-error - fileSizeError translation key doesn't exist yet
            t("fileSizeError", {
              fileName: currentFile.name,
              maxSize: formatBytes(maxFileSize),
            }),
          );
          // Clear the invalid file from the input.
          event.target.value = "";
          return;
        }

        setError("");
        const url = URL.createObjectURL(currentFile);
        setPreviewUrl(url);
        setFile(currentFile);
      } else {
        setPreviewUrl("");
        setFile(undefined);
      }
    },
    [maxFileSize, t],
  );

  const handleRemoveFile = useCallback(() => {
    setError("");
    setFile(undefined);
    setPreviewUrl("");
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
      value={{
        file,
        handleFileChange,
        handleRemoveFile,
        inputKey,
        previewUrl,
      }}
    >
      {typeof children === "function" ? children({ error }) : children}
    </AvatarUploadContext.Provider>
  );
}

function useAvatarUpload() {
  return useContext(AvatarUploadContext);
}

export function AvatarUploadPreviewImage({
  src,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
  const { previewUrl } = useAvatarUpload();

  return <AvatarImage src={previewUrl} {...props} />;
}

export function AvatarUploadInput({
  onChange,
  ...props
}: ComponentProps<"input">) {
  const { handleFileChange, inputKey } = useAvatarUpload();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleFileChange(event);
    onChange?.(event);
  }

  return (
    <Input key={inputKey} type="file" {...props} onChange={handleChange} />
  );
}

export function AvatarUploadDescription({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p className={cn("text-muted-foreground text-xs", className)} {...props} />
  );
}
