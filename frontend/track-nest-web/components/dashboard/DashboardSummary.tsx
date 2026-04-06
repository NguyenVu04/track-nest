"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AlertCircle, Users, Shield, BookOpen, TrendingUp, TrendingDown, Calendar } from "lucide-react";

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

/* ─── Main component ─────────────────────────────────────────────────────── */
export function DashboardSummary() {
  const crimeStats        = { total: 24, active: 8,  investigating: 10, resolved: 6  };
  const missingPersonStats = { total: 15, unhandled: 3, published: 9,  resolved: 3  };
  const guidelineStats    = { total: 42, recent: 5 };
  const userStats         = { totalUsers: 128, reporters: 95, emergencyServices: 33 };

  const crimeByTypeData = [
    { name: "Theft",   value: 8 },
    { name: "Assault", value: 5 },
    { name: "Robbery", value: 4 },
    { name: "Other",   value: 7 },
  ];

  const timelineData = [
    { name: "Mon", crimes: 3, missing: 2 },
    { name: "Tue", crimes: 4, missing: 1 },
    { name: "Wed", crimes: 5, missing: 3 },
    { name: "Thu", crimes: 2, missing: 2 },
    { name: "Fri", crimes: 6, missing: 1 },
    { name: "Sat", crimes: 2, missing: 4 },
    { name: "Sun", crimes: 2, missing: 2 },
  ];

  const severityData = [
    { name: "Low",    value: 8  },
    { name: "Medium", value: 10 },
    { name: "High",   value: 6  },
  ];

  const statusData = [
    { name: "Active",       value: 8  },
    { name: "Investigating",value: 10 },
    { name: "Resolved",     value: 6  },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* ── Page heading ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">System-wide snapshot</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Crime Reports"   value={crimeStats.total}         description={`${crimeStats.active} active`}              icon={<Shield    className="w-5 h-5" />} trend={12}  accent={RED}    />
        <StatCard title="Missing Persons" value={missingPersonStats.total} description={`${missingPersonStats.unhandled} unhandled`} icon={<Users     className="w-5 h-5" />} trend={-5}  accent={TEAL}   />
        <StatCard title="Guidelines"      value={guidelineStats.total}     description={`${guidelineStats.recent} this month`}       icon={<BookOpen  className="w-5 h-5" />}            accent={GREEN}  />
        <StatCard title="Active Users"    value={userStats.totalUsers}     description={`${userStats.reporters} reporters`}          icon={<AlertCircle className="w-5 h-5" />} trend={8} accent={PURPLE} />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Weekly Report Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="crimes"  stroke={RED}  strokeWidth={2} name="Crime Reports"   dot={{ fill: RED,  r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="missing" stroke={TEAL} strokeWidth={2} name="Missing Persons" dot={{ fill: TEAL, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={crimeByTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                   paddingAngle={3} dataKey="value"
                   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                   labelLine={false}>
                {crimeByTypeData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Severity Levels">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={severityData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill={AMBER} radius={[6, 6, 0, 0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Report Status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill={TEAL} radius={[6, 6, 0, 0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Breakdown cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-700">Crime Reports</h3>
          </div>
          <BreakdownRow label="Total"        value={crimeStats.total}        color={TEAL}  />
          <BreakdownRow label="Active"       value={crimeStats.active}       color={RED}   />
          <BreakdownRow label="Investigating"value={crimeStats.investigating} color={AMBER} />
          <BreakdownRow label="Resolved"     value={crimeStats.resolved}     color={GREEN} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-700">Missing Persons</h3>
          </div>
          <BreakdownRow label="Total"    value={missingPersonStats.total}     color={TEAL}  />
          <BreakdownRow label="Unhandled"value={missingPersonStats.unhandled} color={RED}   />
          <BreakdownRow label="Published"value={missingPersonStats.published} color={TEAL_DK} />
          <BreakdownRow label="Resolved" value={missingPersonStats.resolved}  color={GREEN} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-slate-700">Users</h3>
          </div>
          <BreakdownRow label="Total Users"       value={userStats.totalUsers}        color={TEAL}   />
          <BreakdownRow label="Reporters"         value={userStats.reporters}         color={PURPLE} />
          <BreakdownRow label="Emergency Services"value={userStats.emergencyServices} color={AMBER}  />
        </div>
      </div>

      {/* ── Guidelines summary ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-slate-700">Safety Guidelines</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",      value: guidelineStats.total, color: GREEN  },
            { label: "This month", value: guidelineStats.recent, color: TEAL  },
            { label: "This week",  value: 2,                     color: PURPLE },
            { label: "Views",      value: 342,                   color: AMBER  },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4 border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
