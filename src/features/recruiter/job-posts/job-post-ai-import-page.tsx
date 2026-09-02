"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";

import { resolveAiError } from "./ai-error-message";
import { extractJobPostDraft, extractJobPostDraftFile } from "./api";
import { saveJobPostAiDraft } from "./job-post-ai-draft-storage";
import { JobPostAiImport } from "./job-post-ai-import";
import {
  fileSignature,
  payloadSignature,
  releaseRequestKey,
  stableRequestKey,
} from "./job-post-ai-request-key";

export function JobPostAiImportPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const [token, setToken] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }
    setToken(session.accessToken);
  }, [router]);

  const getAiErrorMessage = (error: unknown) => {
    const resolved = resolveAiError(error);
    // Chỉ 401 mới xoá session. Trước đây nhánh này bắt cả 403, nên hết lượt AI hoặc
    // gói không có tính năng cũng làm recruiter bị đăng xuất giữa lúc upload JD.
    if (resolved.signOut) {
      clearRecruiterSession();
      router.replace("/recruiter/login");
    }
    return resolved.fallbackMessage ?? t(resolved.messageKey);
  };

  const handleExtracted = (response: Parameters<typeof saveJobPostAiDraft>[0]) => {
    saveJobPostAiDraft(response);
    router.push("/recruiter/job-posts/create?aiDraft=1");
  };

  const handleExtractText = async (text: string) => {
    if (!token) return false;
    setErrorMessage("");
    setIsExtracting(true);
    const signature = payloadSignature("extract-text", text);
    try {
      const response = await extractJobPostDraft(text, token, stableRequestKey(signature));
      releaseRequestKey(signature);
      handleExtracted(response);
      return true;
    } catch (error) {
      setErrorMessage(getAiErrorMessage(error));
      return false;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractFile = async (file: File) => {
    if (!token) return false;
    setErrorMessage("");
    setIsExtracting(true);
    const signature = fileSignature("extract-file", file);
    try {
      const response = await extractJobPostDraftFile(file, token, stableRequestKey(signature));
      releaseRequestKey(signature);
      handleExtracted(response);
      return true;
    } catch (error) {
      setErrorMessage(getAiErrorMessage(error));
      return false;
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <JobPostAiImport
      isSubmitting={isExtracting}
      onExtractFile={handleExtractFile}
      onExtractText={handleExtractText}
      onStartFromScratch={() => router.push("/recruiter/job-posts/create")}
      onOpenGenerator={() => router.push("/recruiter/job-posts/create/ai")}
      externalError={errorMessage}
    />
  );
}
