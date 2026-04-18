"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, Eye, EyeOff, Loader2, ChevronDown, ChevronUp, Webhook, BrainCircuit, SlidersHorizontal, ImageIcon, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const MASK = "••••••••••••";

interface SettingsState {
  anthropic_api_key: string;
  claude_model: string;
  default_tone: string;
  default_length: string;
  default_hashtags: string;
  emoji_usage: string;
  make_webhook_url: string;
  make_webhook_api_key: string;
  openai_api_key: string;
  unsplash_access_key: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  anthropic_api_key: "",
  claude_model: "claude-sonnet-4-6",
  default_tone: "Professional",
  default_length: "medium",
  default_hashtags: "3",
  emoji_usage: "false",
  make_webhook_url: "",
  make_webhook_api_key: "",
  openai_api_key: "",
  unsplash_access_key: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [imageSettingsLoading, setImageSettingsLoading] = useState(false);

  const [showUnsplashKey, setShowUnsplashKey] = useState(false);
  const [unsplashLoading, setUnsplashLoading] = useState(false);

  // Areas of Interest state
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [interestsLoading, setInterestsLoading] = useState(false);

  // Make.com webhook state
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showWebhookKey, setShowWebhookKey] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json() as { settings: Record<string, string> };
      setSettings((prev) => ({ ...prev, ...data.settings }));
      const rawInterests = data.settings.areas_of_interest || "";
      setInterests(rawInterests.split(",").map((s: string) => s.trim()).filter(Boolean));
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveWebhook = async () => {
    setWebhookLoading(true);
    try {
      const payload: Record<string, string> = { make_webhook_url: settings.make_webhook_url };
      if (settings.make_webhook_api_key !== MASK) {
        payload.make_webhook_api_key = settings.make_webhook_api_key;
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Make.com webhook saved");
    } catch {
      toast.error("Failed to save webhook URL");
    } finally {
      setWebhookLoading(false);
    }
  };

  const testWebhook = async () => {
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch("/api/settings/test-webhook", { method: "POST" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setWebhookTestResult({ ok: true, msg: "Webhook received the test payload successfully." });
      } else {
        setWebhookTestResult({ ok: false, msg: data.error || "Test failed" });
      }
    } catch {
      setWebhookTestResult({ ok: false, msg: "Network error" });
    } finally {
      setTestingWebhook(false);
    }
  };

  const saveAI = async () => {
    setAiLoading(true);
    try {
      const payload: Record<string, string> = {
        claude_model: settings.claude_model,
      };
      if (settings.anthropic_api_key !== MASK && settings.anthropic_api_key) {
        payload.anthropic_api_key = settings.anthropic_api_key;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("AI settings saved");
    } catch {
      toast.error("Failed to save AI settings");
    } finally {
      setAiLoading(false);
    }
  };

  const testAI = async () => {
    setTestingAi(true);
    try {
      const res = await fetch("/api/settings/test-ai", { method: "POST" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        toast.success("AI connection successful!");
      } else {
        toast.error(data.error || "AI connection failed");
      }
    } catch {
      toast.error("Failed to test AI connection");
    } finally {
      setTestingAi(false);
    }
  };

  const savePreferences = async () => {
    setPrefsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            default_tone: settings.default_tone,
            default_length: settings.default_length,
            default_hashtags: settings.default_hashtags,
            emoji_usage: settings.emoji_usage,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setPrefsLoading(false);
    }
  };

  const saveImageSettings = async () => {
    setImageSettingsLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (settings.openai_api_key !== MASK && settings.openai_api_key) {
        payload.openai_api_key = settings.openai_api_key;
      }
      if (Object.keys(payload).length === 0) {
        toast.error("No changes to save");
        return;
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Image generation settings saved");
    } catch {
      toast.error("Failed to save image settings");
    } finally {
      setImageSettingsLoading(false);
    }
  };

  const saveUnsplash = async () => {
    setUnsplashLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (settings.unsplash_access_key !== MASK && settings.unsplash_access_key) {
        payload.unsplash_access_key = settings.unsplash_access_key;
      }
      if (Object.keys(payload).length === 0) {
        toast.error("No changes to save");
        return;
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Unsplash settings saved");
    } catch {
      toast.error("Failed to save Unsplash settings");
    } finally {
      setUnsplashLoading(false);
    }
  };

  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (!trimmed || interests.includes(trimmed) || interests.length >= 10) return;
    setInterests((prev) => [...prev, trimmed]);
    setInterestInput("");
  };

  const saveInterests = async () => {
    setInterestsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { areas_of_interest: interests.join(",") } }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Areas of interest saved");
    } catch {
      toast.error("Failed to save interests");
    } finally {
      setInterestsLoading(false);
    }
  };

  const update = (key: keyof SettingsState, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loadingSettings) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-slate-800 p-2.5">
          <Settings className="h-5 w-5 text-slate-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Configure your Make.com and AI integrations</p>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <span>Quick Setup Guide</span>
          {guideOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 border-t border-slate-800">
            <ol className="mt-3 space-y-2 text-sm text-slate-400 list-decimal list-inside">
              <li>
                Create a{" "}
                <a
                  href="https://make.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Make.com
                </a>
                {" "}account and set up a webhook trigger scenario — paste the webhook URL below
              </li>
              <li>
                Get an Anthropic API key at{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  console.anthropic.com/settings/keys
                </a>
              </li>
              <li>Save all settings</li>
            </ol>
          </div>
        )}
      </div>

      {/* Make.com Section */}
      <Card className="border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="rounded-md bg-violet-600/20 p-1">
              <Webhook className="h-4 w-4 text-violet-400" />
            </div>
            Make.com Integration
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Connect your Make.com scenario to publish posts to LinkedIn via webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="make_webhook_url" className="text-sm font-medium text-slate-300">Webhook URL</Label>
              {settings.make_webhook_url ? (
                <span className="text-xs font-medium text-emerald-400">Configured</span>
              ) : (
                <span className="text-xs font-medium text-amber-400">Not configured</span>
              )}
            </div>
            <Input
              id="make_webhook_url"
              value={settings.make_webhook_url}
              onChange={(e) => update("make_webhook_url", e.target.value)}
              placeholder="https://hook.eu1.make.com/..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Paste your Make.com webhook URL here. Create a webhook trigger scenario in Make.com, then paste the URL it gives you.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make_webhook_api_key" className="text-sm font-medium text-slate-300">
              API Key <span className="text-slate-500 font-normal">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                id="make_webhook_api_key"
                type={showWebhookKey ? "text" : "password"}
                value={settings.make_webhook_api_key}
                onChange={(e) => update("make_webhook_api_key", e.target.value)}
                placeholder="Required if your webhook has API Key authentication"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowWebhookKey(!showWebhookKey)}
              >
                {showWebhookKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              If your Make.com webhook has &quot;API Key authentication&quot; enabled, enter the key here. It will be sent as the <code className="text-slate-400">x-make-apikey</code> header.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={saveWebhook}
              disabled={webhookLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {webhookLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testWebhook}
              disabled={testingWebhook || !settings.make_webhook_url}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {testingWebhook ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Test Webhook
            </Button>
          </div>

          {webhookTestResult && (
            <div className={`rounded-lg px-3 py-2 text-sm ${webhookTestResult.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
              {webhookTestResult.msg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Provider Section */}
      <Card className="border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="rounded-md bg-emerald-600/20 p-1">
              <BrainCircuit className="h-4 w-4 text-emerald-400" />
            </div>
            AI Provider (Anthropic)
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Configure Claude to power your post generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic_api_key" className="text-sm font-medium text-slate-300">
              Anthropic API Key
            </Label>
            <div className="relative">
              <Input
                id="anthropic_api_key"
                type={showApiKey ? "text" : "password"}
                value={settings.anthropic_api_key}
                onChange={(e) => update("anthropic_api_key", e.target.value)}
                placeholder="sk-ant-..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Log in to{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                console.anthropic.com/settings/keys
              </a>
              {" "}→ Create Key. We recommend starting with Claude Sonnet 4.5 for the best quality/speed balance.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">Claude Model</Label>
            <Select
              value={settings.claude_model}
              onValueChange={(v) => update("claude_model", v)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="claude-sonnet-4-6" className="text-white">
                  Claude Sonnet 4.6 — Recommended
                </SelectItem>
                <SelectItem value="claude-haiku-4-5-20251001" className="text-white">
                  Claude Haiku 4.5 — Faster &amp; cheaper
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Sonnet 4.5 produces higher-quality posts. Haiku 4.5 is faster and cheaper.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testAI}
              disabled={testingAi}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {testingAi ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Test Connection
            </Button>
            <Button
              size="sm"
              onClick={saveAI}
              disabled={aiLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save AI Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Generation Section */}
      <Card className="border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="rounded-md bg-violet-600/20 p-1">
              <ImageIcon className="h-4 w-4 text-violet-400" />
            </div>
            Image Generation
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Generate images for your posts using DALL-E 3. Requires an OpenAI API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai_api_key" className="text-sm font-medium text-slate-300">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                id="openai_api_key"
                type={showOpenAIKey ? "text" : "password"}
                value={settings.openai_api_key}
                onChange={(e) => update("openai_api_key", e.target.value)}
                placeholder="sk-..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
              >
                {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Get your key at{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                platform.openai.com/api-keys
              </a>
              . Used only for DALL-E 3 image generation on the Compose page.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={saveImageSettings}
              disabled={imageSettingsLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {imageSettingsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unsplash Section */}
      <Card className="border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="rounded-md bg-teal-600/20 p-1">
              <Search className="h-4 w-4 text-teal-400" />
            </div>
            Unsplash Photo Search
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Search and attach stock photos from Unsplash to your posts. Requires an Unsplash access key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unsplash_access_key" className="text-sm font-medium text-slate-300">
              Unsplash Access Key
            </Label>
            <div className="relative">
              <Input
                id="unsplash_access_key"
                type={showUnsplashKey ? "text" : "password"}
                value={settings.unsplash_access_key}
                onChange={(e) => update("unsplash_access_key", e.target.value)}
                placeholder="Your Unsplash access key..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowUnsplashKey(!showUnsplashKey)}
              >
                {showUnsplashKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Get your access key at{" "}
              <a
                href="https://unsplash.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                unsplash.com/developers
              </a>
              . Create a new application and copy the Access Key.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={saveUnsplash}
              disabled={unsplashLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {unsplashLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Areas of Interest Section */}
      <Card className="border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="rounded-md bg-violet-600/20 p-1">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            Areas of Interest
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Define your professional interests so the Inspire Me feature generates ideas tailored to your domains.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tag chips */}
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-violet-600/20 border border-violet-700/50 px-3 py-1 text-xs text-violet-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setInterests((prev) => prev.filter((t) => t !== tag))}
                  className="text-violet-400 hover:text-white ml-0.5"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            {interests.length === 0 && (
              <p className="text-xs text-slate-500">No interests added yet.</p>
            )}
          </div>

          {/* Add input */}
          <div className="flex gap-2">
            <Input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest();
                }
              }}
              placeholder="e.g. AI/ML, Product Management, Leadership..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={interests.length >= 10}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInterest}
              disabled={!interestInput.trim() || interests.length >= 10}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
            >
              Add
            </Button>
          </div>
          {interests.length >= 10 && (
            <p className="text-xs text-slate-500">Maximum 10 interests reached.</p>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={saveInterests}
              disabled={interestsLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {interestsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card className="border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="rounded-md bg-slate-700 p-1">
              <SlidersHorizontal className="h-4 w-4 text-slate-300" />
            </div>
            General Preferences
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Default settings for post generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Default Tone</Label>
              <Select
                value={settings.default_tone}
                onValueChange={(v) => update("default_tone", v)}
              >
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
              <Label className="text-sm font-medium text-slate-300">Default Post Length</Label>
              <Select
                value={settings.default_length}
                onValueChange={(v) => update("default_length", v)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="short" className="text-white">Short (≤300 chars)</SelectItem>
                  <SelectItem value="medium" className="text-white">Medium (≤600 chars)</SelectItem>
                  <SelectItem value="long" className="text-white">Long (≤1,300 chars)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_hashtags" className="text-sm font-medium text-slate-300">
                Default Hashtag Count
              </Label>
              <Input
                id="default_hashtags"
                type="number"
                min="0"
                max="10"
                value={settings.default_hashtags}
                onChange={(e) => update("default_hashtags", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Emoji Usage</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={settings.emoji_usage === "true"}
                  onCheckedChange={(checked) => update("emoji_usage", String(checked))}
                />
                <span className="text-sm text-slate-400">
                  {settings.emoji_usage === "true" ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={savePreferences}
              disabled={prefsLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {prefsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
