import type { AiContextType, AiQuickAction } from "../types";

/**
 * §8.3 — candidate quick actions. `prompt` is the text actually sent, so the
 * transcript reads the same whether the user typed it or pressed the chip.
 */
export const CANDIDATE_QUICK_ACTIONS: AiQuickAction[] = [
  {
    id: "analyze-cv",
    labelKey: "quickActions.analyzeCv",
    icon: "sparkle",
    prompt: "Phân tích CV của tôi",
  },
  {
    id: "find-jobs",
    labelKey: "quickActions.findJobs",
    icon: "target",
    prompt: "Tìm việc phù hợp với hồ sơ của tôi",
  },
  {
    id: "compare-job",
    labelKey: "quickActions.compareJob",
    icon: "scales",
    prompt: "So sánh CV của tôi với công việc này",
    requiresContext: ["JOB"],
  },
  {
    id: "skill-gap",
    labelKey: "quickActions.skillGap",
    icon: "gap",
    prompt: "Tôi còn thiếu kỹ năng gì cho vị trí này?",
  },
  {
    id: "prepare-interview",
    labelKey: "quickActions.prepareInterview",
    icon: "interview",
    prompt: "Chuẩn bị phỏng vấn cho công việc này",
  },
  {
    id: "application-status",
    labelKey: "quickActions.applicationStatus",
    icon: "status",
    prompt: "Kiểm tra trạng thái ứng tuyển của tôi",
  },
];

export function quickActionsForContext(context: AiContextType): AiQuickAction[] {
  return CANDIDATE_QUICK_ACTIONS.filter(
    (action) => !action.requiresContext || action.requiresContext.includes(context),
  );
}
