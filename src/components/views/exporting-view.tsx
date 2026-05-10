import { Progress } from "../progress/progress";

export function ExportingView() {
  return (
    <Progress title="Exporting Assets" icon="export">
      <p>Saving all selected assets to the path chosen</p>
      <p>This may take a while depending on the number of assets</p>
    </Progress>
  );
}
