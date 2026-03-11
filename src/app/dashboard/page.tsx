"use client";

import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";

import OverviewSection from "@/components/dashboard/OverviewSection";
import AnalyticsDashboardSection from "@/components/dashboard/AnalyticsDashboardSection";
import CompaniesSection from "@/components/dashboard/CompaniesSection";
import ContactsSection from "@/components/dashboard/ContactsSection";
import LeadsPipelineSection from "@/components/dashboard/LeadsPipelineSection";
import TasksSection from "@/components/dashboard/TasksSection";
import PerformanceSection from "@/components/dashboard/PerformanceSection";
import FinanceMarketingSection from "@/components/dashboard/FinanceMarketingSection";

export default function DashboardPage() {
  const { loading, data, formatCurrency, formatVariation, refreshDashboard } = useDashboardData();
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="animate-pulse h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="animate-pulse h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="animate-pulse h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <OverviewSection data={data} formatCurrency={formatCurrency} formatVariation={formatVariation} />

      <AnalyticsDashboardSection data={data} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <CompaniesSection data={data} formatCurrency={formatCurrency} onDeleteSuccess={refreshDashboard} />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ContactsSection data={data} onDeleteSuccess={refreshDashboard} />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <TasksSection data={data} onDeleteSuccess={refreshDashboard} />
        </div>

        <div className="col-span-12">
          <LeadsPipelineSection
            data={data}
            formatCurrency={formatCurrency}
            selectedFunnelStage={selectedFunnelStage}
            setSelectedFunnelStage={setSelectedFunnelStage}
            onDeleteSuccess={refreshDashboard}
          />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <PerformanceSection data={data} formatCurrency={formatCurrency} />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <FinanceMarketingSection data={data} formatCurrency={formatCurrency} />
        </div>
      </div>
    </div>
  );
}
