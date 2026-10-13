import { ShieldCheck } from "lucide-react";
import type { Persona } from "./api";
type Props = {
  persona: Persona;
  setPersona: (p: Persona) => void;
  signIn: () => void;
  busy: boolean;
  error: string;
  health: string;
};
export default function LoginScreen({
  persona,
  setPersona,
  signIn,
  busy,
  error,
  health,
}: Props) {
  return (
    <main className="login-shell">
      <div className="brand">
        <ShieldCheck size={32} />
        <strong>AEGIS</strong>
      </div>
      <div className="login-composition">
        <div>
          <p className="eyebrow">IDENTITY & OWNERSHIP</p>
          <h1>
            Trust has
            <br />a trace.
          </h1>
          <p className="intro">
            One workspace for organizational identity, controlled access and the
            history behind every asset.
          </p>
          <div className="login-line">
            Private by design. Accountable at every step.
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn();
          }}
          className="login-form"
        >
          <span className="mode-label">SIMULATED ENVIRONMENT</span>
          <h2>Enter the workspace</h2>
          <p>
            Choose a seeded demo identity. No real organization or Fabric
            credentials are used.
          </p>
          <label htmlFor="persona">Demo identity</label>
          <select
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
          >
            <option value="admin">Org 1 · Administrator</option>
            <option value="manager">Org 1 · Manager</option>
            <option value="auditor">Org 1 · Auditor</option>
            <option value="user">Org 1 · Asset owner</option>
            <option value="recipient">Org 1 · Recipient</option>
            <option value="org2admin">Org 2 · Administrator</option>
          </select>
          <button className="primary" disabled={busy}>
            {busy ? "Connecting…" : "Open workspace"}
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <small>{health}</small>
        </form>
      </div>
    </main>
  );
}
