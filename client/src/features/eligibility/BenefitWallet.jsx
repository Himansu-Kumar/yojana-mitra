import { formatINR } from "../../shared/lib/format.js";

export default function BenefitWallet({ wallet, counts }) {
  const e = wallet.eligible;
  const near = wallet.nearMiss;
  const hasCash = e.yearlyCash > 0;

  return (
    <section className="rounded-2xl bg-ink p-6 text-white sm:p-8" aria-label="Benefit wallet">
      <p className="text-sm text-stone-300">Benefits you qualify for</p>
      <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
        {hasCash ? formatINR(e.yearlyCash) : formatINR(e.oneTime) || "₹0"}
        {hasCash && <span className="ml-2 text-lg font-medium text-stone-300">a year</span>}
      </p>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        {hasCash && e.oneTime > 0 && (
          <div>
            <dt className="text-stone-400">One-time support</dt>
            <dd className="text-lg font-semibold">{formatINR(e.oneTime)}</dd>
          </div>
        )}
        {e.insuranceCover > 0 && (
          <div>
            <dt className="text-stone-400">Insurance cover</dt>
            <dd className="text-lg font-semibold">{formatINR(e.insuranceCover)}</dd>
          </div>
        )}
        <div>
          <dt className="text-stone-400">Schemes</dt>
          <dd className="text-lg font-semibold">
            {counts.eligible} you qualify for
          </dd>
        </div>
      </dl>

      {near.schemeCount > 0 && (
        <p className="mt-5 border-t border-white/15 pt-4 text-sm text-amber-200">
          {near.schemeCount} more scheme{near.schemeCount > 1 ? "s are" : " is"} almost within reach
          {near.yearlyCash + near.oneTime > 0 && <> (worth {formatINR(near.yearlyCash + near.oneTime)})</>}. See “Almost” below.
        </p>
      )}
    </section>
  );
}
