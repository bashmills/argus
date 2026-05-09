import { useBackendEvents } from "./hooks/use-backend-handlers";
import { ProcessingView } from "./components/views/processing-view";
import { ProcessedView } from "./components/views/processed-view";
import { SettingsView } from "./components/views/settings-view";
import { WaitingView } from "./components/views/waiting-view";
import { SavingView } from "./components/views/saving-view";
import { useAppStore } from "./store/app-store";
import { Toaster } from "sonner";

export function App() {
  const appStatus = useAppStore((x) => x.appStatus);

  useBackendEvents();

  return (
    <div className="relative w-full h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col justify-center items-center p-4">
      <Toaster position="top-center" theme="dark" closeButton richColors />
      {appStatus === "waiting" && <SettingsView />}
      <div className="w-full flex flex-col justify-center items-center max-h-full max-w-5xl backdrop-blur-sm rounded-2xl shadow-2xl space-y-8 p-8 border border-gray-700/50 bg-gray-800/80">
        {appStatus === "processing" && <ProcessingView />}
        {appStatus === "processed" && <ProcessedView />}
        {appStatus === "waiting" && <WaitingView />}
        {appStatus === "saving" && <SavingView />}
      </div>
    </div>
  );
}
