import { HealthPanel, AuditPanel, VerificationPanel } from "./Panels";
import LoginScreen from "./LoginScreen";
import Workflow from "./Workflow";
import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Fingerprint,
  Layers,
  GitBranch,
  ScanLine,
  ScrollText,
  Activity,
  FlaskConical,
  LogOut,
} from "lucide-react";
import {
  command,
  login,
  logout,
  request,
  type AuditEvent,
  type Me,
  type Persona,
  type RecordItem,
} from "./api";
import { Registry, Surface, Timeline } from "./components";
import DemoCenter from "./DemoCenter";
type Page =
  | "Identities"
  | "Credentials"
  | "Assets"
  | "Provenance"
  | "Verification"
  | "Audit"
  | "Health"
  | "Jury Demo";
const nav: { name: Page; icon: typeof Fingerprint }[] = [
  { name: "Identities", icon: Fingerprint },
  { name: "Credentials", icon: ShieldCheck },
  { name: "Assets", icon: Layers },
  { name: "Provenance", icon: GitBranch },
  { name: "Verification", icon: ScanLine },
  { name: "Audit", icon: ScrollText },
  { name: "Health", icon: Activity },
  { name: "Jury Demo", icon: FlaskConical },
];
export default function App() {
  const [me, setMe] = useState<Me | null>(null),
    [persona, setPersona] = useState<Persona>("admin"),
    [page, setPage] = useState<Page>("Assets"),
    [identities, setIdentities] = useState<RecordItem[]>([]),
    [credentials, setCredentials] = useState<RecordItem[]>([]),
    [assets, setAssets] = useState<RecordItem[]>([]),
    [events, setEvents] = useState<AuditEvent[]>([]),
    [selected, setSelected] = useState<RecordItem | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [subject, setSubject] = useState(""),
    [owner, setOwner] = useState("did:aegis:user"),
    [hash, setHash] = useState("a".repeat(64)),
    [action, setAction] = useState("asset.mint"),
    [health, setHealth] = useState("Checking");
  const refresh = useCallback(async () => {
    const user = await request<Me>("/api/me");
    setMe(user);
    if (user.roles.includes("User")) setAction("asset.transfer.request");
    const [i, c, a] = await Promise.all([
      request<RecordItem[]>("/api/records/identity"),
      request<RecordItem[]>("/api/records/credential"),
      request<RecordItem[]>("/api/records/asset"),
    ]);
    setIdentities(i);
    setCredentials(c);
    setAssets(a);
    setSelected((old) => (old ? a.find((x) => x.id === old.id) || null : null));
    if (user.roles.some((r) => r === "Admin" || r === "Auditor"))
      setEvents(await request<AuditEvent[]>("/api/audit"));
    else setEvents([]);
  }, []);
  useEffect(() => {
    request<{ mode: string }>("/health/live")
      .then((r) =>
        setHealth(
          r.mode === "demo"
            ? "Demo API available"
            : "Production adapters pending",
        ),
      )
      .catch(() => setHealth("API unavailable"));
  }, []);
  useEffect(() => {
    if (!me) return;
    const timer = setInterval(
      () => refresh().catch((e) => setError(String(e))),
      4000,
    );
    return () => clearInterval(timer);
  }, [me?.id, refresh]);
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      await login(persona);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const extra: Record<string, string> = {};
      if (action === "asset.mint" || action === "credential.issue")
        extra.metadata_hash = hash;
      if (
        ["asset.assign", "asset.transfer.request", "credential.issue"].includes(
          action,
        )
      )
        extra.owner = owner;
      await command(action, subject, extra);
      await refresh();
      setMessage("Operation completed. Simulation audit updated.");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ valid: boolean; matches: boolean }>(
        `/api/assets/${encodeURIComponent(subject)}/verify`,
        { method: "POST", body: JSON.stringify({ metadata_hash: hash }) },
      );
      setMessage(
        result.valid
          ? "Commitment matches; asset and owner are active (simulation)."
          : `Verification failed. Hash match: ${result.matches}. Check asset and identity status.`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const admin = me?.roles.includes("Admin"),
    manager = admin || me?.roles.includes("Manager"),
    auditor = admin || me?.roles.includes("Auditor");
  if (!me)
    return (
      <LoginScreen
        persona={persona}
        setPersona={setPersona}
        signIn={signIn}
        busy={busy}
        error={error}
        health={health}
      />
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={28} />
          <strong>AEGIS</strong>
        </div>
        <p className="organization">
          {me.org}
          <span>Identity & ownership</span>
        </p>
        <nav aria-label="Workspace">
          {nav
            .filter(
              (n) =>
                !(["Audit"].includes(n.name) && !auditor) &&
                !(n.name === "Jury Demo" && !admin),
            )
            .map(({ name, icon: Icon }) => (
              <button
                key={name}
                aria-current={page === name ? "page" : undefined}
                className={page === name ? "active" : ""}
                onClick={() => {
                  setPage(name);
                  setError("");
                  setMessage("");
                }}
              >
                <Icon size={19} />
                {name}
              </button>
            ))}
        </nav>
        <div className="sidebar-footer">
          <span>{me.id.split(":").at(-1)}</span>
          <small>{me.roles.join(", ")}</small>
          <button
            onClick={() => {
              logout();
              setMe(null);
              setEvents([]);
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <span>Organization workspace</span>
          <span className="mode-label">SIMULATED · NO LIVE FABRIC</span>
        </header>
        <div className="page-head">
          <div>
            <p className="eyebrow">CONTROLLED TRUST</p>
            <h1>
              {page === "Assets"
                ? "Digital assets"
                : page === "Identities"
                  ? "Identity directory"
                  : page}
            </h1>
          </div>
          <p>
            {page === "Assets"
              ? "Ownership is precise. Every change leaves a trace."
              : page === "Jury Demo"
                ? "Repeatable scenarios through the application API."
                : "Organization-scoped records and activity."}
          </p>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
            <button
              onClick={() => {
                setError("");
                refresh().catch((e) => setError(String(e)));
              }}
            >
              Retry
            </button>
          </div>
        )}
        {message && (
          <div className="success" role="status">
            {message}
          </div>
        )}
        {page === "Jury Demo" ? (
          <DemoCenter refresh={refresh} onMessage={setMessage} />
        ) : page === "Health" ? (
          <HealthPanel
            health={health}
            setMessage={setMessage}
            setError={setError}
          />
        ) : page === "Audit" ? (
          <AuditPanel events={events} />
        ) : page === "Verification" ? (
          <VerificationPanel
            subject={subject}
            setSubject={setSubject}
            hash={hash}
            setHash={setHash}
            busy={busy}
            verify={verify}
          />
        ) : (
          <div className="work-grid">
            <Surface
              title={
                page === "Identities"
                  ? "Organization identities"
                  : page === "Credentials"
                    ? "Issued commitments"
                    : "Asset registry"
              }
              aside={
                <span>
                  {
                    (page === "Identities"
                      ? identities
                      : page === "Credentials"
                        ? credentials
                        : assets
                    ).length
                  }{" "}
                  records
                </span>
              }
            >
              <Registry
                items={
                  page === "Identities"
                    ? identities
                    : page === "Credentials"
                      ? credentials
                      : assets
                }
                onSelect={(item) => {
                  setSelected(item);
                  setSubject(item.id);
                }}
                selected={selected?.id}
              />
            </Surface>
            <Surface
              title={page === "Provenance" ? "Ownership timeline" : "Workflow"}
            >
              {page === "Provenance" ? (
                <Timeline item={selected} />
              ) : (
                <Workflow
                  admin={!!admin}
                  manager={!!manager}
                  user={me.roles.includes("User")}
                  action={action}
                  setAction={setAction}
                  subject={subject}
                  setSubject={setSubject}
                  owner={owner}
                  setOwner={setOwner}
                  hash={hash}
                  setHash={setHash}
                  busy={busy}
                  submit={submit}
                />
              )}
            </Surface>
          </div>
        )}
        <footer className="workspace-footer">
          <span>Private organization boundary</span>
          <span>Demo records only · No cryptographic identity binding</span>
        </footer>
      </main>
    </div>
  );
}
