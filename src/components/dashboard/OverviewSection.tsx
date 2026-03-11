import type { DashboardData } from "@/hooks/useDashboardData";

type Props = {
  data: DashboardData;
  formatCurrency: (value: number) => string;
  formatVariation: (value: number, suffix?: string) => { text: string; color: string };
};

export default function OverviewSection({ data, formatCurrency, formatVariation }: Props) {
  const pVar = formatVariation(data.kpis.pipelineVariation, "%");
  const cVar = formatVariation(data.kpis.conversionVariation, " pts");
  const rVar = formatVariation(data.kpis.monthRevenueVariation, "%");

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Vue d'ensemble</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Pilotage commercial et activité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <Card title="CA du mois" value={formatCurrency(data.kpis.monthRevenue)} sub={rVar.text} subClass={rVar.color} />
        <Card title="Pipeline total" value={formatCurrency(data.kpis.pipelineTotal)} sub={pVar.text} subClass={pVar.color} />
        <Card title="Objectif atteint" value={`${data.kpis.objectiveReachedPct.toFixed(0)}%`} sub="Objectif: 50 000 €" subClass="text-slate-500 dark:text-slate-400" />

        <Card title="Nouveaux prospects (mois)" value={data.kpis.newLeadsThisMonth} />
        <Card title="Rendez-vous du jour" value={data.kpis.meetingsToday} />
        <Card title="Tâches urgentes" value={data.kpis.urgentTasks} sub={`En retard : ${data.kpis.overdueTasks}`} subClass="text-red-500" />

        <Card title="Taux de conversion" value={`${data.kpis.conversionRate.toFixed(1)}%`} sub={cVar.text} subClass={cVar.color} />
        <Card title="Total entreprises" value={data.kpis.totalCompanies} />
        <Card title="Tâches en retard" value={data.kpis.overdueTasks} />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  sub,
  subClass,
}: {
  title: string;
  value: string | number;
  sub?: string;
  subClass?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {sub ? <div className={`text-sm mt-2 ${subClass || "text-slate-500 dark:text-slate-400"}`}>{sub}</div> : null}
    </div>
  );
}
