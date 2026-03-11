import type { DashboardData } from "@/hooks/useDashboardData";

type Props = {
  data: DashboardData;
  formatCurrency: (value: number) => string;
};

export default function FinanceMarketingSection({ data, formatCurrency }: Props) {
  const topSources = [...data.marketing.leadsBySource].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Marketing et finance</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Sources prospects + prévision (dérivée)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Sources des prospects</h3>
          <div className="space-y-2">
            {topSources.map((s) => (
              <div key={s.source} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{s.source}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.count}</span>
              </div>
            ))}
            {topSources.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucune source.</div> : null}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Prévision revenus</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Prévision (pipeline du mois, dérivée)</div>
          <div className="text-2xl font-semibold text-ferkous-500">{formatCurrency(data.finance.forecast)}</div>

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Factures / ROI campagnes : nécessite des tables dédiées (`invoices`, `campaigns`). On les branche quand tu veux.
          </div>
        </div>
      </div>
    </div>
  );
}
