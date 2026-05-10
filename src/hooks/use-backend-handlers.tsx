import { useAppStore } from "../store/app-store";
import { AppProgress } from "../../shared/types";
import log from "electron-log/renderer";
import { useEffect } from "react";
import { toast } from "sonner";

export function useBackendEvents() {
  const { setAppProgress } = useAppStore.getState();

  useEffect(() => {
    const handleAppProgress = (appProgress: AppProgress) => {
      if (appProgress.message) {
        log.info(`Handling pak progress: ${appProgress.message}`);
      }

      setAppProgress(appProgress);
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
  }, [setAppProgress]);
}
