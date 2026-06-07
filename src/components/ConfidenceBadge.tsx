import { Confidence } from "../types";

export function ConfidenceBadge({ confidence }: { confidence: Confidence | string }) {
  return <span className={`badge badge-${confidence}`}>{confidence}</span>;
}
