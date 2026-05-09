import { DialogContainer } from "../ui/dialog-container";
import { DialogContents } from "../ui/dialog-contents";
import { useHandlers } from "../../hooks/use-handlers";
import { useAppStore } from "../../store/app-store";
import { IconButton } from "../ui/icon-button";
import { TextField } from "../ui/text-field";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
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
        {filtered.length !== 0 &&
          filtered.map((item, index) => {
            const textures = item.visuals.map((x) => x.textures).flat();
            const isSelected = selected.has(item.id);
            return (
              <button
                className={`w-full flex items-center rounded-xl border text-left transition-all duration-150 gap-x-3 p-4 cursor-pointer ${isSelected ? "bg-green-700/10 border-green-600/30 hover:bg-green-600/20" : "bg-gray-700/10 border-gray-600/30 hover:bg-gray-600/20"}`}
                onClick={() => onToggle(item.id)}
                key={item.id ?? index}
                type="button"
              >
                <div className={`size-8 rounded-full border flex justify-center items-center transition-all ${isSelected ? "bg-green-700/10 border-green-600/30" : "bg-gray-700/10 border-gray-600/30"}`}>
                  <Icon className={`size-6 text-white transition-all duration-150 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-0"}`} icon="check" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.visuals.map((x) => x.source.name).join(", ")}</p>
                  <p className="text-gray-400 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate">{textures.length} textures</p>
                  {item.slots && <p className="text-xs text-gray-500 truncate">{item.slots.join(", ")}</p>}
                  {item.races && <p className="text-xs text-gray-500 truncate">{item.races.join(", ")}</p>}
                </div>
              </button>
            );
          })}
        {filtered.length === 0 && (
          <div className="flex justify-center items-center min-h-64">
            <Icon className="size-5" icon="search">
              <p className="text-sm text-gray-400 truncate">No matching assets</p>
            </Icon>
          </div>
        )}
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
