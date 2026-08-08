import Swal from "sweetalert2";

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export type ReviewReportInput = { reason: string; evidence: File | null };

/**
 * Asks a recruiter why a review should be taken down, with an optional screenshot.
 *
 * Swal's built-in `input` only renders one field, so the two are declared as raw HTML
 * and read back in `preConfirm`. Shared because the same prompt is reachable from the
 * public company page and the recruiter review list.
 */
export async function promptReviewReport(): Promise<ReviewReportInput | null> {
  const result = await Swal.fire<ReviewReportInput>({
    title: "Báo cáo đánh giá này",
    html: `
      <label for="review-report-reason" class="swal2-label">Lý do báo cáo</label>
      <textarea id="review-report-reason" class="swal2-textarea" style="margin-inline:0;width:100%"
        placeholder="Vì sao bạn cho rằng đánh giá này không phù hợp?"></textarea>
      <label for="review-report-evidence" class="swal2-label">Ảnh bằng chứng (không bắt buộc)</label>
      <input id="review-report-evidence" type="file" class="swal2-file"
        accept="image/png,image/jpeg,image/webp" style="margin-inline:0;width:100%" />
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Gửi báo cáo",
    cancelButtonText: "Hủy",
    preConfirm: () => {
      const reason = (
        document.querySelector<HTMLTextAreaElement>("#review-report-reason")?.value ?? ""
      ).trim();
      if (!reason) {
        Swal.showValidationMessage("Vui lòng nhập lý do.");
        return false;
      }

      const evidence =
        document.querySelector<HTMLInputElement>("#review-report-evidence")?.files?.[0] ?? null;
      if (evidence && evidence.size > MAX_EVIDENCE_BYTES) {
        Swal.showValidationMessage("Ảnh tối đa 5MB.");
        return false;
      }

      return { reason, evidence };
    },
  });

  return result.isConfirmed && result.value ? result.value : null;
}
