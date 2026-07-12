const SWIPE_THRESHOLD = 48;
const SLIDE_DISTANCE_THRESHOLD = 96;
const FLICK_MIN_DISTANCE = 24;
const FLICK_VELOCITY_THRESHOLD = 0.45;

type SlideReleaseInput = {
  horizontalTravel: number;
  verticalTravel: number;
  releaseVelocity: number;
  stageWidth: number;
};

export function getSlideReleaseDirection({
  horizontalTravel,
  verticalTravel,
  releaseVelocity,
  stageWidth,
}: SlideReleaseInput): -1 | 0 | 1 {
  if (Math.abs(horizontalTravel) <= Math.abs(verticalTravel)) {
    return 0;
  }

  const distanceThreshold = Math.min(
    SLIDE_DISTANCE_THRESHOLD,
    Math.max(SWIPE_THRESHOLD, stageWidth * 0.18),
  );
  const crossedDistance = Math.abs(horizontalTravel) >= distanceThreshold;
  const flicked =
    Math.abs(horizontalTravel) >= FLICK_MIN_DISTANCE &&
    Math.abs(releaseVelocity) >= FLICK_VELOCITY_THRESHOLD;

  if (!crossedDistance && !flicked) {
    return 0;
  }

  return horizontalTravel < 0 ? 1 : -1;
}
