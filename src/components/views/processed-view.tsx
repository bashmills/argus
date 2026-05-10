import { DialogContainer } from "../ui/dialog-container";
import { DialogContents } from "../ui/dialog-contents";
import { useHandlers } from "../../hooks/use-handlers";
import { useAppStore } from "../../store/app-store";
import { IconButton } from "../ui/icon-button";
import { ItemList } from "../items/item-list";
import { TextField } from "../ui/text-field";
import { Button } from "../ui/button";
import { useState } from "react";

export function ProcessedView() {
  const { handleExportAssets, handleReset } = useHandlers();
  const [selected, setSelected] = useState(new Set<string>());
  const [filter, setFilter] = useState("");
  const items = useAppStore((x) => x.items);

  const onExport = async () => {
    const assets = items.filter((x) => selected.has(x.id));
    if (assets.length === 0) {
      return;
    }

    await handleExportAssets(assets);
  };

  const onToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const value = filter.toLowerCase().trim();
  const filtered = value
    ? items.filter((x) => {
        const name = x.name.toLowerCase().trim();
        return name.includes(value);
      })
    : items;

  return (
    <DialogContainer>
      <div className="w-full flex flex-col justify-center items-center space-y-6">
        <div className="w-full flex justify-between items-start">
          <IconButton onClick={handleReset} icon="back" />
          <div className="w-full flex flex-col justify-center items-center space-y-3">
            <h2 className="text-2xl font-semibold text-white">Indexed Assets</h2>
            <p className="text-sm text-gray-400">Browse, filter and select indexed assets for saving</p>
          </div>
          <IconButton onClick={handleReset} icon="close" />
        </div>
        <div className="w-4/5">
          <TextField onChange={setFilter} placeholder="Filter" value={filter} label="filter" hidden>
            Filter
          </TextField>
        </div>
      </div>
      <DialogContents>
        <ItemList onToggle={onToggle} selected={selected} items={items} />
      </DialogContents>
      <div className="w-full flex flex-col justify-center items-center space-y-3">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-400">{filtered.length}</span> of <span className="font-medium text-gray-400">{items.length}</span> assets
        </p>
        <Button onClick={onExport} disabled={selected.size === 0} variant="primary" size="medium" type="button">
          Export
        </Button>
        <p className="text-xs text-gray-500">
          Selected <span className="font-medium text-gray-400">{selected.size}</span> assets
        </p>
      </div>
    </DialogContainer>
  );
}
