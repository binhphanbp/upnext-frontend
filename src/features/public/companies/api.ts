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

export type PublicCompanyReview = Readonly<{
  id: string;
  overallRating: number;
  summary: string | null;
  overtimeSatisfaction: number | null;
  overtimeReason: string | null;
  whatILove: string | null;
  improvementSuggestion: string | null;
  salaryBenefitsRating: number | null;
  trainingLearningRating: number | null;
  managementCareRating: number | null;
  cultureFunRating: number | null;
  officeWorkspaceRating: number | null;
  createdAt: string;
  /** Reviews are attributed: the reviewer's name is shown, and nothing else from their profile. */
  reviewer: { id: string; fullName: string };
}>;

export type CompanyReviewSummary = Readonly<{
  totalReviews: number;
  averageOverallRating: number | null;
  averageBySection: Readonly<{
    salaryBenefits: number | null;
    trainingLearning: number | null;
    managementCare: number | null;
    cultureFun: number | null;
    officeWorkspace: number | null;
    overtimeSatisfaction: number | null;
  }>;
}>;

export type CompanyReviewsResponse = Readonly<{
  items: PublicCompanyReview[];
  summary: CompanyReviewSummary;
}>;

export function getPublicCompanyReviews(companyId: string) {
  return apiRequest<CompanyReviewsResponse>(`/companies/${encodeURIComponent(companyId)}/reviews`);
}
