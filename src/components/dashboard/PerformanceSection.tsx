import type { DashboardData } from "@/hooks/useDashboardData";

type Props = {
  data: DashboardData;
  formatCurrency: (value: number) => string;
};

export default function PerformanceSection({ data, formatCurrency }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Performance des commerciaux</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Classement par pipeline (dérivé)</p>
      </div>

      <div className="max-h-[380px] overflow-auto space-y-3">
        {data.leaderboard.map((u, idx: number) => (
          <div key={u.userId} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition p-1 rounded pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                {idx + 1}
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{u.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Prospects : {u.assigned} • Convertis : {u.converted} • Taux de réussite : {u.winRate.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="font-semibold text-ferkous-500">{formatCurrency(u.pipeline)}</div>
          </div>
        ))}
        {data.leaderboard.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucune donnée assignée.</div> : null}
      </div>
    </div>
  );
}
