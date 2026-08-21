"use client";

import {
  Briefcase,
  CheckCircle,
  Microphone,
  Play,
  VideoCamera,
  WarningCircle,
  Waveform,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { useDeviceCheck } from "../../hooks/use-device-check";
import { LEVEL_LABEL_KEYS } from "../../lib/rubric";
import type { InterviewLevel, InterviewSetup } from "../../types";
import { SectionLabel, SegmentedControl, useRadioGroupProps } from "../interview-primitives";
import { ConsentPanel } from "./consent-panel";

/** Roles the demo script is calibrated for. Sourced from the job service later. */
const TARGET_ROLES = [
  { id: "job-kyber", title: "Backend Developer — Kyber Tech" },
  { id: "job-vnpay", title: "Software Engineer (Backend) — Minh Long Digital" },
  { id: null, title: "" },
] as const;

const LEVELS: InterviewLevel[] = ["INTERN", "FRESHER", "JUNIOR", "MIDDLE", "SENIOR", "LEAD"];

/**
 * Pre-flight.
 *
 * Ordered by what blocks the session soonest: the hardware check sits in the
 * sticky right column and is reachable from the first paint, because a denied
 * microphone discovered on question three is the failure that makes people
 * abandon the feature entirely. Configuration — role, level, length — is the
 * scrollable left column since none of it can fail.
 */
export function InterviewSetupPage({ onStart }: { onStart: (setup: InterviewSetup) => void }) {
  const t = useTranslations("AiInterview");
  const device = useDeviceCheck();

  const [roleIndex, setRoleIndex] = useState(0);
  const [level, setLevel] = useState<InterviewLevel>("JUNIOR");
  const [questionCount, setQuestionCount] = useState<5 | 7 | 10>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [useLiveCapture, setUseLiveCapture] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Releasing the device the moment live capture is switched off keeps the
  // browser's recording indicator honest.
  useEffect(() => {
    if (!useLiveCapture) device.stop();
  }, [device, useLiveCapture]);

  const roleGroupProps = useRadioGroupProps({
    label: t("setup.role"),
    value: roleIndex,
    values: TARGET_ROLES.map((_option, index) => index),
    onChange: setRoleIndex,
  });
  const modeGroupProps = useRadioGroupProps({
    label: t("setup.mode"),
    value: useLiveCapture ? "live" : "simulated",
    values: device.capabilities.microphone ? ["simulated", "live"] : ["simulated"],
    onChange: (next) => setUseLiveCapture(next === "live"),
  });

  const role = TARGET_ROLES[roleIndex] ?? TARGET_ROLES[0];
  const jobTitle = role.title || t("setup.freeTopic");
  const canStart = !useLiveCapture || (device.permission === "granted" && hasConsented);

  const start = () =>
    onStart({
      mode: useLiveCapture ? "voice" : "text",
      jobId: role.id,
      jobTitle,
      level,
      questionCount,
      difficulty,
      competencies: [],
      useLiveCapture,
      cameraEnabled: useLiveCapture && cameraEnabled,
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            {t("setup.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-slate-600">
            {t("setup.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionLabel>{t("setup.role")}</SectionLabel>
          <div {...roleGroupProps} className="space-y-2 outline-none">
            {TARGET_ROLES.map((option, index) => {
              const isSelected = index === roleIndex;
              return (
                <button
                  key={option.id ?? "free"}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-value={String(index)}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setRoleIndex(index)}
                  className={cn(
                    "upnext-focus flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <Briefcase weight="fill" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-semibold",
                        isSelected ? "text-emerald-900" : "text-slate-800",
                      )}
                    >
                      {option.title || t("setup.freeTopic")}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {option.id ? t("setup.roleHint") : t("setup.freeTopicHint")}
                    </span>
                  </span>
                  {isSelected ? (
                    <CheckCircle
                      weight="fill"
                      aria-hidden
                      className="size-5 shrink-0 text-emerald-600"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionLabel>{t("setup.level")}</SectionLabel>
          <SegmentedControl
            name={t("setup.level")}
            value={level}
            onChange={setLevel}
            options={LEVELS.map((item) => ({ value: item, label: t(LEVEL_LABEL_KEYS[item]) }))}
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <SectionLabel>{t("setup.questionCount")}</SectionLabel>
              <SegmentedControl
                name={t("setup.questionCount")}
                value={questionCount}
                onChange={setQuestionCount}
                options={[
                  { value: 5, label: t("setup.questions", { count: 5 }), hint: "~20 phút" },
                  {
                    value: 7,
                    label: t("setup.questions", { count: 7 }),
                    hint: t("setup.comingSoon"),
                    disabled: true,
                  },
                  {
                    value: 10,
                    label: t("setup.questions", { count: 10 }),
                    hint: t("setup.comingSoon"),
                    disabled: true,
                  },
                ]}
              />
            </div>
            <div>
              <SectionLabel>{t("setup.difficulty")}</SectionLabel>
              <SegmentedControl
                name={t("setup.difficulty")}
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { value: "easy", label: t("difficulty.easy") },
                  { value: "medium", label: t("difficulty.medium") },
                  { value: "hard", label: t("difficulty.hard") },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionLabel>{t("setup.mode")}</SectionLabel>
          <div {...modeGroupProps} className="grid gap-2 outline-none sm:grid-cols-2">
            <ModeCard
              value="simulated"
              isSelected={!useLiveCapture}
              onSelect={() => setUseLiveCapture(false)}
              icon={<Waveform weight="fill" aria-hidden className="size-4" />}
              title={t("setup.modeSimulated")}
              description={t("setup.modeSimulatedHint")}
            />
            <ModeCard
              value="live"
              isSelected={useLiveCapture}
              onSelect={() => setUseLiveCapture(true)}
              icon={<Microphone weight="fill" aria-hidden className="size-4" />}
              title={t("setup.modeLive")}
              description={t("setup.modeLiveHint")}
              isUnavailable={!device.capabilities.microphone}
              unavailableHint={t("setup.modeLiveUnsupported")}
            />
          </div>

          {useLiveCapture ? (
            <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2.5">
              <VideoCamera weight="fill" aria-hidden className="size-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">
                  {t("setup.camera")}
                </span>
                <span className="block text-xs text-slate-500">{t("setup.cameraHint")}</span>
              </span>
              <input
                type="checkbox"
                aria-label={t("setup.camera")}
                checked={cameraEnabled}
                onChange={(event) => setCameraEnabled(event.target.checked)}
                className="upnext-focus size-4 shrink-0 accent-emerald-600"
              />
            </label>
          ) : null}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionLabel>{t("setup.deviceCheck")}</SectionLabel>

          {useLiveCapture ? (
            <>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
                <video
                  ref={device.videoRef}
                  muted
                  playsInline
                  aria-label={t("setup.deviceCheck")}
                  className={cn(
                    "size-full scale-x-[-1] object-cover",
                    (!cameraEnabled || device.permission !== "granted") && "hidden",
                  )}
                />
                {!cameraEnabled || device.permission !== "granted" ? (
                  <div className="grid size-full place-items-center gap-2 text-center">
                    <Microphone weight="duotone" aria-hidden className="size-8 text-slate-600" />
                    <p className="px-4 text-[11px] leading-snug text-slate-500">
                      {device.permission === "granted"
                        ? t("setup.audioOnlyPreview")
                        : t("setup.previewIdle")}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                    {t("setup.micLevel")}
                  </span>
                  {device.peak > 0.12 ? (
                    <span className="text-[11px] font-bold text-emerald-600">
                      {t("setup.micWorking")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex h-6 items-end gap-[3px]" aria-hidden>
                  {Array.from({ length: 28 }, (_, index) => {
                    const threshold = (index + 1) / 28;
                    const isLit = device.level >= threshold * 0.9;
                    return (
                      <span
                        key={index}
                        className={cn(
                          "flex-1 rounded-sm transition-colors duration-75",
                          isLit
                            ? threshold > 0.85
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                            : "bg-slate-200",
                        )}
                        style={{ height: `${30 + threshold * 70}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                <CapabilityRow
                  isAvailable={device.permission === "granted"}
                  label={t("setup.capMic")}
                />
                <CapabilityRow
                  isAvailable={device.capabilities.speechRecognition}
                  label={t("setup.capStt")}
                  fallbackHint={t("setup.capSttFallback")}
                />
                <CapabilityRow
                  isAvailable={device.capabilities.speechSynthesis}
                  label={t("setup.capTts")}
                  fallbackHint={t("setup.capTtsFallback")}
                />
              </ul>

              {device.error ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  {device.error}
                </p>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => void device.start(cameraEnabled)}
              >
                {device.permission === "granted" ? t("setup.recheck") : t("setup.grantAccess")}
              </Button>
            </>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-slate-600">
              {t("setup.simulatedNotice")}
            </p>
          )}
        </div>

        <ConsentPanel
          isRequired={useLiveCapture}
          isAccepted={hasConsented}
          onAcceptedChange={setHasConsented}
          usesCloudSpeech={useLiveCapture && device.capabilities.speechRecognition}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <dl className="space-y-1.5 text-[13px]">
            <SummaryRow label={t("setup.summaryRole")} value={jobTitle} />
            <SummaryRow label={t("setup.summaryLevel")} value={t(LEVEL_LABEL_KEYS[level])} />
            <SummaryRow
              label={t("setup.summaryLength")}
              value={t("setup.questions", { count: questionCount })}
            />
            <SummaryRow
              label={t("setup.summaryMode")}
              value={t(useLiveCapture ? "setup.modeLive" : "setup.modeSimulated")}
            />
          </dl>

          <Button size="lg" className="mt-4 w-full" disabled={!canStart} onClick={start}>
            <Play weight="fill" aria-hidden />
            {t("setup.start")}
          </Button>
          {!canStart ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              {device.permission === "granted" ? t("setup.needConsent") : t("setup.needMic")}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ModeCard({
  value,
  isSelected,
  onSelect,
  icon,
  title,
  description,
  isUnavailable = false,
  unavailableHint,
}: {
  value: string;
  isSelected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  isUnavailable?: boolean;
  unavailableHint?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      data-value={value}
      tabIndex={isSelected ? 0 : -1}
      disabled={isUnavailable}
      onClick={onSelect}
      className={cn(
        "upnext-focus rounded-xl border p-3.5 text-left transition-colors",
        isSelected
          ? "border-emerald-500 bg-emerald-50"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        isUnavailable && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-bold",
          isSelected ? "text-emerald-900" : "text-slate-800",
        )}
      >
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-slate-600">
        {isUnavailable ? unavailableHint : description}
      </span>
    </button>
  );
}

function CapabilityRow({
  isAvailable,
  label,
  fallbackHint,
}: {
  isAvailable: boolean;
  label: string;
  fallbackHint?: string;
}) {
  return (
    <li className="flex items-start gap-2 text-[13px]">
      {isAvailable ? (
        <CheckCircle
          weight="fill"
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-emerald-600"
        />
      ) : (
        <WarningCircle
          weight="fill"
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-slate-300"
        />
      )}
      <span className="min-w-0">
        <span className={isAvailable ? "text-slate-700" : "text-slate-500"}>{label}</span>
        {!isAvailable && fallbackHint ? (
          <span className="block text-[11px] leading-snug text-slate-400">{fallbackHint}</span>
        ) : null}
      </span>
    </li>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
