import { useAppStore } from "../store/app-store";
import log from "electron-log/renderer";
import { useEffect } from "react";
import { toast } from "sonner";

export function useBackendEvents() {
  const { setProgress } = useAppStore.getState();

  useEffect(() => {
    const handleAppProgress = (message: string) => {
      log.info(`Handling pak progress: ${message}`);
      setProgress(message);
    };

    const handleShowError = (error: Error) => {
      log.info(`Handling show error: ${error}`);
      toast.error(error.message);
    };

    const offAppProgress = window.backend?.onAppProgress(handleAppProgress);
    const offShowError = window.backend?.onShowError(handleShowError);

    return () => {
      offAppProgress?.();
      offShowError?.();
    };
  }, [setProgress]);
}
