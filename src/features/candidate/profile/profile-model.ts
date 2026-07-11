import type { CandidateProfileApi } from "@/features/candidate/api/profile";

export const profileSectionIds = [
  "overview",
  "experience",
  "projects",
  "education",
  "skills",
  "credentials",
  "documents",
  "preferences",
] as const;

export type ProfileSectionId = (typeof profileSectionIds)[number];

export type ReadinessCriterionId =
  | "basics"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "preferences"
  | "documents";

export type ProfileReadinessItem = Readonly<{
  id: ReadinessCriterionId;
  complete: boolean;
  section: ProfileSectionId;
}>;

export type ProfileReadiness = Readonly<{
  completed: number;
  percentage: number;
  items: ProfileReadinessItem[];
  total: number;
}>;

export function isProfileSectionId(value: string | null): value is ProfileSectionId {
  return profileSectionIds.some((section) => section === value);
}

export function getProfileReadiness(
  profile: CandidateProfileApi,
  hasDefaultResume: boolean,
): ProfileReadiness {
  const items: ProfileReadinessItem[] = [
    {
      id: "basics",
      complete: hasText(profile.phoneNumber) && hasText(profile.address),
      section: "overview",
    },
    {
      id: "summary",
      complete: (profile.description?.trim().length ?? 0) >= 80,
      section: "overview",
    },
    {
      id: "experience",
      complete: profile.experiences.length > 0,
      section: "experience",
    },
    {
      id: "skills",
      complete: profile.skills.length > 0,
      section: "skills",
    },
    {
      id: "education",
      complete: profile.educations.length > 0,
      section: "education",
    },
    {
      id: "preferences",
      complete:
        hasText(profile.jobPreference?.desiredPosition) &&
        profile.jobPreference?.workingModel !== null,
      section: "preferences",
    },
    {
      id: "documents",
      complete: hasDefaultResume,
      section: "documents",
    },
  ];
  const completed = items.filter((item) => item.complete).length;

  return {
    completed,
    items,
    percentage: Math.round((completed / items.length) * 100),
    total: items.length,
  };
}

export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/u).filter(Boolean);

  if (parts.length === 0) return "UN";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  return `${parts[0]![0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function splitTechnologies(value: string | null | undefined) {
  if (!value) return [];

  return value
    .split(",")
    .map((technology) => technology.trim())
    .filter(Boolean);
}

export function sortByOrder<TItem extends { sortOrder: number }>(items: readonly TItem[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder);
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}
