import { Settings, Lslib } from "../../../shared/types";
import { DialogContainer } from "../ui/dialog-container";
import { DialogContents } from "../ui/dialog-contents";
import { useHandlers } from "../../hooks/use-handlers";
import { SettingsButton } from "./settings-button";
import { TextField } from "../ui/text-field";
import { useEffect, useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: Props) {
  const { handleBrowseLslibPath, handleSaveSettings, handleClearCache } = useHandlers();
  const [workers, setWorkers] = useState<string[]>([]);
  const [version, setVersion] = useState<string>();
  const [lslib, setLslib] = useState<Lslib>();
  const [visible, setVisible] = useState(false);

  const lslibPath = lslib?.filepath ?? "";
  const lslibError = lslib?.error ?? "";

  const onValidateLslibPath = async (value: string) => {
    const result = await window.backend?.validateLslibPath(value);
    if (result === null) {
      return;
    }

    setLslib(result);
  };

  const onBrowseLslibPath = async () => {
    const result = await handleBrowseLslibPath();
    if (result === null) {
      return;
    }

    setLslib(result);
  };

  const onSave = async () => {
    if (!lslib) {
      toast.error("Please wait for settings to load before saving...");
      return;
    }

    await handleSaveSettings({ lslib });
  };

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const value: Settings = await window.backend.getSettings();
      if (mounted) {
        setLslib(value.lslib);
      }
    }

    async function loadVersion() {
      const value = await window.backend.getVersion();
      if (mounted) {
        setVersion(value);
      }
    }

    loadSettings();
    loadVersion();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Dialog onSetVisible={setVisible} onClose={onClose} visible={visible} title="Settings">
      <DialogContainer>
        <DialogContents>
          <div className="w-full flex flex-col justify-center items-center space-y-6">
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">External Tools</h3>
              </div>
              <TextField onChange={onValidateLslibPath} placeholder="Divine.exe" error={lslibError} value={lslibPath} label="lslib">
                Lslib (Divine.exe)
              </TextField>
              <Button onClick={onBrowseLslibPath} variant="primary" size="medium" type="button">
                Browse Lslib
              </Button>
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Cache</h3>
              </div>
              <SettingsButton onCallback={() => handleClearCache()} setWorkers={setWorkers} workers={workers} variant="danger" worker={"cache"}>
                Clear Cache
              </SettingsButton>
            </div>
          </div>
        </DialogContents>
        <div className="relative w-full flex flex-col justify-center items-center">
          <SettingsButton onCallback={onSave} setWorkers={setWorkers} workers={workers} variant="success" worker={"save"}>
            Save
          </SettingsButton>
          {version && <p className="absolute bottom-0 translate-y-5 text-xs text-gray-500 truncate">{version}</p>}
        </div>
      </DialogContainer>
    </Dialog>
  );
}
