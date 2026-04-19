"use client";

import { useState, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UnsplashPhoto {
  id: string;
  thumb_url: string;
  full_url: string;
  photographer_name: string;
  photographer_link: string;
  download_location: string;
}

export interface UnsplashSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageData: string, imageMimeType: string) => void;
}

type ModalState = "idle" | "searching" | "results" | "attaching";

export function UnsplashSearchModal({ open, onClose, onSelect }: UnsplashSearchModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setState("searching");
    try {
      const res = await fetch("/api/images/unsplash/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json() as { photos?: UnsplashPhoto[]; error?: string };
      if (!res.ok) {
        toast.error(data.error || "Search failed");
        setState("idle");
        return;
      }
      setPhotos(data.photos || []);
      setState("results");
    } catch {
      toast.error("Search failed");
      setState("idle");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectPhoto = async (photo: UnsplashPhoto) => {
    setAttachingId(photo.id);
    setState("attaching");
    try {
      const res = await fetch("/api/images/unsplash/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_url: photo.full_url, download_location: photo.download_location }),
      });
      const data = await res.json() as { image_data?: string; image_mime_type?: string; error?: string };
      if (!res.ok || !data.image_data) {
        toast.error(data.error || "Failed to attach photo");
        setState("results");
        setAttachingId(null);
        return;
      }
      onSelect(data.image_data, data.image_mime_type ?? "image/jpeg");
      // Reset state for next open
      setState("idle");
      setQuery("");
      setPhotos([]);
      setAttachingId(null);
    } catch {
      toast.error("Failed to attach photo");
      setState("results");
      setAttachingId(null);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      // Reset internal state when closing
      setState("idle");
      setQuery("");
      setPhotos([]);
      setAttachingId(null);
    }
  };

  const isSearching = state === "searching";
  const isAttaching = state === "attaching";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-400" />
            Search Unsplash
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for photos..."
            disabled={isSearching || isAttaching}
            className="bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching || isAttaching}
            className="bg-teal-600 hover:bg-teal-700 shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {state === "idle" && (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-400 dark:text-slate-500 text-sm">Search for photos to get started</p>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center h-48 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
              <span className="text-gray-500 dark:text-slate-400 text-sm">Searching...</span>
            </div>
          )}

          {(state === "results" || isAttaching) && photos.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-400 dark:text-slate-500 text-sm">No photos found for your query</p>
            </div>
          )}

          {(state === "results" || isAttaching) && photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pr-1">
              {photos.map((photo) => {
                const isThisAttaching = attachingId === photo.id;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleSelectPhoto(photo)}
                    disabled={isAttaching}
                    className="group relative rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700 hover:border-teal-500 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumb_url}
                        alt={`Photo by ${photo.photographer_name}`}
                        className="w-full h-36 object-cover"
                      />
                      {isThisAttaching && (
                        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                        </div>
                      )}
                      {!isThisAttaching && (
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <a
                        href={photo.photographer_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 truncate block"
                      >
                        {photo.photographer_name}
                      </a>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Attribution footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 pt-3">
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
            Photos from{" "}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300"
            >
              Unsplash
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
