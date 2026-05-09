import { SettingsDialog } from "../settings/settings-dialog";
import { IconButton } from "../ui/icon-button";
import { useState } from "react";

export function SettingsView() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
      <div className="absolute top-4 right-4 z-20">
        <IconButton onClick={() => setOpen(true)} icon="menu" />
      </div>
    </>
  );
}
