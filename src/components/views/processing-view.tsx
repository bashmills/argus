import { useAppStore } from "../../store/app-store";
import { Spinner } from "../ui/spinner";
import { Icon } from "../ui/icon";

export function ProcessingView() {
  const progress = useAppStore((x) => x.progress);

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="w-full min-h-96 rounded-xl border-2 flex flex-col justify-center items-center text-center border-gray-600 bg-gray-500/10 space-y-6 p-6">
        <Icon className="size-32" icon="package" />
        <div className="w-full flex flex-col justify-center items-center space-y-3">
          <h2 className="text-2xl font-semibold text-white">Processing Package</h2>
          <p className="text-sm text-gray-400">Extracting, converting and indexing assets from the selected package. This may take a while depending on package size.</p>
        </div>
        <div className="w-4/5 flex justify-center items-center rounded-xl border border-gray-700 bg-gray-900/50 px-6 py-4">
          <Spinner className="size-5 text-blue-500">
            <p className="text-gray-400 truncate">{progress}</p>
          </Spinner>
        </div>
        <div className="w-1/2 h-2 rounded-full bg-gray-800">
          <div className="h-full w-full bg-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
