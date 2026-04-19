"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { PenLine, CheckCircle, Clock, TrendingUp, FileText, Loader2 } from "lucide-react";

interface DashboardData {
  total: number;
  drafts: number;
  publishedThisWeek: number;
  recentDrafts: Array<{
    id: number;
    content: string;
    tone: string | null;
    createdAt: string | null;
  }>;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    total: 0,
    drafts: 0,
    publishedThisWeek: 0,
    recentDrafts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => { if (Array.isArray(d.recentDrafts)) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Total Posts",
      value: loading ? "…" : String(data.total),
      icon: FileText,
      description: "All time",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      accent: "border-t-2 border-blue-500",
    },
    {
      label: "Drafts Pending",
      value: loading ? "…" : String(data.drafts),
      icon: Clock,
      description: "Awaiting review",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      accent: "border-t-2 border-amber-500",
    },
    {
      label: "Published This Week",
      value: loading ? "…" : String(data.publishedThisWeek),
      icon: TrendingUp,
      description: "Last 7 days",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      accent: "border-t-2 border-emerald-500",
    },
  ];

  const quickActions = [
    {
      label: "Compose New Post",
      href: "/compose",
      icon: PenLine,
      description: "Generate AI-powered LinkedIn content",
      color: "bg-blue-600 hover:bg-blue-700 ring-1 ring-transparent hover:ring-blue-500/30",
      textColor: "text-white",
      subTextColor: "text-white/70",
    },
    {
      label: "Review Queue",
      href: "/queue",
      icon: CheckCircle,
      description: "Approve or discard pending drafts",
      color: "bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-gray-600 dark:text-white/70",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <LogoIcon size={48} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to InPoster</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Your AI-powered LinkedIn post composer. Generate, refine, and publish with confidence.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-start gap-4 ${stat.accent}`}
          >
            <div className={`rounded-lg p-2.5 ${stat.bg} shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{stat.label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} rounded-xl p-5 flex flex-col gap-3 transition-colors group`}
            >
              <action.icon className={`h-6 w-6 ${action.textColor}`} />
              <div>
                <p className={`font-semibold text-sm ${action.textColor}`}>{action.label}</p>
                <p className={`text-xs mt-0.5 ${action.subTextColor}`}>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent drafts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Recent Drafts
        </h2>
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-slate-500" />
            </div>
          ) : data.recentDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-gray-100 dark:bg-slate-800 p-4 mb-4">
                <PenLine className="h-7 w-7 text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-gray-600 dark:text-slate-300 font-medium">No drafts yet</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1 max-w-xs">
                Head to Compose to generate your first AI-powered LinkedIn post.
              </p>
              <Link
                href="/compose"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <PenLine className="h-4 w-4" />
                Compose a post
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-800">
              {data.recentDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  href="/queue"
                  className="flex items-start gap-3 p-4 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-slate-200 truncate">{draft.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(draft.createdAt)}</span>
                      {draft.tone && (
                        <span className="text-xs text-gray-300 dark:text-slate-600">· {draft.tone}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 shrink-0 pt-0.5">Draft</span>
                </Link>
              ))}
              <div className="p-3 text-center">
                <Link href="/queue" className="text-xs text-blue-400 hover:text-blue-300">
                  View all in Queue →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
