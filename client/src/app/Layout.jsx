import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.jsx";

const NAV = [
  { to: "/benefits", label: "My benefits", auth: true },
  { to: "/schemes", label: "All schemes" },
  { to: "/assistant", label: "Ask Mitra", auth: true },
  { to: "/profile", label: "Profile", auth: true },
  { to: "/admin/schemes", label: "Admin", auth: true, roles: ["official"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => (!n.auth || user) && (!n.roles || n.roles.includes(user?.role)));

  const linkCls = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-stone-100"}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-sm text-white">य</span>
            Yojana Mitra
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls}>
                {n.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={logout} className="ml-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-stone-100">
                Sign out
              </button>
            ) : (
              <NavLink to="/login" className={linkCls}>
                Sign in
              </NavLink>
            )}
          </nav>

          <button
            className="rounded-md p-2 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="mt-1 block h-0.5 w-5 bg-ink" />
            <span className="mt-1 block h-0.5 w-5 bg-ink" />
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-line px-4 py-2 md:hidden" onClick={() => setOpen(false)}>
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls}>
                {n.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={logout} className="rounded-md px-3 py-2 text-left text-sm text-muted">
                Sign out
              </button>
            ) : (
              <NavLink to="/login" className={linkCls}>
                Sign in
              </NavLink>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Yojana Mitra is not a government website. Always apply on the official portal linked on each scheme.
      </footer>
    </div>
  );
}
