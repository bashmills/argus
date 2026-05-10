import { Progress } from "../progress/progress";

export function ProcessingView() {
  return (
    <Progress title="Processing Package" icon="process">
      <p>Extracting, converting, importing, indexing and merging assets from the selected package</p>
      <p>This may take a while depending on package size</p>
    </Progress>
  );
}
