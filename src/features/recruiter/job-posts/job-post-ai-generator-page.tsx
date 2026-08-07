"use client";

import { Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getCompany, getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  extractJobPostDraft,
  generateJobPostDraft,
  getJobPostCatalogs,
  getJobPostSalaryInsight,
  type GenerateJobPostDraftPayload,
  type JobPostAiDraftResponse,
  type JobPostCatalogs,
  type JobPostSalaryInsightResponse,
} from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { FullScreenOverlay } from "@/shared/ui/full-screen-overlay";

import {
  applyPayloadFallbacks,
  buildJobPostSourceText,
  getAutofilledFieldLabels,
  getMissingDraftFields,
  mergeInferredDraft,
  MIN_INFERENCE_SOURCE_LENGTH,
} from "./job-post-ai-autofill";
import { saveJobPostAiAutofillNotice, saveJobPostAiDraft } from "./job-post-ai-draft-storage";
import { JobPostAiGeneratorForm } from "./job-post-ai-generator-form";
import {
  getDefaultSectionOrder,
  JobPostAiResult,
  type CustomJobPostSection,
} from "./job-post-ai-result";
import {
  clearJobPostAiResult,
  loadJobPostAiResult,
  saveJobPostAiResult,
} from "./job-post-ai-result-storage";
import { JobPostSalaryInsight } from "./job-post-salary-insight";

const EMPTY_CATALOGS: JobPostCatalogs = {
  categories: [],
  employmentTypes: [],
  experienceLevels: [],
  skills: [],
  specializations: [],
};

function getAiErrorMessage(t: ReturnType<typeof useTranslations>, error: unknown) {
  if (!(error instanceof ApiError)) {
    return t("jobPostsPage.aiErrors.connectionFailed");
  }
  if (error.status === 429) {
    return t("jobPostsPage.aiErrors.rateLimited");
  }
  if (error.status >= 500) {
    return t("jobPostsPage.aiErrors.busy");
  }
  return error.message || t("jobPostsPage.aiGenerator.genericError");
}

/** Measured against the real extraction endpoint: ~6s. Rounded up so the clock rarely hits zero. */
const ESTIMATED_AUTOFILL_SECONDS = 10;

function AutofillOverlay() {
  const t = useTranslations("Recruiter");
  const [remainingSeconds, setRemainingSeconds] = useState(ESTIMATED_AUTOFILL_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FullScreenOverlay>
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white px-6 py-8 shadow-xl">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
          <Sparkle size={30} weight="fill" className="relative animate-pulse text-emerald-600" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">
            {t("jobPostsPage.aiGenerator.autofillOverlayTitle")}
          </p>
          <p className="text-sm font-normal text-slate-500">
            {remainingSeconds > 0
              ? t("jobPostsPage.aiGenerator.autofillOverlayCountdown", {
                  seconds: remainingSeconds,
                })
              : t("jobPostsPage.aiGenerator.autofillOverlayFinishing")}
          </p>
        </div>
      </div>
    </FullScreenOverlay>
  );
}

function parseExperienceYears(value?: string) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const years = Number(match[0]);
  return Number.isFinite(years) && years >= 0 && years <= 50 ? years : null;
}

export function JobPostAiGeneratorPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const [token, setToken] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [catalogs, setCatalogs] = useState<JobPostCatalogs>(EMPTY_CATALOGS);
  const [companyName, setCompanyName] = useState(t("jobPostsPage.companyDefaultName"));
  const [companyDescription, setCompanyDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [salaryInsight, setSalaryInsight] = useState<JobPostSalaryInsightResponse | null>(null);
  const [isAnalyzingSalary, setIsAnalyzingSalary] = useState(false);
  const [salaryInsightError, setSalaryInsightError] = useState("");
  const [salaryExperienceYears, setSalaryExperienceYears] = useState("");
  const [generatedResult, setGeneratedResult] = useState<{
    payload: GenerateJobPostDraftPayload;
    response: JobPostAiDraftResponse;
  } | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isPreparingJobPost, setIsPreparingJobPost] = useState(false);
  // Block layout lives here rather than in the result view so it survives a reload,
  // just like the edited draft content does.
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [customSections, setCustomSections] = useState<CustomJobPostSection[]>([]);

  const loadPageData = useCallback(async () => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    setRecruiterId(session.user.id);
    const storedResult = loadJobPostAiResult(session.user.id);
    if (storedResult) {
      setGeneratedResult(storedResult.generatedResult);
      setSalaryInsight(storedResult.salaryInsight);
      setSalaryExperienceYears(storedResult.salaryExperienceYears);
      setSectionOrder(
        storedResult.sectionOrder ??
          getDefaultSectionOrder(storedResult.generatedResult.payload.presentationStyle),
      );
      setCustomSections(storedResult.customSections ?? []);
    }

    try {
      const [nextCatalogs, account] = await Promise.all([
        getJobPostCatalogs(),
        getRecruiterAccount(session.user.id, session.accessToken),
      ]);
      const company = account.company
        ? await getCompany(account.company.id, session.accessToken)
        : null;

      setCatalogs(nextCatalogs);
      setCompanyName(
        company?.name ?? account.company?.name ?? t("jobPostsPage.companyDefaultName"),
      );
      setCompanyDescription(company?.description ?? "");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearRecruiterSession();
        router.replace("/recruiter/login");
        return;
      }
      setErrorMessage(t("jobPostsPage.aiGenerator.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!recruiterId || !generatedResult) return;

    saveJobPostAiResult(recruiterId, {
      generatedResult,
      salaryInsight,
      salaryExperienceYears,
      sectionOrder,
      customSections,
    });
  }, [
    customSections,
    generatedResult,
    recruiterId,
    salaryExperienceYears,
    salaryInsight,
    sectionOrder,
  ]);

  const hasGeneratedResult = Boolean(generatedResult);

  useEffect(() => {
    if (!hasGeneratedResult) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setIsExitDialogOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasGeneratedResult]);

  const handleSubmit = async (payload: GenerateJobPostDraftPayload) => {
    if (!token) return false;

    setErrorMessage("");
    setSalaryInsight(null);
    setSalaryInsightError("");
    setIsSubmitting(true);
    try {
      const response = await generateJobPostDraft(payload, token);
      setGeneratedResult({ payload, response });
      // A fresh draft starts from that layout's default order with no leftover custom blocks.
      setSectionOrder(getDefaultSectionOrder(payload.presentationStyle));
      setCustomSections([]);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("main.overflow-y-auto")?.scrollTo({ top: 0 });
        window.scrollTo({ top: 0 });
      });
      const experienceYears = parseExperienceYears(payload.yearsOfExperience);
      setSalaryExperienceYears(experienceYears === null ? "" : String(experienceYears));
      if (experienceYears !== null) {
        void analyzeSalary(response, experienceYears, payload);
      }
      return false;
    } catch (error) {
      setErrorMessage(getAiErrorMessage(t, error));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => router.push("/recruiter/job-posts/create");

  const handleExit = () => {
    if (recruiterId) {
      clearJobPostAiResult(recruiterId);
    }
    setIsExitDialogOpen(false);
    router.push("/recruiter/job-posts");
  };

  const handleDraftChange = (patch: Partial<JobPostAiDraftResponse["draft"]>) => {
    setGeneratedResult((current) =>
      current
        ? {
            ...current,
            response: { ...current.response, draft: { ...current.response.draft, ...patch } },
          }
        : null,
    );
  };

  const handlePayloadChange = (patch: Partial<GenerateJobPostDraftPayload>) => {
    setGeneratedResult((current) =>
      current ? { ...current, payload: { ...current.payload, ...patch } } : null,
    );
  };

  const handleSuggestionsChange = (patch: Partial<JobPostAiDraftResponse["suggestions"]>) => {
    setGeneratedResult((current) =>
      current
        ? {
            ...current,
            response: {
              ...current.response,
              suggestions: { ...current.response.suggestions, ...patch },
            },
          }
        : null,
    );
  };

  const analyzeSalary = async (
    response = generatedResult?.response,
    requestedExperienceYears?: number,
    sourcePayload = generatedResult?.payload,
  ) => {
    const experienceYears =
      requestedExperienceYears ??
      (salaryExperienceYears.trim() === "" ? Number.NaN : Number(salaryExperienceYears));
    if (
      !token ||
      !response ||
      !Number.isFinite(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 50
    ) {
      return;
    }
    const requiredSkillIds = sourcePayload?.requiredSkillIds ?? [];
    const relatedSkillIds = sourcePayload?.preferredSkillIds ?? [];
    const skillKeywords = sourcePayload?.keywords ?? [];

    setSalaryInsightError("");
    setIsAnalyzingSalary(true);
    try {
      const insight = await getJobPostSalaryInsight(
        {
          title: response.draft.title,
          description: response.draft.description,
          yearsOfExperience: experienceYears,
          ...(response.draft.requirements ? { requirements: response.draft.requirements } : {}),
          ...(response.draft.jobCategoryId ? { jobCategoryId: response.draft.jobCategoryId } : {}),
          ...(response.draft.experienceLevelId
            ? { experienceLevelId: response.draft.experienceLevelId }
            : {}),
          ...(response.draft.skillIds.length ? { skillIds: response.draft.skillIds } : {}),
          ...(requiredSkillIds.length ? { requiredSkillIds } : {}),
          ...(relatedSkillIds.length ? { relatedSkillIds } : {}),
          ...(skillKeywords.length ? { skillKeywords } : {}),
          ...(response.draft.salaryMin !== null
            ? { currentSalaryMin: response.draft.salaryMin }
            : {}),
          ...(response.draft.salaryMax !== null
            ? { currentSalaryMax: response.draft.salaryMax }
            : {}),
        },
        token,
      );
      setSalaryInsight(insight);
    } catch (error) {
      setSalaryInsightError(getAiErrorMessage(t, error));
    } finally {
      setIsAnalyzingSalary(false);
    }
  };

  const applySuggestedSalary = () => {
    if (!salaryInsight?.available) return;

    setGeneratedResult((current) =>
      current
        ? {
            ...current,
            response: {
              ...current.response,
              draft: {
                ...current.response.draft,
                salaryMin: salaryInsight.recommended.salaryMin,
                salaryMax: salaryInsight.recommended.salaryMax,
                salaryPeriod: "MONTH",
                salaryIsNegotiable: false,
                salaryIsVisible: true,
              },
            },
          }
        : null,
    );
  };

  /**
   * Hands the JD over to the recruiter form. Anything the generator left blank — category, level,
   * employment type, schooling, schedule, skills — is inferred from the JD body first, so the
   * create screen opens filled in rather than with a row of empty selects.
   */
  const createJobPostFromResult = async () => {
    if (!generatedResult) return;

    const original = generatedResult.response;
    // Cheap and certain first: whatever the recruiter picked on the AI form. Only what is still
    // blank after that is worth a round trip to the model.
    let response = applyPayloadFallbacks(original, generatedResult.payload);
    const missingFields = getMissingDraftFields(response.draft);

    const sourceText = buildJobPostSourceText({
      payload: generatedResult.payload,
      response,
      catalogs,
      customSections,
      companyName,
    });

    if (missingFields.length > 0 && token && sourceText.length >= MIN_INFERENCE_SOURCE_LENGTH) {
      setIsPreparingJobPost(true);
      try {
        const inferred = await extractJobPostDraft(sourceText, token);
        const merged = mergeInferredDraft(response, inferred);
        // Diff against the untouched generator output so the notice also credits the fields the
        // payload fallback recovered, not only the ones the model guessed.
        saveJobPostAiAutofillNotice(getAutofilledFieldLabels(original, merged));
        response = merged;
      } catch (error) {
        setIsPreparingJobPost(false);
        // Inference is a convenience, not a gate — but a silent failure looks like the feature
        // never ran, so the recruiter gets to decide whether to continue and fill the rest by hand.
        const proceed = await Swal.fire({
          icon: "warning",
          title: t("jobPostsPage.aiGenerator.exitDialogTitle"),
          text: t("jobPostsPage.aiGenerator.exitDialogText", {
            message: getAiErrorMessage(t, error),
          }),
          showCancelButton: true,
          confirmButtonText: t("jobPostsPage.aiGenerator.exitDialogConfirm"),
          cancelButtonText: t("jobPostsPage.aiGenerator.exitDialogCancel"),
          confirmButtonColor: "#059669",
        });
        if (!proceed.isConfirmed) return;
        saveJobPostAiAutofillNotice(getAutofilledFieldLabels(original, response));
      } finally {
        setIsPreparingJobPost(false);
      }
    } else {
      saveJobPostAiAutofillNotice(getAutofilledFieldLabels(original, response));
    }

    saveJobPostAiDraft(response);
    router.push("/recruiter/job-posts/create?aiDraft=1");
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-[520px] animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <main className="space-y-4 pb-10">
      {isPreparingJobPost ? <AutofillOverlay /> : null}

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-normal text-rose-700"
        >
          <Sparkle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {generatedResult ? (
        <JobPostAiResult
          companyName={companyName}
          catalogs={catalogs}
          payload={generatedResult.payload}
          response={generatedResult.response}
          onCreateJobPost={() => void createJobPostFromResult()}
          isCreatingJobPost={isPreparingJobPost}
          onExit={handleExit}
          isExitDialogOpen={isExitDialogOpen}
          onExitDialogOpenChange={setIsExitDialogOpen}
          onDraftChange={handleDraftChange}
          onPayloadChange={handlePayloadChange}
          onSuggestionsChange={handleSuggestionsChange}
          sectionOrder={sectionOrder}
          onSectionOrderChange={setSectionOrder}
          customSections={customSections}
          onCustomSectionsChange={setCustomSections}
          aside={
            <JobPostSalaryInsight
              insight={salaryInsight}
              isLoading={isAnalyzingSalary}
              errorMessage={salaryInsightError}
              experienceYears={salaryExperienceYears}
              canAnalyze={
                salaryExperienceYears.trim() !== "" &&
                Number.isFinite(Number(salaryExperienceYears)) &&
                Number(salaryExperienceYears) >= 0 &&
                Number(salaryExperienceYears) <= 50
              }
              onExperienceYearsChange={(value) => {
                setSalaryExperienceYears(value);
                setSalaryInsight(null);
                setSalaryInsightError("");
              }}
              onAnalyze={() => void analyzeSalary()}
              onApply={salaryInsight?.available ? applySuggestedSalary : undefined}
            />
          }
        />
      ) : (
        <JobPostAiGeneratorForm
          catalogs={catalogs}
          companyDescription={companyDescription}
          isSubmitting={isSubmitting}
          onCancel={goBack}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
