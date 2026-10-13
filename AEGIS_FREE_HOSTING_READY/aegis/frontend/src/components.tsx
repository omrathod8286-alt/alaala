import type { ReactNode } from "react";
import type { RecordItem } from "./api";
export function Surface({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="surface">
      <header className="section-head">
        <h2>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
export function Registry({
  items,
  onSelect,
  selected,
}: {
  items: RecordItem[];
  onSelect: (item: RecordItem) => void;
  selected?: string;
}) {
  return items.length ? (
    <div className="registry" role="list">
      {items.map((item) => (
        <button
          className={`registry-row ${selected === item.id ? "selected" : ""}`}
          key={item.id}
          onClick={() => onSelect(item)}
          role="listitem"
        >
          <span className="record-monogram">
            {item.id.split(":").at(-1)?.slice(0, 2).toUpperCase()}
          </span>
          <span className="record-main">
            <strong>{item.id}</strong>
            <small>
              {item.body.owner ||
                item.body.roles?.join(", ") ||
                item.body.issuer ||
                item.org}
            </small>
          </span>
          <span className={`status ${item.body.status}`}>
            {item.body.status}
          </span>
        </button>
      ))}
    </div>
  ) : (
    <p className="empty">
      No records yet. Start a workflow or run a jury scenario.
    </p>
  );
}
export function Timeline({ item }: { item: RecordItem | null }) {
  return item ? (
    <>
      <dl className="details">
        <div>
          <dt>Asset</dt>
          <dd>{item.id}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{item.body.owner || "Unassigned"}</dd>
        </div>
        <div>
          <dt>Metadata SHA-256</dt>
          <dd className="hash">{item.body.metadata_hash}</dd>
        </div>
      </dl>
      <ol className="timeline">
        {item.body.history?.map((entry, index) => (
          <li key={index}>
            <span className="timeline-point" />
            <div>
              <strong>
                {entry.action.replace("asset.", "").replaceAll(".", " ")}
              </strong>
              <p>{entry.actor}</p>
              <small>
                {entry.owner || "Unassigned"} ·{" "}
                {new Date(entry.time).toLocaleTimeString()}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </>
  ) : (
    <p className="empty">Select an asset to inspect its ownership history.</p>
  );
}
