"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AlertCircle, Users, Shield, BookOpen, TrendingUp, TrendingDown, Calendar, Download, FileBarChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { criminalReportsService, DashboardSummaryResponse, CrimeAnalysisReportResponse } from "@/services/criminalReportsService";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const TEAL    = "#74becb";
const TEAL_DK = "#5aa8b5";
const RED     = "#e74c3c";
const AMBER   = "#f39c12";
const GREEN   = "#27ae60";
const PURPLE  = "#8b5cf6";
const PIE_COLORS = [TEAL, RED, AMBER, GREEN, PURPLE];

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  fontSize: 13,
};

/* ─── Tiny sub-components ────────────────────────────────────────────────── */
function StatCard({
  title, value, description, icon, trend, accent,
}: {
  title: string; value: number | string; description: string;
  icon: React.ReactNode; trend?: number; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-4">
      <div className="stat-card-icon shrink-0" style={{ background: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

/* ─── Crime Analysis Report sub-component ───────────────────────────────── */
function CrimeAnalysisSection() {
  const t = useTranslations("dashboard");

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CrimeAnalysisReportResponse | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await criminalReportsService.generateCrimeAnalysisReport(startDate, endDate);
      setReport(data);
    } catch {
      setError(t("analysisError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crime-analysis-${startDate}-to-${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityData = report
    ? Object.entries(report.crimesBySeverity).map(([k, v]) => ({ name: `L${k}`, value: v }))
    : [];

  const typeData = report
    ? Object.entries(report.crimesByType).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-700">{t("analysisTitle")}</h3>
        </div>
        {report && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t("analysisDownload")}
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-4">{t("analysisDescription")}</p>

      {/* Date range + generate */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t("analysisStartDate")}</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t("analysisEndDate")}</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg px-4 py-1.5 transition-colors"
        >
          <FileBarChart className="w-4 h-4" />
          {loading ? t("analysisGenerating") : t("analysisGenerate")}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-5">
          {/* Report date */}
          <p className="text-xs text-slate-400">
            {t("analysisReportDate")}:{" "}
            <span className="font-medium text-slate-600">
              {new Date(report.reportDate).toLocaleString()}
            </span>
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: t("analysisTotalCrimes"),    value: report.totalCrimeReports,        color: RED    },
              { label: t("analysisTotalMissing"),   value: report.totalMissingPersonReports, color: TEAL   },
              { label: t("analysisTotalArrests"),   value: report.totalArrests,             color: PURPLE },
              { label: t("analysisTotalVictims"),   value: report.totalVictims,             color: AMBER  },
              { label: t("analysisTotalOffenders"), value: report.totalOffenders,           color: GREEN  },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4 border border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500 mb-1 leading-tight">{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {severityData.length > 0 && (
              <ChartCard title={t("analysisBySeverity")}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={severityData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill={AMBER} radius={[6, 6, 0, 0]} name={t("analysisBySeverity")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {typeData.length > 0 && (
              <ChartCard title={t("analysisByType")}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {report.crimeTrend.length > 0 && (
              <ChartCard title={t("analysisTrend")}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={report.crimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="count" stroke={RED} strokeWidth={2} dot={{ fill: RED, r: 3 }} name={t("analysisTotalCrimes")} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Hotspots table */}
            {report.hotspots.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("analysisHotspots")}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 pr-4 font-medium text-slate-500">{t("analysisHotspotLat")}</th>
                        <th className="text-left py-2 pr-4 font-medium text-slate-500">{t("analysisHotspotLng")}</th>
                        <th className="text-right py-2 pr-4 font-medium text-slate-500">{t("analysisHotspotCount")}</th>
                        <th className="text-right py-2 font-medium text-slate-500">{t("analysisHotspotSeverity")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.hotspots.map((h, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-4">{h.latitude.toFixed(5)}</td>
                          <td className="py-2 pr-4">{h.longitude.toFixed(5)}</td>
                          <td className="py-2 pr-4 text-right font-semibold text-slate-800">{h.incidentCount}</td>
                          <td className="py-2 text-right font-semibold" style={{ color: AMBER }}>{h.averageSeverity.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export function DashboardSummary() {
  const t = useTranslations("dashboard");

  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    criminalReportsService.getDashboardSummary()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
        {error ?? "No data available"}
      </div>
    );
  }

  const { crimeStats, missingPersonStats, guidelineStats, reporterStats,
          crimeByType, weeklyTrend, severityGroups, statusGroups } = data;

  return (
    <div className="space-y-6 page-enter">
      {/* ── Page heading ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("overview")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("systemSnapshot")}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t("statCrimeReports")}
          value={crimeStats.total}
          description={`${crimeStats.active} ${t("active")}`}
          icon={<Shield className="w-5 h-5" />}
          accent={RED}
        />
        <StatCard
          title={t("statMissingPersons")}
          value={missingPersonStats.total}
          description={`${missingPersonStats.pending} ${t("unhandled")}`}
          icon={<Users className="w-5 h-5" />}
          accent={TEAL}
        />
        <StatCard
          title={t("statGuidelines")}
          value={guidelineStats.total}
          description={`${guidelineStats.thisMonth} ${t("thisMonth")}`}
          icon={<BookOpen className="w-5 h-5" />}
          accent={GREEN}
        />
        <StatCard
          title={t("statActiveUsers")}
          value={reporterStats.totalReporters}
          description={t("reporters")}
          icon={<AlertCircle className="w-5 h-5" />}
          accent={PURPLE}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title={t("chartWeeklyTrend")}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dayName" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="crimes"  stroke={RED}  strokeWidth={2} name={t("statCrimeReports")}   dot={{ fill: RED,  r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="missing" stroke={TEAL} strokeWidth={2} name={t("statMissingPersons")} dot={{ fill: TEAL, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartCrimeDistribution")}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={crimeByType}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {crimeByType.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartSeverityLevels")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={severityGroups} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill={AMBER} radius={[6, 6, 0, 0]} name={t("statCrimeReports")} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartReportStatus")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusGroups} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill={TEAL} radius={[6, 6, 0, 0]} name={t("statCrimeReports")} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Breakdown cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-700">{t("breakdownCrimeReports")}</h3>
          </div>
          <BreakdownRow label={t("total")}        value={crimeStats.total}        color={TEAL}  />
          <BreakdownRow label={t("active")}        value={crimeStats.active}       color={RED}   />
          <BreakdownRow label={t("investigating")} value={crimeStats.investigating} color={AMBER} />
          <BreakdownRow label={t("resolvedStat")} value={crimeStats.resolved}     color={GREEN} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-700">{t("breakdownMissingPersons")}</h3>
          </div>
          <BreakdownRow label={t("total")}      value={missingPersonStats.total}     color={TEAL}    />
          <BreakdownRow label={t("unhandled")}  value={missingPersonStats.pending}   color={RED}     />
          <BreakdownRow label={t("reporters")}  value={missingPersonStats.published} color={TEAL_DK} />
          <BreakdownRow label={t("resolvedStat")} value={missingPersonStats.rejected} color={GREEN} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-slate-700">{t("breakdownUsers")}</h3>
          </div>
          <BreakdownRow label={t("totalUsers")} value={reporterStats.totalReporters} color={TEAL}   />
          <BreakdownRow label={t("reporters")}  value={reporterStats.totalReporters} color={PURPLE} />
        </div>
      </div>

      {/* ── Guidelines summary ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-slate-700">{t("breakdownGuidelines")}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("total"),     value: guidelineStats.total,      color: GREEN  },
            { label: t("thisMonth"), value: guidelineStats.thisMonth,   color: TEAL   },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4 border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Crime Analysis Report ── */}
      <CrimeAnalysisSection />
    </div>
  );
}
