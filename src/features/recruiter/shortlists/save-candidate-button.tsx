"use client";

import { BookmarkSimple } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import { addToShortlist } from "@/features/recruiter/shortlists/api";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
});

type SaveCandidateButtonProps = {
  token: string;
  candidateProfileId: string;
  candidateName: string;
  /** The posting this candidate was found on, kept as context on the saved row. */
  jobPostId?: string;
  className?: string;
};

/**
 * Saves a candidate into the company-wide talent pool.
 *
 * The pool holds one entry per candidate per company, so a colleague may already have
 * saved this person; that comes back as a 409 and is shown as "already saved" rather than
 * an error, because from the recruiter's point of view the candidate is in the list either
 * way. There is no unsave here — that belongs on the saved-candidates screen, where the
 * whole team can see what they are removing.
 */
export function SaveCandidateButton({
  token,
  candidateProfileId,
  candidateName,
  jobPostId,
  className,
}: SaveCandidateButtonProps) {
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      addToShortlist(token, {
        candidateProfileId,
        ...(jobPostId ? { jobPostId } : {}),
      }),
    onSuccess: () => {
      setSaved(true);
      void toast.fire({ icon: "success", title: `Đã lưu ${candidateName} vào danh sách.` });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setSaved(true);
        void toast.fire({ icon: "info", title: "Ứng viên này đã có trong danh sách của công ty." });
        return;
      }
      void toast.fire({ icon: "error", title: "Không lưu được ứng viên. Vui lòng thử lại." });
    },
  });

  return (
    <button
      type="button"
      disabled={saved || save.isPending}
      onClick={() => save.mutate()}
      title={saved ? "Đã có trong danh sách đã lưu" : `Lưu ${candidateName} vào danh sách`}
      aria-label={saved ? "Đã lưu ứng viên" : `Lưu ${candidateName} vào danh sách`}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center transition-colors",
        saved ? "text-primary cursor-default" : "text-slate-400 hover:text-primary",
        className,
      )}
    >
      <BookmarkSimple size={16} weight={saved ? "fill" : "regular"} />
    </button>
  );
}
