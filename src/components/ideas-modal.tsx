"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Idea {
  title: string;
  description: string;
}

interface FollowUp {
  title: string;
  description: string;
  basedOn: string;
}

export interface IdeasModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (topic: string) => void;
}

type ModalState = "loading" | "results" | "error";

export function IdeasModal({ open, onClose, onSelect }: IdeasModalProps) {
  const [state, setState] = useState<ModalState>("loading");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchIdeas = async () => {
    setState("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/ideas", { method: "POST" });
      const data = await res.json() as { ideas?: Idea[]; followUps?: FollowUp[]; error?: string };
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to generate ideas");
        setState("error");
        return;
      }
      setIdeas(data.ideas || []);
      setFollowUps(data.followUps || []);
      setState("results");
    } catch {
      setErrorMessage("Failed to connect to the server");
      setState("error");
    }
  };

  useEffect(() => {
    if (open) {
      void fetchIdeas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleSelect = (title: string) => {
    onSelect(title);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Inspire Me
          </DialogTitle>
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto min-h-[200px] pr-1">
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              <span className="text-slate-400 text-sm">Generating ideas...</span>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <p className="text-red-400 text-sm text-center">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchIdeas()}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Retry
              </Button>
            </div>
          )}

          {state === "results" && (
            <div className="space-y-5">
              {/* Fresh Ideas */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Fresh Ideas
                </h3>
                <div className="space-y-2">
                  {ideas.map((idea, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(idea.title)}
                      className="w-full text-left rounded-lg border border-violet-800/50 bg-slate-800/60 hover:bg-slate-800 hover:border-violet-600 transition-colors p-3 group"
                    >
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm leading-snug group-hover:text-violet-200 transition-colors">
                            {idea.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            {idea.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue a Thread — only shown when follow-ups exist */}
              {followUps.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Continue a Thread
                  </h3>
                  <div className="space-y-2">
                    {followUps.map((followUp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(followUp.title)}
                        className="w-full text-left rounded-lg border border-emerald-800/50 bg-slate-800/60 hover:bg-slate-800 hover:border-emerald-600 transition-colors p-3 group"
                      >
                        <div className="flex items-start gap-2.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm leading-snug group-hover:text-emerald-200 transition-colors">
                              {followUp.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {followUp.description}
                            </p>
                            {followUp.basedOn && (
                              <p className="text-xs text-emerald-500/70 mt-1 italic">
                                Based on: {followUp.basedOn}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Regenerate button */}
        {state === "results" && (
          <div className="border-t border-slate-800 pt-3 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchIdeas()}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Regenerate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
