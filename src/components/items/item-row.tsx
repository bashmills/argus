import { Item } from "../../../shared/types";
import { Icon } from "../ui/icon";

interface Props {
  onToggle: (id: string) => void;
  selected: Set<string>;
  item: Item;
}

export function ItemRow({ onToggle, selected, item }: Props) {
  const materials = item.visuals.map((x) => x.materials).flat();
  const virtualTextures = materials.map((x) => x.virtualTextures).flat();
  const textures = materials.map((x) => x.textures).flat();
  const isSelected = selected.has(item.id);

  return (
    <button className={`w-full flex items-center rounded-xl border text-left transition-all duration-150 gap-x-3 p-4 cursor-pointer ${isSelected ? "bg-green-700/10 border-green-600/30 hover:bg-green-600/20" : "bg-gray-700/10 border-gray-600/30 hover:bg-gray-600/20"}`} onClick={() => onToggle(item.id)} type="button">
      <div className={`size-8 rounded-full border flex justify-center items-center transition-all ${isSelected ? "bg-green-700/10 border-green-600/30" : "bg-gray-700/10 border-gray-600/30"}`}>
        <Icon className={`size-6 text-white transition-all duration-150 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-0"}`} icon="check" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{item.name}</p>
        <p className="text-gray-400 truncate">{item.visuals.map((x) => x.source.name).join(", ")}</p>
        <p className="text-xs text-gray-500 truncate">
          {materials.length} materials • {virtualTextures.length} virtual textures • {textures.length} textures
        </p>
        {item.races && <p className="text-xs text-gray-500 truncate">{item.races.join(", ")}</p>}
        {item.slots && <p className="text-xs text-gray-500 truncate">{item.slots.join(", ")}</p>}
      </div>
    </button>
  );
}
