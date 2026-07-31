"use client";

import { useEffect, useState } from "react";

import { getMyCandidateProfile, updateMyCandidateProfile } from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";

const STORAGE_KEY = "upnext.search-preference.location";
const PROMPTED_KEY = "upnext.search-preference.location-prompted";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export type LocationPreferenceSource = "profile" | "local" | "browser" | null;
export type LocationPreferenceStatus = "idle" | "loading" | "ready" | "unavailable";

type StoredLocation = {
  city: string;
  savedAt: string;
};

const CITY_ALIASES: Array<[RegExp, string]> = [
  [/^(tp\.?\s*)?(ho\s*chi\s*minh|hcm|sai\s*gon|thanh pho ho chi minh)/iu, "TP. Hồ Chí Minh"],
  [/^(tp\.?\s*)?(ha\s*noi|hanoi|thanh pho ha noi)/iu, "Hà Nội"],
  [/^(tp\.?\s*)?(da\s*nang|danang|thanh pho da nang)/iu, "Đà Nẵng"],
  [/^(tp\.?\s*)?(can\s*tho|thanh pho can tho)/iu, "Cần Thơ"],
  [/^(ba\s*r?a\s*ria\s*-?\s*)?vung\s*tau/iu, "Bà Rịa - Vũng Tàu"],
];

const CITY_TOKENS: Array<[string[], string]> = [
  [["ho chi minh", "hcm", "sai gon"], "TP. Hồ Chí Minh"],
  [["ha noi", "hanoi"], "Hà Nội"],
  [["da nang", "danang"], "Đà Nẵng"],
  [["can tho"], "Cần Thơ"],
  [["vung tau"], "Bà Rịa - Vũng Tàu"],
];

function removeVietnameseAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/đ/giu, "d")
    .trim();
}

export function normalizeSearchCity(value: string | null | undefined) {
  const raw = value?.replace(/\s+/gu, " ").trim();
  if (!raw) return null;

  const ascii = removeVietnameseAccents(raw).toLowerCase();
  const alias = CITY_ALIASES.find(([pattern]) => pattern.test(ascii));
  if (alias) return alias[1];

  const embeddedCity = CITY_TOKENS.find(([tokens]) =>
    tokens.some((token) => ascii.includes(token)),
  );
  if (embeddedCity) return embeddedCity[1];

  return raw.replace(/^(tỉnh|thành phố|city|province)\s+/iu, "").trim() || null;
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
    "accept-language": "vi",
  });
  const response = await fetch(`${NOMINATIM_URL}?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Reverse geocoding failed: ${response.status}`);

  const payload = (await response.json()) as {
    address?: Record<string, string | undefined>;
  };
  const address = payload.address ?? {};
  return normalizeSearchCity(
    address.city ?? address.town ?? address.municipality ?? address.state ?? address.province,
  );
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
