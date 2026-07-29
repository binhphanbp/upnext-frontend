import { apiRequest } from "@/shared/api/http";

type PublicFile = {
  id: string;
  publicUrl: string | null;
};

type PublicCompanyJob = {
  id: string;
  title: string;
  slug: string;
  status: string;
  moderationStatus: string;
  isHidden: boolean;
  salaryMin: string | number | null;
  salaryMax: string | number | null;
  salaryCurrency: string;
  salaryIsNegotiable: boolean;
  salaryIsVisible: boolean;
  publishedAt: string | null;
  expiredAt: string | null;
  description?: string | null;
  experienceLevel?: {
    name: string;
  } | null;
  jobPostLocations?: Array<{
    jobLocation: {
      city: string | null;
      district: string | null;
      address: string | null;
    };
  }>;
  jobPostSkills?: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
};

export type PublicCompanyProfile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  taxCode: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  benefits: string | null;
  companySize: string | null;
  workingDays: string | null;
  verificationStatus: string;
  createdAt: string;
  logoUrl?: string | null;
  logoFile: PublicFile | null;
  coverFile: PublicFile | null;
  photos: PublicFile[];
  jobPosts: PublicCompanyJob[];
};

export function getPublicCompanyProfile(slug: string) {
  return apiRequest<PublicCompanyProfile>(`/companies/${encodeURIComponent(slug)}`);
}
