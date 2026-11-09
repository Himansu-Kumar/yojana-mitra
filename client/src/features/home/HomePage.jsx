import { useAuth } from "../auth/AuthContext.jsx";
import { ButtonLink } from "../../shared/ui/index.jsx";
import { useDocumentTitle } from "../../shared/lib/useDocumentTitle.js";

const STEPS = [
  ["Tell us about yourself", "A few questions, or scan your Aadhaar or income certificate to fill them in."],
  ["See what you qualify for", "We check every scheme's conditions and add up what you could be receiving."],
  ["Know exactly why", "Every result shows its reasons, including the ones you only just miss."],
];

export default function HomePage() {
  useDocumentTitle("Home");
  const { user } = useAuth();

  return (
    <div>
      <section className="py-10 sm:py-16">
        <p className="text-sm font-semibold text-brand-700">योजना मित्र</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Find the government schemes you're entitled to.
        </h1>
        <p className="mt-2 text-base font-medium text-brand-700">
          Every citizen. Every scheme. In their own language.
        </p>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Most families miss benefits because the rules are hard to read. Yojana Mitra checks them for you and tells you why
          you qualify, or what's stopping you.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <ButtonLink to="/benefits">See my benefits</ButtonLink>
          ) : (
            <ButtonLink to="/register">Check what I qualify for</ButtonLink>
          )}
          <ButtonLink to="/schemes" variant="secondary">
            Browse schemes
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-6 border-t border-line pt-10 sm:grid-cols-3">
        {STEPS.map(([title, text], i) => (
          <div key={title}>
            <p className="text-sm font-bold text-brand-700">{i + 1}</p>
            <h2 className="mt-1 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
