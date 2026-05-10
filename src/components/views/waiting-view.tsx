import { useHandlers } from "../../hooks/use-handlers";
import { DropZone } from "../ui/drop-zone";

export function WaitingView() {
  const { handleProcessPak, handleBrowsePak } = useHandlers();

  const onBrowse = async () => {
    const filepath = await handleBrowsePak();
    if (!filepath) {
      return;
    }

    handleProcessPak(filepath);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <DropZone onDropped={handleProcessPak} onBrowse={onBrowse} icon="package" type="package" ext=".pak" />
    </div>
  );
}
