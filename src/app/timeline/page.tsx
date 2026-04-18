"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: number;
  content: string;
  status: string;
  tone: string | null;
  publishedAt: string | null;
  imageData: string | null;
  imageMimeType: string | null;
}

interface MonthGroup {
  month: string;
  posts: Post[];
}

function groupByMonth(posts: Post[]): MonthGroup[] {
  const groups: Record<string, Post[]> = {};
  for (const post of posts) {
    if (!post.publishedAt) continue;
    const d = new Date(post.publishedAt);
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  }
  return Object.entries(groups)
    .map(([month, posts]) => ({ month, posts }))
    .sort(
      (a, b) =>
        new Date(b.posts[0].publishedAt!).getTime() -
        new Date(a.posts[0].publishedAt!).getTime()
    );
}

function formatPublishDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TimelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  function toggleExpanded(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data = (await res.json()) as { posts: Post[] };
      const published = (data.posts || [])
        .filter((p) => p.status === "published")
        .sort((a, b) => {
          if (!a.publishedAt) return 1;
          if (!b.publishedAt) return -1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
      setPosts(published);
    } catch {
      toast.error("Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const monthGroups = groupByMonth(posts);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-violet-600/20 p-2.5">
          <Clock className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Timeline</h1>
          <p className="text-sm text-slate-400">Your published posts, newest first</p>
        </div>
      </div>

      {/* Empty state */}
      {monthGroups.length === 0 && (
        <div className="rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center py-16 text-center px-6 gap-3">
          <div className="rounded-full bg-slate-800 p-4">
            <Clock className="h-6 w-6 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400">No published posts yet</p>
          <p className="text-xs text-slate-600">
            Posts you publish will appear here, grouped by month.
          </p>
        </div>
      )}

      {/* Timeline */}
      {monthGroups.length > 0 && (
        <div className="relative pl-6">
          {/* Axis line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

          {monthGroups.map((group) => (
            <div key={group.month} className="mb-8">
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shrink-0 -ml-6">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="text-sm font-semibold text-slate-300">{group.month}</span>
              </div>

              {/* Posts in this month */}
              <div className="space-y-4">
                {group.posts.map((post) => {
                  const isExpanded = expandedIds.has(post.id);
                  return (
                  <div key={post.id} className="flex items-start gap-3">
                    {/* Dot on axis */}
                    <div className="shrink-0 -ml-6 mt-3.5">
                      <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 ml-[11px]" />
                    </div>

                    {/* Post card */}
                    <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 hover:border-slate-700 transition-colors">
                      {/* Image thumbnail */}
                      {post.imageData && (
                        <img
                          src={`data:${post.imageMimeType};base64,${post.imageData}`}
                          alt="Post image"
                          className="w-full max-h-32 object-cover rounded-lg border border-slate-700"
                        />
                      )}

                      {/* Content */}
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {post.content.length <= 100 ? (
                          post.content
                        ) : isExpanded ? (
                          <>
                            {post.content}
                            <button
                              onClick={() => toggleExpanded(post.id)}
                              className="ml-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Show less
                            </button>
                          </>
                        ) : (
                          <>
                            {post.content.slice(0, 100)}{"…"}
                            <button
                              onClick={() => toggleExpanded(post.id)}
                              className="ml-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Read more
                            </button>
                          </>
                        )}
                      </p>

                      {/* Footer: date + tone */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.publishedAt && (
                          <span className="text-xs text-slate-500">
                            {formatPublishDate(post.publishedAt)}
                          </span>
                        )}
                        {post.tone && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-700 text-slate-400"
                          >
                            {post.tone}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
