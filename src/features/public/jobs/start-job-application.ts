import { getCandidateSession } from "@/features/candidate/session";
import { toast } from "@/shared/ui/toast";

type StartJobApplicationOptions = {
  jobId: string;
  locale: string;
  navigate: (path: string) => void;
  onAuthenticated: () => void;
};

export function startJobApplication({
  jobId,
  locale,
  navigate,
  onAuthenticated,
}: StartJobApplicationOptions) {
  if (getCandidateSession()) {
    onAuthenticated();
    return;
  }

  const isEnglish = locale === "en";
  toast.info(isEnglish ? "Log in to apply" : "Đăng nhập để ứng tuyển nhé!", {
    description: isEnglish
      ? "UpNext will bring you back to this job right after you log in."
      : "UpNext sẽ đưa bạn trở lại công việc này ngay sau khi đăng nhập.",
    duration: 5_000,
  });
  navigate(`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`);
}
