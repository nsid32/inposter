"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  ExternalLink,
  Edit2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Send,
  Upload,
  X,
  RefreshCw,
  Search,
} from "lucide-react";
import { UnsplashSearchModal } from "@/components/unsplash-search-modal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  linkedinId: string | null;
  content: string;
  source: string;
  status: string;
  tone: string | null;
  publishedAt: string | null;
  linkedinUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string | null;
  updatedAt: string | null;
  imageData: string | null;
  imageMimeType: string | null;
}

const MAX_CHARS = 1300;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CharCounter({ count }: { count: number }) {
  const isOver = count > MAX_CHARS;
  return (
    <span className={cn("text-xs tabular-nums", isOver ? "text-red-400 font-semibold" : "text-gray-400 dark:text-slate-500")}>
      {count}/{MAX_CHARS}
    </span>
  );
}

interface PostCardProps {
  post: Post;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onContentChange: (id: number, content: string) => Promise<void>;
  onPublish: (post: Post) => void;
  onImageChange: (id: number, imageData: string | null, imageMimeType: string | null) => void;
  onDelete: (id: number) => void;
  onResend: (post: Post) => void;
  hasUnsplashKey: boolean;
}

function PostCard({ post, onStatusChange, onContentChange, onPublish, onImageChange, onDelete, onResend, hasUnsplashKey }: PostCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [unsplashOpen, setUnsplashOpen] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onStatusChange(post.id, "approved");
    setLoading(false);
  };

  const handleUnapprove = async () => {
    setLoading(true);
    await onStatusChange(post.id, "draft");
    setLoading(false);
  };

  const handleDiscard = async () => {
    setLoading(true);
    await onStatusChange(post.id, "discarded");
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await onContentChange(post.id, editContent);
    setSaving(false);
    setEditOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      setImageLoading(true);
      try {
        const res = await fetch(`/api/posts/${post.id}/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: base64, image_mime_type: file.type }),
        });
        if (!res.ok) throw new Error("Upload failed");
        onImageChange(post.id, base64, file.type);
        toast.success("Image attached");
      } catch {
        toast.error("Failed to attach image");
      } finally {
        setImageLoading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = async () => {
    setImageLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/image`, { method: "DELETE" });
      if (!res.ok) throw new Error("Remove failed");
      onImageChange(post.id, null, null);
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 space-y-3 hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
        <p className="text-gray-700 dark:text-slate-200 text-sm leading-relaxed line-clamp-4">
          {post.content}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(post.createdAt)}</span>
          {post.tone && (
            <Badge variant="outline" className="text-xs border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400">
              {post.tone}
            </Badge>
          )}
          <span className="text-xs text-gray-300 dark:text-slate-600">{post.content.length} chars</span>
        </div>

        {/* Image section */}
        {post.imageData ? (
          <div className="relative inline-block">
            <img
              src={`data:${post.imageMimeType};base64,${post.imageData}`}
              alt="Post image"
              className="rounded-lg max-h-40 max-w-full object-cover border border-gray-200 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={imageLoading}
              className="absolute top-1 right-1 rounded-full bg-white/80 dark:bg-slate-900/80 p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {imageLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          (post.status === "draft" || post.status === "approved") && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
              >
                {imageLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Add Image
              </button>
              <button
                type="button"
                onClick={() => setUnsplashOpen(true)}
                disabled={imageLoading || !hasUnsplashKey}
                title={!hasUnsplashKey ? "Add Unsplash access key in Settings to search photos" : undefined}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 hover:border-gray-400 dark:hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Search className="h-3 w-3" />
                Search Unsplash
              </button>
            </div>
          )
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Unsplash search modal */}
        <UnsplashSearchModal
          open={unsplashOpen}
          onClose={() => setUnsplashOpen(false)}
          onSelect={async (imageData, imageMimeType) => {
            setImageLoading(true);
            try {
              const res = await fetch(`/api/posts/${post.id}/image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_data: imageData, image_mime_type: imageMimeType }),
              });
              if (!res.ok) throw new Error("Attach failed");
              onImageChange(post.id, imageData, imageMimeType);
              toast.success("Image attached");
            } catch {
              toast.error("Failed to attach image");
            } finally {
              setImageLoading(false);
            }
            setUnsplashOpen(false);
          }}
        />

        {post.status === "draft" && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/compose?edit=${post.id}`)}
              className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 h-8 text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ThumbsUp className="h-3 w-3 mr-1" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDiscard}
              disabled={loading}
              className="h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(post.id)}
              className="border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {post.status === "approved" && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditContent(post.content); setEditOpen(true); }}
              className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 h-8 text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnapprove}
              disabled={loading}
              className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 h-8 text-xs"
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              Unapprove
            </Button>
            <Button
              size="sm"
              onClick={() => onPublish(post)}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              Publish Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(post.id)}
              className="border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {post.status === "published" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-slate-500">Published {formatDate(post.publishedAt)}</span>
            {post.linkedinUrl && (
              <a
                href={post.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="h-3 w-3" />
                View on LinkedIn
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResend(post)}
              className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 h-8 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Resend
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(post.id)}
              className="border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 min-h-[200px]"
            />
            <div className="flex justify-end">
              <CharCounter count={editContent.length} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Column {
  label: string;
  status: string;
  headerColor: string;
  emptyMessage: string;
}

const COLUMNS: Column[] = [
  { label: "Drafts", status: "draft", headerColor: "border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-slate-500", emptyMessage: "No drafts yet" },
  { label: "Approved", status: "approved", headerColor: "border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-blue-500", emptyMessage: "No approved posts" },
  { label: "Published", status: "published", headerColor: "border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500", emptyMessage: "No published posts" },
];

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishTarget, setPublishTarget] = useState<Post | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [resendTarget, setResendTarget] = useState<Post | null>(null);
  const [resending, setResending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasUnsplashKey, setHasUnsplashKey] = useState(false);
  const [publishedDays, setPublishedDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, settingsRes] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/settings"),
      ]);
      const postsData = await postsRes.json() as { posts: Post[] };
      // Filter to only show ai_generated posts (not synced)
      setPosts((postsData.posts || []).filter((p) => p.source === "ai_generated"));

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json() as { settings: Record<string, string> };
        const s = settingsData.settings || {};
        setHasUnsplashKey(!!(s.unsplash_access_key && s.unsplash_access_key.length > 0));
      }
    } catch {
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
      );
      const statusLabel = status === "draft" ? "moved to drafts" : status === "approved" ? "approved" : "discarded";
      toast.success(`Post ${statusLabel}`);
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleContentChange = async (id: number, content: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Update failed");
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, content, updatedAt: new Date().toISOString() } : p))
      );
      toast.success("Post updated");
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleImageChange = (id: number, imageData: string | null, imageMimeType: string | null) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imageData, imageMimeType } : p))
    );
  };

  const confirmPublish = async () => {
    if (!publishTarget) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/posts/${publishTarget.id}/publish`, { method: "POST" });
      const data = await res.json() as { post?: Post; linkedinUrl?: string; error?: string; code?: string };

      if (!res.ok) {
        if (data.code === "webhook_not_configured") {
          toast.error("Make.com webhook not configured — add it in Settings.");
          return;
        }
        toast.error(data.error || "Publish failed");
        return;
      }

      if (data.post) {
        setPosts((prev) =>
          prev.map((p) => (p.id === publishTarget.id ? data.post! : p))
        );
      }

      toast.success("Sent to Make.com for publishing!");
      setPublishTarget(null);
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${deleteTarget}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget));
      toast.success("Post deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  const confirmResend = async () => {
    if (!resendTarget) return;
    setResending(true);
    try {
      const res = await fetch(`/api/posts/${resendTarget.id}/publish`, { method: "POST" });
      const data = await res.json() as { post?: Post; error?: string; code?: string };

      if (!res.ok) {
        if (data.code === "webhook_not_configured") {
          toast.error("Make.com webhook not configured — add it in Settings.");
          return;
        }
        toast.error(data.error || "Resend failed");
        return;
      }

      if (data.post) {
        setPosts((prev) =>
          prev.map((p) => (p.id === resendTarget.id ? data.post! : p))
        );
      }

      toast.success("Resent to Make.com!");
      setResendTarget(null);
    } catch {
      toast.error("Resend failed");
    } finally {
      setResending(false);
    }
  };

  const getColumnPosts = (status: string) => posts.filter((p) => p.status === status);

  const getPublishedPosts = () => {
    const allPublished = posts.filter((p) => p.status === "published");
    const days = parseInt(publishedDays, 10);
    if (!publishedDays || isNaN(days) || days <= 0) return allPublished;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allPublished.filter((p) => p.publishedAt && new Date(p.publishedAt) >= cutoff);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-600/20 p-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Review Queue</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Manage your AI-generated posts</p>
          </div>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const isPublished = col.status === "published";
            const colPosts = isPublished ? getPublishedPosts() : getColumnPosts(col.status);
            return (
              <div key={col.status} className="space-y-3">
                {/* Column Header */}
                <div className={cn("rounded-lg px-3 py-2 flex items-center justify-between", col.headerColor)}>
                  {isPublished ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">Published</span>
                      <span className="text-xs text-gray-900/60 dark:text-white/60 shrink-0">· last</span>
                      <input
                        type="number"
                        min={1}
                        value={publishedDays}
                        onChange={(e) => setPublishedDays(e.target.value)}
                        className="w-10 bg-black/20 rounded text-gray-900 dark:text-white text-xs px-1 text-center focus:outline-none focus:ring-1 focus:ring-white/30 border-0"
                      />
                      <span className="text-xs text-gray-900/60 dark:text-white/60 shrink-0">days</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{col.label}</span>
                  )}
                  <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 text-gray-900 dark:text-white font-medium">
                    {colPosts.length}
                  </span>
                </div>

                {/* Cards */}
                {colPosts.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 dark:border-slate-800 border-dashed flex items-center justify-center py-8 text-center px-3">
                    <p className="text-xs text-gray-300 dark:text-slate-600">{col.emptyMessage}</p>
                  </div>
                ) : (
                  colPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onStatusChange={handleStatusChange}
                      onContentChange={handleContentChange}
                      onPublish={setPublishTarget}
                      onImageChange={handleImageChange}
                      onDelete={setDeleteTarget}
                      onResend={setResendTarget}
                      hasUnsplashKey={hasUnsplashKey}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={!!publishTarget} onOpenChange={(open) => { if (!open) setPublishTarget(null); }}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Publish to LinkedIn?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-slate-400">
              This will send the post to your Make.com scenario for publishing to LinkedIn. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {publishTarget && (
            <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-3 my-2">
              <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed line-clamp-6">
                {publishTarget.content}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">{publishTarget.content.length} characters</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPublishTarget(null)}
              className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-transparent"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={publishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-slate-400">
              This will permanently remove the post from InPoster. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Confirmation Dialog */}
      <AlertDialog open={!!resendTarget} onOpenChange={(open) => { if (!open) setResendTarget(null); }}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Resend to Make.com?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-slate-400">
              This will re-send the post to your Make.com scenario for publishing to LinkedIn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resendTarget && (
            <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-3 my-2">
              <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed line-clamp-4">{resendTarget.content}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResendTarget(null)} className="border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmResend} disabled={resending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {resending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Resend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
