"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Layers,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Plus,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getTxUrl } from "@/lib/chain-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface OverviewStats {
  totalEarnings: number;
  totalAccesses: number;
  totalResources: number;
  activeResources: number;
  todayEarnings: number;
  todayAccesses: number;
  byType: Record<string, { count: number; earnings: number; accesses: number }>;
}

interface ChartData {
  chartData: Array<{ date: string; earnings: number; count: number }>;
  totalEarnings: number;
  totalAccesses: number;
}

interface Transaction {
  id: string;
  resourceId: string;
  amount: number;
  signature: string;
  timestamp: string;
}

type ChartPeriod = "30" | "90" | "365" | "all";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storesCount, setStoresCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30");
  const [chartLoading, setChartLoading] = useState(false);

  const fetchChartData = useCallback(async (days: ChartPeriod) => {
    if (!token) return;

    setChartLoading(true);
    try {
      const daysParam = days === "all" ? "9999" : days;
      const chartRes = await fetch(`${API_URL}/api/analytics/chart?days=${daysParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (chartRes.ok) {
        setChartData(await chartRes.json());
      } else {
        console.error("Chart data fetch failed:", chartRes.status, chartRes.statusText);
      }
    } catch (err) {
      // Network error - backend might not be running
      console.error("Failed to fetch chart data (network error):", err);
    } finally {
      setChartLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Fetch overview stats, chart data, earnings, and stores
        const [overviewRes, earningsRes, storesRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((e) => { console.error("Overview fetch error:", e); return null; }),
          fetch(`${API_URL}/api/analytics/earnings`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((e) => { console.error("Earnings fetch error:", e); return null; }),
          fetch(`${API_URL}/api/stores`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
        ]);

        if (overviewRes?.ok) {
          setStats(await overviewRes.json());
        }
        if (earningsRes?.ok) {
          const data = await earningsRes.json();
          setTransactions(data.recentTransactions || []);
        }
        if (storesRes?.ok) {
          const storesData = await storesRes.json();
          const stores = storesData.success && storesData.data?.stores
            ? storesData.data.stores
            : Array.isArray(storesData)
            ? storesData
            : (storesData.stores || []);
          setStoresCount(stores.length);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchChartData(chartPeriod);
  }, [token]);

  // Fetch chart data when period changes
  useEffect(() => {
    if (token) {
      fetchChartData(chartPeriod);
    }
  }, [chartPeriod, fetchChartData]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const [overviewRes, earningsRes, storesRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/analytics/earnings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/stores`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
        ]);

        if (overviewRes.ok) {
          setStats(await overviewRes.json());
        }
        if (earningsRes.ok) {
          const data = await earningsRes.json();
          setTransactions(data.recentTransactions || []);
        }
        if (storesRes?.ok) {
          const storesData = await storesRes.json();
          const stores = storesData.success && storesData.data?.stores
            ? storesData.data.stores
            : Array.isArray(storesData)
            ? storesData
            : (storesData.stores || []);
          setStoresCount(stores.length);
        }
      } catch (err) {
        console.error("Failed to refresh dashboard data:", err);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format currency
  const formatUSDC = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  // Format date for chart
  const formatChartDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl min-h-[180px] md:min-h-[220px] flex flex-col justify-end p-6 md:p-8 bg-primary group">
        {stats && stats.totalEarnings > 0 && (
          <div className="absolute top-4 right-4 bg-primary-foreground/20 backdrop-blur-md border border-primary-foreground/30 rounded-full px-4 py-2 flex items-center gap-2 text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold">
              {stats.todayEarnings > 0
                ? `+${((stats.todayEarnings / stats.totalEarnings) * 100).toFixed(1)}% Today`
                : "No activity today"}
            </span>
          </div>
        )}
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Financial Overview</p>
          <h2 className="text-primary-foreground text-3xl md:text-4xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-primary-foreground/70 text-sm md:text-base max-w-lg mt-1">
            Your earnings today: <span className="text-primary-foreground font-bold">{formatUSDC(stats?.todayEarnings || 0)}</span>. Keep growing!
          </p>
        </div>
      </div>

      {/* Portfolio Value & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Portfolio Value */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex-1 bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground font-medium">Total Earnings</p>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  {formatUSDC(stats?.totalEarnings || 0)}
                </h3>
                {stats && stats.totalEarnings > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-primary text-sm font-bold">
                        {stats.todayEarnings > 0
                          ? `+${((stats.todayEarnings / stats.totalEarnings) * 100).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">vs last month</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <Link href="/dashboard/resources/new" className="flex-1">
                <button className="w-full bg-primary text-primary-foreground h-10 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10">
                  New Resource
                </button>
              </Link>
              <Link href="/dashboard/analytics" className="flex-1">
                <button className="w-full bg-transparent border border-primary/30 text-primary h-10 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors">
                  View More
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/resources">
            <button className="group w-full flex flex-col items-center justify-center gap-4 p-6 bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="size-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-300">
                <Layers className="h-7 w-7" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">{stats?.totalResources || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Resources</p>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/orders">
            <button className="group w-full flex flex-col items-center justify-center gap-4 p-6 bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="size-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-300">
                <Activity className="h-7 w-7" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">{stats?.totalAccesses?.toLocaleString() || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Accesses</p>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/analytics">
            <button className="group w-full flex flex-col items-center justify-center gap-4 p-6 bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="size-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-300">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">
                  {formatUSDC(stats?.totalAccesses ? stats.totalEarnings / stats.totalAccesses : 0)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Avg/Access</p>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/stores">
            <button className="group w-full flex flex-col items-center justify-center gap-4 p-6 bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="size-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-300">
                <Plus className="h-7 w-7" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">{storesCount}</h3>
                <p className="text-xs text-muted-foreground mt-1">Stores</p>
              </div>
            </button>
          </Link>
        </div>
      </div>

      {/* Chart and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg text-foreground">Portfolio Growth</h3>
                <p className="text-sm text-muted-foreground">Asset performance tracking</p>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setChartPeriod("30")}
                  disabled={chartLoading}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    chartPeriod === "30"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-primary"
                  } ${chartLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  30D
                </button>
                <button
                  onClick={() => setChartPeriod("90")}
                  disabled={chartLoading}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartPeriod === "90"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-primary"
                  } ${chartLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  3M
                </button>
                <button
                  onClick={() => setChartPeriod("365")}
                  disabled={chartLoading}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartPeriod === "365"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-primary"
                  } ${chartLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  1Y
                </button>
                <button
                  onClick={() => setChartPeriod("all")}
                  disabled={chartLoading}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartPeriod === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-primary"
                  } ${chartLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  All
                </button>
              </div>
            </div>
            {chartLoading ? (
              <div className="flex items-center justify-center h-[240px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : chartData?.chartData && chartData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData.chartData}>
                  <defs>
                    <linearGradient id="chartGradientGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#6b7280" }}
                    formatter={(value: number) => [formatUSDC(value), "Earnings"]}
                    labelFormatter={formatChartDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={false}
                    fill="url(#chartGradientGreen)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                No data yet. Create your first resource to start earning.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-foreground">Recent Activity</h3>
              <Link href="/dashboard/analytics">
                <button className="text-xs font-bold bg-muted px-3 py-1 rounded-full text-primary hover:bg-primary/10 transition-colors">
                  View History
                </button>
              </Link>
            </div>
            {transactions.length > 0 ? (
              <div className="flex flex-col gap-5">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-foreground">{formatUSDC(tx.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={getTxUrl(tx.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resource Type Breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-bold text-lg text-foreground mb-6">By Resource Type</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div
                key={type}
                className="p-4 rounded-lg bg-muted border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="text-sm font-medium text-muted-foreground capitalize mb-2 group-hover:text-primary">
                  {type}
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatUSDC(data.earnings)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.count} resources • {data.accesses} accesses
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
