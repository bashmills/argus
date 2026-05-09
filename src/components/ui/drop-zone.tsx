import { useState } from "react";
import { Icon } from "./icon";

export interface Props {
  onDropped: (file: File) => void;
  onBrowse: () => void;
}

export function DropZone({ onDropped, onBrowse }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    onDropped(file);
  };

  const onDrag = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  return (
    <div className="size-full flex flex-col items-center space-y-6">
      <button
        className={`w-full min-h-96 rounded-xl border-2 border-dashed flex flex-col justify-center items-center text-center space-y-6 p-6 transition-all duration-200 cursor-pointer ${isDragging ? "border-blue-600 bg-blue-500/10 hover:border-blue-400" : "border-gray-600 bg-gray-500/10 hover:border-gray-400"}`}
        onClick={onBrowse}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={onDrag}
        onDrop={onDrop}
        type="button"
      >
        <Icon className="size-32" icon="upload" />
        <div className="w-full flex flex-col justify-center items-center space-y-3">
          <p className="text-sm text-gray-400 font-medium">
            Drag and drop a package (<span className="text-white">.pak</span>) file here
          </p>
          <p className="text-xs text-gray-500">
            Or click to <span className="text-white">browse</span> your files
          </p>
        </div>
      </button>
    </div>
  );
}
