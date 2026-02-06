"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  Users,
  Shield,
  BookOpen,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card } from "./ui/card";

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export function DashboardSummary() {
  const [crimeStats, setCrimeStats] = useState({
    total: 24,
    active: 8,
    investigating: 10,
    resolved: 6,
  });

  const [missingPersonStats, setMissingPersonStats] = useState({
    total: 15,
    unhandled: 3,
    published: 9,
    resolved: 3,
  });

  const [guidelineStats, setGuidelineStats] = useState({
    total: 42,
    recent: 5,
  });

  const [userStats, setUserStats] = useState({
    totalUsers: 128,
    reporters: 95,
    emergencyServices: 33,
  });

  // Mock data for charts
  const [crimeByTypeData] = useState<ChartDataPoint[]>([
    { name: "Theft", value: 8 },
    { name: "Assault", value: 5 },
    { name: "Robbery", value: 4 },
    { name: "Other", value: 7 },
  ]);

  const [timelineData] = useState<ChartDataPoint[]>([
    { name: "Mon", crimes: 3, missing: 2 },
    { name: "Tue", crimes: 4, missing: 1 },
    { name: "Wed", crimes: 5, missing: 3 },
    { name: "Thu", crimes: 2, missing: 2 },
    { name: "Fri", crimes: 6, missing: 1 },
    { name: "Sat", crimes: 2, missing: 4 },
    { name: "Sun", crimes: 2, missing: 2 },
  ]);

  const [severityData] = useState<ChartDataPoint[]>([
    { name: "Low", value: 8 },
    { name: "Medium", value: 10 },
    { name: "High", value: 6 },
  ]);

  const [statusData] = useState<ChartDataPoint[]>([
    { name: "Active", value: 8 },
    { name: "Investigating", value: 10 },
    { name: "Resolved", value: 6 },
  ]);

  const colors = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];
  const COLORS = {
    primary: "#6366f1",
    secondary: "#f59e0b",
    danger: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
  };

  const stats: StatCard[] = [
    {
      title: "Total Crime Reports",
      value: crimeStats.total,
      description: `${crimeStats.active} active`,
      icon: <Shield className="w-6 h-6" />,
      trend: 12,
      color: "from-red-50 to-red-100",
    },
    {
      title: "Missing Persons",
      value: missingPersonStats.total,
      description: `${missingPersonStats.unhandled} unhandled`,
      icon: <Users className="w-6 h-6" />,
      trend: -5,
      color: "from-blue-50 to-blue-100",
    },
    {
      title: "Safety Guidelines",
      value: guidelineStats.total,
      description: `${guidelineStats.recent} this month`,
      icon: <BookOpen className="w-6 h-6" />,
      color: "from-green-50 to-green-100",
    },
    {
      title: "Active Users",
      value: userStats.totalUsers,
      description: `${userStats.reporters} reporters`,
      icon: <AlertCircle className="w-6 h-6" />,
      trend: 8,
      color: "from-purple-50 to-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the system overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                  {stat.trend && (
                    <span
                      className={`text-xs font-semibold ${stat.trend > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stat.trend > 0 ? "+" : ""}
                      {stat.trend}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
              </div>
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-gray-700`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crime Reports Timeline */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reports by Day
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="crimes"
                stroke={COLORS.danger}
                strokeWidth={2}
                name="Crime Reports"
                dot={{ fill: COLORS.danger, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="missing"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Missing Persons"
                dot={{ fill: COLORS.primary, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Crime by Type */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Crime Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={crimeByTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {crimeByTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Crime Severity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Severity Levels
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="value"
                fill={COLORS.warning}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Crime Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Report Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="value"
                fill={COLORS.primary}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Crime Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Crime Reports
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">
                {crimeStats.total}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Active</span>
              <span className="font-semibold text-orange-600">
                {crimeStats.active}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Investigating</span>
              <span className="font-semibold text-yellow-600">
                {crimeStats.investigating}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Resolved</span>
              <span className="font-semibold text-green-600">
                {crimeStats.resolved}
              </span>
            </div>
          </div>
        </Card>

        {/* Missing Persons Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Missing Persons
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">
                {missingPersonStats.total}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Unhandled</span>
              <span className="font-semibold text-red-600">
                {missingPersonStats.unhandled}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Published</span>
              <span className="font-semibold text-blue-600">
                {missingPersonStats.published}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Resolved</span>
              <span className="font-semibold text-green-600">
                {missingPersonStats.resolved}
              </span>
            </div>
          </div>
        </Card>

        {/* User Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            User Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">
                {userStats.totalUsers}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Reporters</span>
              <span className="font-semibold text-indigo-600">
                {userStats.reporters}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Emergency Services</span>
              <span className="font-semibold text-orange-600">
                {userStats.emergencyServices}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Guidelines Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-600" />
          Safety Guidelines
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Guidelines</p>
            <p className="text-2xl font-bold text-green-600">
              {guidelineStats.total}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-2xl font-bold text-blue-600">
              {guidelineStats.recent}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">New This Week</p>
            <p className="text-2xl font-bold text-indigo-600">2</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Views</p>
            <p className="text-2xl font-bold text-purple-600">342</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
