import { Item } from "../../../shared/types";
import { ItemRow } from "./item-row";
import { Icon } from "../ui/icon";

interface Props {
  onToggle: (id: string) => void;
  selected: Set<string>;
  items: Item[];
}

export function ItemList({ onToggle, selected, items }: Props) {
  return (
    <>
      {items.length !== 0 && items.map((item, index) => <ItemRow onToggle={onToggle} selected={selected} item={item} key={item.id ?? index} />)}
      {items.length === 0 && (
        <div className="flex justify-center items-center min-h-64">
          <Icon className="size-5" icon="search">
            <p className="text-sm text-gray-400 truncate">No matching assets</p>
          </Icon>
        </div>
      )}
    </>
  );
}
