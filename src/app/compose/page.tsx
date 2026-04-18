"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PenLine, Loader2, RefreshCw, Save, Settings as SettingsIcon, ImageIcon, Upload, Wand2, X, Search, Sparkles } from "lucide-react";
import { UnsplashSearchModal } from "@/components/unsplash-search-modal";
import { IdeasModal } from "@/components/ideas-modal";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Variant {
  content: string;
}

interface Settings {
  default_tone: string;
  default_length: string;
  default_hashtags: string;
  emoji_usage: string;
  anthropic_api_key: string;
  openai_api_key: string;
  unsplash_access_key: string;
}

const MAX_CHARS = 1300;

function CharCounter({ count }: { count: number }) {
  const isOver = count > MAX_CHARS;
  return (
    <span className={cn("text-xs tabular-nums", isOver ? "text-red-400 font-semibold" : "text-slate-500")}>
      {count}/{MAX_CHARS}
    </span>
  );
}

function VariantCard({
  variant,
  index,
  onSave,
  hasOpenAIKey,
  hasUnsplashKey,
  initialImage,
}: {
  variant: Variant;
  index: number;
  onSave: (content: string, imageData?: { data: string; mimeType: string }) => void;
  hasOpenAIKey: boolean;
  hasUnsplashKey: boolean;
  initialImage?: { data: string; mimeType: string };
}) {
  const [content, setContent] = useState(variant.content);
  const [saving, setSaving] = useState(false);

  // Image upload state
  const [imageState, setImageState] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(
    initialImage
      ? { data: initialImage.data, mimeType: initialImage.mimeType, previewUrl: `data:${initialImage.mimeType};base64,${initialImage.data}` }
      : null
  );

  // AI generation state machine
  type GenStep = "idle" | "open" | "generating" | "preview";
  const [genStep, setGenStep] = useState<GenStep>("idle");
  const [genPrompt, setGenPrompt] = useState("");
  const [genPreview, setGenPreview] = useState<{ data: string; mimeType: string } | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Unsplash modal state
  const [unsplashOpen, setUnsplashOpen] = useState(false);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(variant.content);
  }, [variant.content]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // result is "data:image/jpeg;base64,XXXX..." — strip the prefix
      const base64 = result.split(",")[1];
      const previewUrl = URL.createObjectURL(file);
      setImageState({ data: base64, mimeType: file.type, previewUrl });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSuggestPrompt = async () => {
    setLoadingPrompt(true);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, derive_only: true }),
      });
      const data = await res.json() as { prompt_used?: string; error?: string };
      if (res.ok && data.prompt_used) {
        setGenPrompt(data.prompt_used);
      } else {
        toast.error(data.error || "Failed to suggest prompt");
      }
    } catch {
      toast.error("Failed to suggest prompt");
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setGenStep("generating");
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, custom_prompt: genPrompt }),
      });
      const data = await res.json() as { image_data?: string; image_mime_type?: string; error?: string };
      if (res.ok && data.image_data) {
        setGenPreview({ data: data.image_data, mimeType: data.image_mime_type ?? "image/png" });
        setGenStep("preview");
      } else {
        toast.error(data.error || "Image generation failed");
        setGenStep("open");
      }
    } catch {
      toast.error("Image generation failed");
      setGenStep("open");
    }
  };

  const handleUseGenerated = () => {
    if (!genPreview) return;
    const previewUrl = `data:${genPreview.mimeType};base64,${genPreview.data}`;
    setImageState({ data: genPreview.data, mimeType: genPreview.mimeType, previewUrl });
    setGenStep("idle");
    setGenPreview(null);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(content, imageState ?? undefined);
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 flex flex-col ring-1 ring-slate-700/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
          Y
        </div>
        <div>
          <p className="text-sm font-medium text-white">You</p>
          <p className="text-xs text-slate-500">LinkedIn</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs text-slate-500 font-medium">Variant {index + 1}</span>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-slate-800 border-slate-700 text-slate-200 text-sm min-h-[160px] resize-y placeholder:text-slate-500"
        placeholder="Post content..."
      />

      {/* Image section */}
      <div className="space-y-2">
        {/* Image preview */}
        {imageState && (
          <div className="relative inline-block">
            <img
              src={imageState.previewUrl}
              alt="Post image"
              className="rounded-lg max-h-48 max-w-full object-cover border border-slate-700"
            />
            <button
              type="button"
              onClick={() => setImageState(null)}
              className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-1 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Upload + Generate buttons (only when no image and gen is idle) */}
        {!imageState && genStep === "idle" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 transition-colors"
            >
              <Upload className="h-3 w-3" />
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => { setGenStep("open"); setGenPrompt(""); }}
              disabled={!hasOpenAIKey}
              title={!hasOpenAIKey ? "Add OpenAI API key in Settings to generate images" : undefined}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wand2 className="h-3 w-3" />
              Generate Image
            </button>
            <button
              type="button"
              onClick={() => setUnsplashOpen(true)}
              disabled={!hasUnsplashKey}
              title={!hasUnsplashKey ? "Add Unsplash access key in Settings to search photos" : undefined}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Search className="h-3 w-3" />
              Search Unsplash
            </button>
          </div>
        )}

        {/* AI generation panel */}
        {genStep === "open" && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Image prompt</span>
              <button type="button" onClick={() => setGenStep("idle")} className="text-slate-500 hover:text-slate-300">
                <X className="h-3 w-3" />
              </button>
            </div>
            <Textarea
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder="Describe the image you want..."
              className="bg-slate-800 border-slate-700 text-slate-200 text-xs min-h-[60px] resize-none placeholder:text-slate-500"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSuggestPrompt}
                disabled={loadingPrompt}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-7 text-xs px-2"
              >
                {loadingPrompt ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                Suggest
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={!genPrompt.trim()}
                className="bg-violet-600 hover:bg-violet-700 h-7 text-xs px-2"
              >
                Generate
              </Button>
            </div>
          </div>
        )}

        {genStep === "generating" && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            <span className="text-xs text-slate-400">Generating image…</span>
          </div>
        )}

        {genStep === "preview" && genPreview && (
          <div className="space-y-2">
            <img
              src={`data:${genPreview.mimeType};base64,${genPreview.data}`}
              alt="Generated image preview"
              className="rounded-lg max-h-48 max-w-full object-cover border border-slate-700 w-full"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUseGenerated} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">
                Use This Image
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGenStep("open")} className="border-slate-700 text-slate-300 hover:bg-slate-800 h-7 text-xs">
                Regenerate
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setGenStep("idle"); setGenPreview(null); }} className="border-slate-700 text-slate-300 hover:bg-slate-800 h-7 text-xs">
                Discard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
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
        onSelect={(data, mime) => {
          setImageState({ data, mimeType: mime, previewUrl: `data:${mime};base64,${data}` });
          setUnsplashOpen(false);
        }}
      />

      <div className="flex items-center justify-between">
        <CharCounter count={content.length} />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save as Draft
        </Button>
      </div>
    </div>
  );
}

function ComposePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Edit mode state
  const [editId, setEditId] = useState<number | null>(null);
  const [editVariant, setEditVariant] = useState<Variant | null>(null);
  const [editInitialImage, setEditInitialImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [hasUnsplashKey, setHasUnsplashKey] = useState(false);
  const [defaultSettings, setDefaultSettings] = useState<Settings>({
    default_tone: "Professional",
    default_length: "medium",
    default_hashtags: "3",
    emoji_usage: "false",
    anthropic_api_key: "",
    openai_api_key: "",
    unsplash_access_key: "",
  });

  // Form state
  const [topic, setTopic] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [audience, setAudience] = useState("");
  const [cta, setCta] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("medium");
  const [hashtags, setHashtags] = useState(3);
  const [emojis, setEmojis] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);

  const topicRef = useRef<HTMLTextAreaElement>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json() as { settings: Record<string, string> };
      const s = data.settings || {};
      const hasKey = !!(s.anthropic_api_key && s.anthropic_api_key.length > 0);
      setHasApiKey(hasKey);
      const hasOAIKey = !!(s.openai_api_key && s.openai_api_key.length > 0);
      setHasOpenAIKey(hasOAIKey);
      const hasUnsplash = !!(s.unsplash_access_key && s.unsplash_access_key.length > 0);
      setHasUnsplashKey(hasUnsplash);
      setDefaultSettings({
        default_tone: s.default_tone || "Professional",
        default_length: s.default_length || "medium",
        default_hashtags: s.default_hashtags || "3",
        emoji_usage: s.emoji_usage || "false",
        anthropic_api_key: s.anthropic_api_key || "",
        openai_api_key: s.openai_api_key || "",
        unsplash_access_key: s.unsplash_access_key || "",
      });
      setTone(s.default_tone || "Professional");
      setLength(s.default_length || "medium");
      setHashtags(parseInt(s.default_hashtags || "3") || 3);
      setEmojis(s.emoji_usage === "true");
    } catch {
      setHasApiKey(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (!editParam) return;
    const id = parseInt(editParam, 10);
    if (isNaN(id)) return;

    setEditLoading(true);
    fetch(`/api/posts/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const data = await res.json() as { post: { id: number; content: string; tone: string | null; imageData: string | null; imageMimeType: string | null } };
        setEditId(data.post.id);
        setEditVariant({ content: data.post.content });
        setTone(data.post.tone || "Professional");
        if (data.post.imageData && data.post.imageMimeType) {
          setEditInitialImage({ data: data.post.imageData, mimeType: data.post.imageMimeType });
        }
      })
      .catch(() => {
        toast.error("Draft not found");
      })
      .finally(() => {
        setEditLoading(false);
      });
  }, [searchParams]);

  const saveEdit = async (content: string, imageData?: { data: string; mimeType: string }) => {
    try {
      const res = await fetch(`/api/posts/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, tone }),
      });
      if (!res.ok) throw new Error("Save failed");
      if (imageData) {
        await fetch(`/api/posts/${editId}/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: imageData.data, image_mime_type: imageData.mimeType }),
        });
      } else if (editInitialImage) {
        // User had an image but removed it — clear from DB
        await fetch(`/api/posts/${editId}/image`, { method: "DELETE" });
      }
      toast.success("Draft updated");
      router.push("/queue");
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handleIdeaSelect = (title: string) => {
    setTopic(title);
    setIdeasOpen(false);
  };

  const generate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      topicRef.current?.focus();
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, keyPoints, audience, cta, tone, length, hashtags, emojis }),
      });
      const data = await res.json() as { variants?: Variant[]; error?: string };
      if (!res.ok) {
        if (data.error?.includes("No Anthropic API key")) {
          setHasApiKey(false);
        }
        toast.error(data.error || "Generation failed");
        return;
      }
      setVariants(data.variants || []);
      setHasGenerated(true);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [topic, keyPoints, audience, cta, tone, length, hashtags, emojis]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!generating && topic.trim()) {
          generate();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generating, topic, generate]);

  const saveDraft = async (content: string, imageData?: { data: string; mimeType: string }) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source: "ai_generated", status: "draft", tone }),
      });
      if (!res.ok) throw new Error("Save failed");
      const postData = await res.json() as { post: { id: number } };

      if (imageData && postData.post?.id) {
        await fetch(`/api/posts/${postData.post.id}/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: imageData.data, image_mime_type: imageData.mimeType }),
        });
      }

      toast.success("Saved as draft! Find it in your Queue.");
    } catch {
      toast.error("Failed to save draft");
    }
  };

  if (hasApiKey === null || editLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-600/20 p-2.5">
          <PenLine className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Compose</h1>
          <p className="text-sm text-slate-400">
            {editId !== null ? `Editing draft #${editId}` : "Generate AI-powered LinkedIn posts with Claude"}
          </p>
        </div>
      </div>

      {/* No API key banner */}
      {!hasApiKey && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <SettingsIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Anthropic API key not configured</p>
            <p className="text-sm text-amber-400/70 mt-0.5">
              Configure your API key in Settings to start composing posts.
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200 font-medium underline"
            >
              Go to Settings
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Content</h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="topic" className="text-slate-400 text-xs uppercase tracking-wider">
                  What do you want to post about? *
                </Label>
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={() => setIdeasOpen(true)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    Inspire Me
                  </button>
                )}
              </div>
              <Textarea
                ref={topicRef}
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The biggest lesson I learned from launching my first product..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_points" className="text-slate-400 text-xs uppercase tracking-wider">
                Key points to include
              </Label>
              <Textarea
                id="key_points"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Optional: bullet points, data, anecdotes..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="audience" className="text-slate-400 text-xs uppercase tracking-wider">
                  Target audience
                </Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. startup founders"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta" className="text-slate-400 text-xs uppercase tracking-wider">
                  Call to action
                </Label>
                <Input
                  id="cta"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g. share your story"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Style Controls</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Professional" className="text-white">Professional</SelectItem>
                    <SelectItem value="Conversational" className="text-white">Conversational</SelectItem>
                    <SelectItem value="Inspirational" className="text-white">Inspirational</SelectItem>
                    <SelectItem value="Provocative" className="text-white">Provocative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="short" className="text-white">Short (≤300)</SelectItem>
                    <SelectItem value="medium" className="text-white">Medium (≤600)</SelectItem>
                    <SelectItem value="long" className="text-white">Long (≤1300)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtags" className="text-slate-400 text-xs uppercase tracking-wider">
                  Hashtags (0-10)
                </Label>
                <Input
                  id="hashtags"
                  type="number"
                  min={0}
                  max={10}
                  value={hashtags}
                  onChange={(e) => setHashtags(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Emojis</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={emojis}
                    onCheckedChange={setEmojis}
                  />
                  <span className="text-sm text-slate-400">{emojis ? "On" : "Off"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={generate}
              disabled={generating || !topic.trim() || !hasApiKey}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PenLine className="h-4 w-4 mr-2" />
              )}
              {generating ? "Generating…" : "Generate"}
              {!generating && <span className="ml-2 text-xs opacity-60">⌘↵</span>}
            </Button>
            {hasGenerated && (
              <Button
                variant="outline"
                onClick={generate}
                disabled={generating}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          {editId !== null && editVariant !== null ? (
            <VariantCard
              variant={editVariant}
              index={0}
              onSave={saveEdit}
              hasOpenAIKey={hasOpenAIKey}
              hasUnsplashKey={hasUnsplashKey}
              initialImage={editInitialImage ?? undefined}
            />
          ) : generating ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                    <div className="space-y-1">
                      <div className="h-3 w-16 bg-slate-800 rounded" />
                      <div className="h-2 w-12 bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-5/6" />
                    <div className="h-3 bg-slate-800 rounded w-4/6" />
                    <div className="h-3 bg-slate-800 rounded w-5/6" />
                    <div className="h-3 bg-slate-800 rounded w-3/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : variants.length > 0 ? (
            <div className="space-y-4">
              {variants.map((v, i) => (
                <VariantCard key={i} variant={v} index={i} onSave={saveDraft} hasOpenAIKey={hasOpenAIKey} hasUnsplashKey={hasUnsplashKey} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 flex flex-col items-center justify-center py-20 text-center px-4 h-full min-h-[300px]">
              <div className="rounded-full bg-blue-600/10 p-5 mb-4">
                <PenLine className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-slate-300 font-medium">Your posts will appear here</p>
              <p className="text-slate-500 text-sm mt-1 max-w-xs">
                Fill in the form and click Generate to create 2 LinkedIn post variants.
              </p>
            </div>
          )}
        </div>
      </div>

      <IdeasModal
        open={ideasOpen}
        onClose={() => setIdeasOpen(false)}
        onSelect={handleIdeaSelect}
      />
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    }>
      <ComposePageInner />
    </Suspense>
  );
}
