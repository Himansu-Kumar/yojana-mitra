// Small shared UI pieces. Feature-specific components live in their feature folder.
import { Link } from "react-router-dom";

const cx = (...c) => c.filter(Boolean).join(" ");

export function Button({ variant = "primary", className, as: As = "button", ...props }) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/50",
    secondary: "bg-white text-ink border border-line hover:bg-stone-50 disabled:opacity-50",
    ghost: "text-brand-700 hover:bg-brand-50",
  };
  return (
    <As
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export const ButtonLink = ({ to, ...props }) => <Button as={Link} to={to} {...props} />;

export function Card({ className, ...props }) {
  return <div className={cx("rounded-xl border border-line bg-white", className)} {...props} />;
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand-600" />
      {label}…
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800" role="alert">
      {error.message || String(error)}
    </p>
  );
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:border-brand-600 focus:outline-none";

export const Input = ({ className, ...p }) => <input className={cx(inputCls, className)} {...p} />;

export function Select({ options, placeholder = "Select", className, ...p }) {
  return (
    <select className={cx(inputCls, className)} {...p}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function PageHeader({ title, children }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {children && <p className="mt-1 max-w-2xl text-muted">{children}</p>}
    </div>
  );
}
