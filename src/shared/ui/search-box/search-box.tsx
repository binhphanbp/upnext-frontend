"use client";

import { CaretDown, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { removeVietnameseAccents } from "@/shared/utils/natural-search";

type SearchBoxLabels = Readonly<{
  keywordPlaceholder: string;
  keywordLabel: string;
  locationPlaceholder: string;
  locationLabel: string;
  submit: string;
  suggestionsLabel: string;
  locationsLabel: string;
}>;

type SearchBoxProps = Readonly<{
  suggestions: string[];
  locations: string[];
  labels: SearchBoxLabels;
  searchPath?: string;
  className?: string;
}>;

type OpenField = "keyword" | "location" | null;

export function SearchBox({
  suggestions,
  locations,
  labels,
  searchPath = "/jobs",
  className,
}: SearchBoxProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [openField, setOpenField] = useState<OpenField>(null);
  const rootRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!openField) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenField(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenField(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openField]);

  const keywordMatches = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return suggestions.slice(0, 6);
    const unaccented = removeVietnameseAccents(query);
    return suggestions
      .filter((item) => removeVietnameseAccents(item.toLowerCase()).includes(unaccented))
      .slice(0, 6);
  }, [keyword, suggestions]);

  function submitSearch(nextKeyword = keyword) {
    const params = new URLSearchParams();
    const term = nextKeyword.trim();

    if (term) {
      params.set("keyword", term);
    }

    if (location) {
      params.set("location", location);
    }

    setOpenField(null);

    const query = params.toString();
    router.push(query ? `${searchPath}?${query}` : searchPath);
  }

  return (
    <form
      aria-label={labels.suggestionsLabel}
      className={cn(
        "relative grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_22px_60px_rgba(15,40,30,0.12)] sm:grid-cols-[minmax(0,1fr)_220px_auto]",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      ref={rootRef}
    >
      <div className="relative">
        <label className="sr-only" htmlFor="home-keyword">
          {labels.keywordLabel}
        </label>
        <div className="focus-within:ring-brand flex h-12 items-center gap-3 rounded-2xl bg-slate-50 px-4 text-slate-500 ring-1 ring-transparent transition focus-within:bg-white">
          <MagnifyingGlass size={20} />
          <input
            autoComplete="off"
            aria-label={labels.keywordLabel}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            id="home-keyword"
            onChange={(event) => setKeyword(event.target.value)}
            onFocus={() => setOpenField("keyword")}
            placeholder={labels.keywordPlaceholder}
            value={keyword}
          />
        </div>
        {openField === "keyword" && keywordMatches.length > 0 ? (
          <ul
            aria-label={labels.suggestionsLabel}
            className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          >
            {keywordMatches.map((item) => (
              <li key={item}>
                <button
                  className="upnext-focus hover:bg-brand-muted flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:text-emerald-800"
                  onClick={() => {
                    setKeyword(item);
                    submitSearch(item);
                  }}
                  type="button"
                >
                  <MagnifyingGlass size={15} />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="relative">
        <label className="sr-only" htmlFor="home-location">
          {labels.locationLabel}
        </label>
        <button
          aria-expanded={openField === "location"}
          aria-haspopup="listbox"
          className="upnext-focus hover:ring-brand flex h-12 w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-white hover:ring-1"
          id="home-location"
          onClick={() => setOpenField((current) => (current === "location" ? null : "location"))}
          type="button"
        >
          <MapPin className="text-slate-500" size={19} />
          <span className={cn("min-w-0 flex-1 truncate", !location && "text-slate-400")}>
            {location || labels.locationPlaceholder}
          </span>
          <CaretDown size={15} />
        </button>
        {openField === "location" ? (
          <ul
            aria-label={labels.locationsLabel}
            className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          >
            {locations.map((item) => (
              <li key={item}>
                <button
                  className={cn(
                    "upnext-focus hover:bg-brand-muted flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:text-emerald-800",
                    location === item && "bg-brand-muted text-emerald-800",
                  )}
                  onClick={() => {
                    setLocation(item);
                    setOpenField(null);
                  }}
                  type="button"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button className="h-12 rounded-2xl px-6" type="submit">
        <MagnifyingGlass size={19} />
        {labels.submit}
      </Button>
    </form>
  );
}
