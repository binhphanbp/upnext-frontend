"use client";

import { useEffect, useState } from "react";

import {
  getRecruiterJobPostPreview,
  type RecruiterJobPostPreviewPayload,
} from "@/features/recruiter/job-posts/job-post-preview-storage";
import { RecruiterJobPostPreview } from "@/features/recruiter/job-posts/recruiter-job-post-preview";
import { useRouter } from "@/i18n/navigation";

import { PublicFooter } from "../shared/public-footer";
import { PublicHeader } from "../shared/public-header";
import { PublicJobDetailPage, PublicJobsPage } from "./components";

export function JobsRoute() {
  const router = useRouter();

  return <PublicJobsPage navigate={(path) => router.push(path)} />;
}

export function JobDetailRoute({ slug }: { slug: string }) {
  const router = useRouter();

  if (slug === "preview") {
    return <RecruiterJobPostPreviewRoute navigate={(path) => router.push(path)} />;
  }

  return <PublicJobDetailPage path={`/jobs/${slug}`} navigate={(path) => router.push(path)} />;
}

function RecruiterJobPostPreviewRoute({ navigate }: { navigate: (path: string) => void }) {
  const [preview, setPreview] = useState<RecruiterJobPostPreviewPayload | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setPreview(getRecruiterJobPostPreview());
  }, []);

  if (preview === undefined) return null;

  if (!preview) {
    return (
      <div className="jobs-page min-h-screen bg-slate-50">
        <PublicHeader navigate={navigate} />
        <main className="flex min-h-[60vh] items-center justify-center px-5 py-12">
          <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">Bản xem trước không còn khả dụng</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hãy quay lại trang tạo tin để mở lại bản xem trước.
            </p>
            <button
              type="button"
              className="upnext-focus mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => navigate("/recruiter/job-posts/create")}
            >
              Quay lại tạo tin
            </button>
          </section>
        </main>
        <PublicFooter navigate={navigate} />
      </div>
    );
  }

  return (
    <div className="jobs-page min-h-screen bg-slate-50">
      <PublicHeader navigate={navigate} />
      <main>
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-5 pt-6 sm:px-6">
          <p className="text-sm font-semibold text-emerald-800">Bản xem trước dành cho ứng viên</p>
          <button
            type="button"
            className="upnext-focus rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-600 hover:text-emerald-700"
            onClick={() => navigate("/recruiter/job-posts/create")}
          >
            Quay lại soạn tin
          </button>
        </div>
        <div className="mx-auto w-full max-w-[1240px] px-5 py-6 sm:px-6">
          <RecruiterJobPostPreview {...preview} />
        </div>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
}
