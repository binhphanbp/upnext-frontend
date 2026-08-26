"use client";

import { Check, MagnifyingGlass, Tag, X, CaretDown } from "@phosphor-icons/react";
import { useState, useRef, useEffect, useMemo } from "react";

import { type AdminPostTag } from "@/features/admin/api/posts";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";

export interface TagMultiSelectProps {
  tags: AdminPostTag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
}

export function TagMultiSelect({
  tags,
  selectedTagIds,
  onChange,
  placeholder = "Chọn thẻ (tags)...",
}: TagMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const query = searchQuery.toLowerCase().trim();
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [tags, searchQuery]);

  const selectedTags = useMemo(() => {
    const map = new Map(tags.map((t) => [t.id, t]));
    return selectedTagIds.map((id) => map.get(id)).filter(Boolean) as AdminPostTag[];
  }, [tags, selectedTagIds]);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const clearAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm transition-all cursor-pointer flex items-center justify-between gap-2 select-none",
          isOpen
            ? "border-emerald-500 ring-1 ring-emerald-500 shadow-xs"
            : "border-slate-200 hover:border-slate-300",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800"
              >
                <Tag size={12} className="shrink-0 text-emerald-600" />
                <span className="max-w-[120px] truncate">{tag.name}</span>
                <button
                  type="button"
                  onClick={(e) => removeTag(tag.id, e)}
                  className="rounded-full p-0.5 text-emerald-600 transition-colors hover:bg-emerald-200/60 hover:text-emerald-900"
                  aria-label={`Xóa thẻ ${tag.name}`}
                >
                  <X size={10} weight="bold" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs font-medium text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-slate-400">
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
              title="Xóa tất cả thẻ đã chọn"
            >
              <X size={13} />
            </button>
          )}
          <CaretDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              isOpen && "rotate-180 text-emerald-600",
            )}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="animate-in fade-in-50 zoom-in-95 absolute top-full left-0 z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {/* Search Box */}
          <div className="relative mb-2">
            <MagnifyingGlass
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thẻ..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Tag List */}
          <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1">
            {filteredTags.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">Không tìm thấy thẻ phù hợp</p>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs cursor-pointer select-none transition-colors",
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {isSelected && <Check size={10} weight="bold" />}
                      </div>
                      <span className="truncate">{tag.name}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-1 pt-2 text-[11px] text-slate-500">
            <span>
              Đã chọn: <strong className="text-emerald-700">{selectedTagIds.length}</strong> /{" "}
              {tags.length} thẻ
            </span>
            {selectedTagIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-medium text-rose-600 hover:underline"
              >
                Bỏ chọn hết
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
