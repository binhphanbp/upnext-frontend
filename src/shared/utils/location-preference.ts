"use client";

import { useEffect, useState } from "react";

import { getMyCandidateProfile, updateMyCandidateProfile } from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";
import { resolveProvinceName, toProvinceSearchLabel } from "@/shared/utils/vietnam-provinces";

// `.v2` because the previous key holds district-level values ("Thủ Đức", "Biên Hòa") cached by the
// version of this module that read Nominatim's `city` field. Those can no longer be lifted to a
// province, so the key is bumped instead of migrated.
const STORAGE_KEY = "upnext.search-preference.location.v2";
const PROMPTED_KEY = "upnext.search-preference.location-prompted";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export type LocationPreferenceSource = "profile" | "local" | "browser" | null;
export type LocationPreferenceStatus = "idle" | "loading" | "ready" | "unavailable";

type StoredLocation = {
  city: string;
  savedAt: string;
};

function normalizeFreeFormCity(value: string) {
  return value.replace(/^(tỉnh|thành phố|city|province)\s+/iu, "").trim() || null;
}

/**
 * Every search surface filters by province, so a location only counts once it has been resolved
 * up to the province it belongs to: a district, a ward, or a street address must not leak through
 * as the search value.
 */
export function normalizeSearchCity(value: string | null | undefined) {
  const raw = value?.replace(/\s+/gu, " ").trim();
  if (!raw) return null;

  const province = resolveProvinceName(raw);
  if (province) return toProvinceSearchLabel(province);

  return normalizeFreeFormCity(raw);
}

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLocation>;
    const city = normalizeSearchCity(parsed.city);
    return city ? { city, savedAt: parsed.savedAt ?? new Date().toISOString() } : null;
  } catch {
    return null;
  }
}

function writeStoredLocation(city: string) {
  const value: StoredLocation = { city, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function hasPromptedForLocation() {
  return sessionStorage.getItem(PROMPTED_KEY) === "1";
}

function markLocationPrompted() {
  sessionStorage.setItem(PROMPTED_KEY, "1");
}

function browserLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 15 * 60 * 1000,
      timeout: 10_000,
    });
  });
}

async function reverseGeocode(latitude: number, longitude: number) {
  const query = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    "accept-language": "vi",
  });
  const response = await fetch(`${NOMINATIM_URL}?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Reverse geocoding failed: ${response.status}`);

  const payload = (await response.json()) as {
    address?: Record<string, string | undefined>;
    display_name?: string;
  };
  const address = payload.address ?? {};

  // Nominatim reports Vietnamese provinces under `state`, and puts a district-level unit (Thu Duc,
  // Bien Hoa, ...) in `city`/`town`. Reading `city` first is what made the search box fill with a
  // district instead of the province the job listings are tagged with, so the province-level keys
  // are read first and the smaller units only serve as a fallback for the few places Nominatim
  // leaves `state` empty.
  const candidates = [
    address.state,
    address.province,
    address.region,
    address.city,
    address.municipality,
    address.town,
    address.county,
    payload.display_name,
  ];

  for (const candidate of candidates) {
    const city = normalizeProvinceCandidate(candidate);
    if (city) return city;
  }

  return null;
}

function normalizeProvinceCandidate(value: string | undefined) {
  const province = resolveProvinceName(value);
  return province ? toProvinceSearchLabel(province) : null;
}

async function resolveFromBrowser() {
  const position = await browserLocation();
  return reverseGeocode(position.coords.latitude, position.coords.longitude);
}

export function useLocationPreference() {
  const [location, setLocation] = useState<string | null>(null);
  const [source, setSource] = useState<LocationPreferenceSource>(null);
  const [status, setStatus] = useState<LocationPreferenceStatus>("idle");

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setStatus("loading");
      const session = getCandidateSession();

      if (session) {
        try {
          const profile = await getMyCandidateProfile(session.accessToken);
          const profileCity = normalizeSearchCity(profile.preferredSearchCity ?? profile.address);
          if (profileCity) {
            if (!cancelled) {
              setLocation(profileCity);
              setSource("profile");
              setStatus("ready");
            }
            if (!profile.preferredSearchCity) {
              void updateMyCandidateProfile(session.accessToken, {
                preferredSearchCity: profileCity,
              }).catch(() => undefined);
            }
            return;
          }
        } catch {
          // A stale/expired session must not prevent anonymous search from working.
        }
      } else {
        const local = readStoredLocation();
        if (local) {
          if (!cancelled) {
            setLocation(local.city);
            setSource("local");
            setStatus("ready");
          }
          return;
        }
      }

      if (hasPromptedForLocation()) {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      try {
        markLocationPrompted();
        const browserCity = await resolveFromBrowser();
        if (cancelled) return;
        if (!browserCity) {
          setStatus("unavailable");
          return;
        }

        setLocation(browserCity);
        setSource("browser");
        setStatus("ready");
        writeStoredLocation(browserCity);

        if (session) {
          void updateMyCandidateProfile(session.accessToken, {
            preferredSearchCity: browserCity,
          }).catch(() => undefined);
        }
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location, source, status };
}

export function clearStoredSearchLocation() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}
