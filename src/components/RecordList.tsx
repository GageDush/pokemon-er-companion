import { ConfidenceBadge } from "./ConfidenceBadge";

export interface ListRecord {
  id: string;
  title: string;
  subtitle?: string;
  confidence?: string;
  meta?: string;
}

export function RecordList({ records, emptyText }: { records: ListRecord[]; emptyText: string }) {
  if (records.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <div className="record-list">
      {records.map((record) => (
        <article className="record-row" key={record.id}>
          <div>
            <h3>{record.title}</h3>
            {record.subtitle ? <p>{record.subtitle}</p> : null}
            {record.meta ? <small>{record.meta}</small> : null}
          </div>
          {record.confidence ? <ConfidenceBadge confidence={record.confidence} /> : null}
        </article>
      ))}
    </div>
  );
}
