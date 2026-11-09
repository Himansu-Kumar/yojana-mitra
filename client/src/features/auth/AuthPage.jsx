import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { Button, Card, ErrorNote, Field, Input } from "../../shared/ui/index.jsx";
import { useDocumentTitle } from "../../shared/lib/useDocumentTitle.js";

const DEMO_ACCOUNTS = [
  { email: "sunita@demo.yojanamitra.in", who: "Sunita, 34, farm labourer in Odisha, expecting a baby" },
  { email: "ravi@demo.yojanamitra.in", who: "Ravi, 19, SC student in Bihar, income just over a limit" },
  { email: "ramesh@demo.yojanamitra.in", who: "Ramesh, 38, small farmer in Gujarat" },
  { email: "official@demo.yojanamitra.in", who: "Official (demo) · District Officer, Khordha" },
  { email: "ngo@demo.yojanamitra.in", who: "CSC worker (demo) · CSC Worker, Khordha" },
];

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  useDocumentTitle(isLogin ? "Sign in" : "Create account");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e, override) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = override || form;
      if (isLogin) await login(data.email, data.password);
      else await register(data);
      navigate(location.state?.from || (isLogin ? "/benefits" : "/profile"), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{isLogin ? "Sign in to Yojana Mitra" : "Create your Yojana Mitra account"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isLogin ? "Welcome back." : "It takes a minute. Then we'll check which schemes you qualify for."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin && (
            <Field label="Your name">
              <Input value={form.name} onChange={set("name")} required autoComplete="name" />
            </Field>
          )}
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
          </Field>
          <Field label="Password" hint={isLogin ? null : "At least 8 characters"}>
            <Input
              type="password"
              value={form.password}
              onChange={set("password")}
              required
              minLength={isLogin ? 1 : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </Field>
          <ErrorNote error={error} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"} className="font-semibold text-brand-700 hover:underline">
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </Card>

      {isLogin && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Demo accounts</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                disabled={busy}
                onClick={() => submit(null, { email: d.email, password: "demo1234" })}
                className="block w-full rounded-lg border border-line bg-white px-4 py-3 text-left text-sm hover:border-brand-600"
              >
                <span className="font-medium">{d.who}</span>
                <span className="block text-xs text-muted">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
