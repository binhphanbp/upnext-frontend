import type { HomeAction } from "./api";

const actionPriority: Record<HomeAction["type"], number> = {
  APPLICATION_UPDATED: 0,
  SAVED_JOB_EXPIRING: 1,
  FOLLOWED_COMPANY_NEW_JOB: 2,
  MISSING_CV: 3,
  MISSING_PREFERENCES: 4,
};

/**
 * Keep homepage nudges deterministic even when an API producer changes the array order.
 * The homepage intentionally shows one clear next step instead of competing calls to action.
 */
export function selectPrimaryHomeAction(actions: readonly HomeAction[]) {
  return actions.reduce<HomeAction | null>((selected, action) => {
    if (!selected) return action;
    return actionPriority[action.type] < actionPriority[selected.type] ? action : selected;
  }, null);
}
