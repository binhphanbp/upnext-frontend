import { useState, useEffect, useCallback, useRef } from "react";

import { ApiError } from "@/shared/api/http";

import {
  runCvScreening,
  cancelCvScreeningRun,
  getCvScreeningRun,
  getCvScreeningResults,
  type CvScreeningResultItem,
  type RunStatus,
} from "../api/cv-screening-api";

export function useCvScreening(token: string, onUnauthorized?: () => void) {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [progress, setProgress] = useState<{
    processedCount: number;
    totalApplications: number;
    failedCount: number;
  } | null>(null);
  const [results, setResults] = useState<CvScreeningResultItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFiltered, setHasFiltered] = useState(false);
  /** True from the moment "Hủy" is clicked until the run actually reaches
   * CANCELLED -- the in-flight Gemini batch is always let to finish, so this
   * can outlast the click by a few seconds. */
  const [isCancelling, setIsCancelling] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Left over from when screening only scored a "Top N" subset.
      sessionStorage.removeItem("upnext_rankingTempLimit");

      const savedJobId = sessionStorage.getItem("upnext_rankingTempJobId");
      const savedResults = sessionStorage.getItem("upnext_rankingResults");
      const savedHasFiltered = sessionStorage.getItem("upnext_rankingHasFiltered");
      const savedRunId = sessionStorage.getItem("upnext_rankingRunId");
      const savedRunStatus = sessionStorage.getItem("upnext_rankingRunStatus");

      if (savedJobId) setSelectedJobId(savedJobId);
      if (savedHasFiltered === "true") setHasFiltered(true);
      if (savedRunId) setRunId(savedRunId);
      if (savedRunStatus) setRunStatus(savedRunStatus as RunStatus);
      if (savedResults) {
        try {
          setResults(JSON.parse(savedResults));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedJobId) sessionStorage.setItem("upnext_rankingTempJobId", selectedJobId);
      sessionStorage.setItem("upnext_rankingHasFiltered", String(hasFiltered));
      if (runId) {
        sessionStorage.setItem("upnext_rankingRunId", runId);
      } else {
        sessionStorage.removeItem("upnext_rankingRunId");
      }
      if (runStatus) {
        sessionStorage.setItem("upnext_rankingRunStatus", runStatus);
      } else {
        sessionStorage.removeItem("upnext_rankingRunStatus");
      }
      if (results.length > 0) {
        sessionStorage.setItem("upnext_rankingResults", JSON.stringify(results));
      } else {
        sessionStorage.removeItem("upnext_rankingResults");
      }
    }
  }, [selectedJobId, hasFiltered, runId, runStatus, results]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(
    async (currentRunId: string) => {
      if (!token) return;
      try {
        const data = await getCvScreeningResults(currentRunId, token);
        setResults(data);
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized?.();
          return;
        }
        console.error("Failed to fetch results:", err);
        setError(err.message || "Không thể lấy kết quả xếp hạng.");
      }
    },
    [token, onUnauthorized],
  );

  const pollRun = useCallback(
    async (currentRunId: string) => {
      if (!token) return;
      try {
        const runData = await getCvScreeningRun(currentRunId, token);
        setRunStatus(runData.status);
        setProgress({
          processedCount: runData.processedCount,
          totalApplications: runData.totalApplications,
          failedCount: runData.failedCount,
        });

        if (
          runData.status === "COMPLETED" ||
          runData.status === "PARTIAL_FAILED" ||
          runData.status === "CANCELLED"
        ) {
          setIsRunning(false);
          setIsCancelling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          // A cancelled run may still have scored some CVs before it stopped
          // -- show whatever exists instead of an empty table.
          await fetchResults(currentRunId);
        } else if (runData.status === "FAILED") {
          setIsRunning(false);
          setIsCancelling(false);
          setError(runData.errorMessage || "Lọc xếp hạng thất bại.");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) {
          setIsRunning(false);
          onUnauthorized?.();
          return;
        }
        console.error("Error polling run status:", err);
      }
    },
    [token, fetchResults, onUnauthorized],
  );

  const startScreening = useCallback(
    async (limit?: number) => {
      if (!selectedJobId) {
        setError("Vui lòng chọn tin tuyển dụng.");
        return;
      }
      if (!token) return;

      setIsRunning(true);
      setIsCancelling(false);
      setError(null);
      setResults([]);
      setRunId(null);
      setRunStatus("PENDING");
      setProgress(null);
      setHasFiltered(true);

      try {
        // `limit` (Top 10/20) makes the backend rank by embedding similarity
        // to the job description first, then only send that shortlist to the
        // slow, metered AI scorer -- omitting it scores every application.
        const res = await runCvScreening(
          limit ? { jobPostId: selectedJobId, limit } : { jobPostId: selectedJobId },
          token,
        );

        setRunId(res.runId);
        setRunStatus(res.status);

        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => {
          void pollRun(res.runId);
        }, 2500);
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) {
          setIsRunning(false);
          setRunStatus(null);
          onUnauthorized?.();
          return;
        }
        console.error("Failed to start CV screening:", err);
        setIsRunning(false);
        setRunStatus("FAILED");
        setError(err.message || "Không thể chạy xếp hạng CV. Vui lòng thử lại.");
      }
    },
    [selectedJobId, token, pollRun, onUnauthorized],
  );

  // Resume polling on mount if a run is running
  useEffect(() => {
    if (runId && (runStatus === "PENDING" || runStatus === "PROCESSING")) {
      setIsRunning(true);
      pollIntervalRef.current = setInterval(() => {
        void pollRun(runId);
      }, 2500);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [runId, runStatus, pollRun]);

  const cancelScreening = useCallback(async () => {
    if (!runId || !token) return;

    setIsCancelling(true);
    try {
      await cancelCvScreeningRun(runId, token);
      // Poll immediately instead of waiting up to 2.5s for the next tick --
      // a PENDING run cancels instantly server-side, so the button should
      // feel instant too. A PROCESSING run stays running until its in-flight
      // batch finishes; the regular poll interval catches that transition.
      await pollRun(runId);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setIsCancelling(false);
        onUnauthorized?.();
        return;
      }
      console.error("Failed to cancel CV screening:", err);
      setIsCancelling(false);
      setError(err.message || "Không thể hủy lọc xếp hạng. Vui lòng thử lại.");
    }
  }, [runId, token, pollRun, onUnauthorized]);

  const reset = useCallback(() => {
    setResults([]);
    setRunId(null);
    setRunStatus(null);
    setProgress(null);
    setError(null);
    setHasFiltered(false);
    setIsRunning(false);
    setIsCancelling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    selectedJobId,
    setSelectedJobId,
    runId,
    runStatus,
    progress,
    results,
    isRunning,
    isCancelling,
    error,
    hasFiltered,
    startScreening,
    cancelScreening,
    reset,
  };
}
