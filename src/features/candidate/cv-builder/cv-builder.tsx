"use client";

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowsInSimple,
  Briefcase,
  ChartLineUp,
  Check,
  CheckCircle,
  Code,
  Crosshair,
  DownloadSimple,
  Eye,
  EyeSlash,
  FileText,
  GraduationCap,
  Info,
  ListChecks,
  Minus,
  Palette,
  Plus,
  ShieldCheck,
  Trash,
  User,
  WarningCircle,
  Wrench,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createCandidateBuilderVersion,
  createCandidateCv,
  getCandidateCv,
  getMyCandidateProfile,
  type CandidateProfileApi,
} from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { CvPreview } from "./cv-preview";
import { evaluateCv, isCvEmpty, mapProfileToCvData, toPlainText } from "./logic";
import {
  createInitialCvData,
  getCvBuilderStorageKey,
  parseCvSnapshot,
  useCvBuilderStore,
} from "./store";
import type {
  CvData,
  CvEditorSectionKey,
  CvEvaluation,
  CvIssue,
  CvSectionKey,
  SkillLevel,
} from "./types";

import "./cv-builder.css";

const SECTION_ICONS = {
  targeting: Crosshair,
  personal: User,
  summary: FileText,
  experience: Briefcase,
  projects: Code,
  education: GraduationCap,
  skills: Wrench,
  review: ListChecks,
  styling: Palette,
} as const;

const CONTENT_SECTIONS: CvSectionKey[] = [
  "personal",
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
];

function createCvSnapshotText(cvData: CvData) {
  return toPlainText(
    [
      cvData.personalInfo.fullName,
      cvData.personalInfo.title,
      cvData.personalInfo.email,
      cvData.personalInfo.phoneNumber,
      cvData.personalInfo.address,
      cvData.personalInfo.website,
      cvData.summary,
      ...cvData.experiences.flatMap((experience) => [
        experience.positionTitle,
        experience.companyName,
        experience.description,
        experience.technologies,
      ]),
      ...cvData.projects.flatMap((project) => [
        project.name,
        project.role,
        project.description,
        project.technologies,
      ]),
      ...cvData.educations.flatMap((education) => [
        education.schoolName,
        education.degree,
        education.major,
        education.description,
      ]),
      ...cvData.skills.map((skill) => skill.name),
    ].join("\n"),
  );
}

type SavedBuilderCv = Readonly<{ id: string; title: string; version: number }>;

const EDITOR_SEQUENCE: CvEditorSectionKey[] = [
  "targeting",
  ...CONTENT_SECTIONS,
  "review",
  "styling",
];

const THEME_OPTIONS = [
  { id: "emerald", color: "#0f9f74" },
  { id: "teal", color: "#0f8c8c" },
  { id: "indigo", color: "#4f46e5" },
  { id: "violet", color: "#7c3aed" },
  { id: "slate", color: "#334155" },
] as const;

const TEMPLATE_OPTIONS: CvData["selectedTemplate"][] = ["modern", "minimalist", "creative"];
const SKILL_LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const PREVIEW_WIDTH = 794;
const MIN_PREVIEW_ZOOM = 0.32;
const MAX_PREVIEW_ZOOM = 1.05;

function getIssue(evaluation: CvEvaluation, path: string) {
  return evaluation.issues.find((issue) => issue.path === path);
}

function FieldMessage({
  issue,
  visible,
}: Readonly<{ issue?: CvIssue | undefined; visible: boolean }>) {
  const t = useTranslations("CvBuilder");
  if (!issue || !visible) return null;
  return (
    <p
      className={cn(
        "cv-field-message",
        issue.severity === "error" ? "cv-field-message--error" : "cv-field-message--warning",
      )}
      id={`cv-error-${issue.path.replaceAll(".", "-")}`}
      role={issue.severity === "error" ? "alert" : undefined}
    >
      {issue.severity === "error" ? (
        <WarningCircle aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      {t(`validation.${issue.code}`)}
    </p>
  );
}

function FormField({
  children,
  error,
  hint,
  id,
  label,
  required,
  showError,
}: Readonly<{
  children: ReactNode;
  error?: CvIssue | undefined;
  hint?: string | undefined;
  id: string;
  label: string;
  required?: boolean | undefined;
  showError: boolean;
}>) {
  const errorId = error ? `cv-error-${error.path.replaceAll(".", "-")}` : undefined;
  const hintId = hint ? `cv-hint-${id}` : undefined;
  const visibleIssue = Boolean(error && showError);
  const visibleHint = Boolean(hint && !visibleIssue);
  const control = isValidElement<{
    "aria-describedby"?: string | undefined;
    "aria-invalid"?: boolean | undefined;
    "aria-required"?: boolean | undefined;
    required?: boolean | undefined;
  }>(children)
    ? cloneElement(children, {
        "aria-describedby":
          [
            ...(children.props["aria-describedby"]?.split(/\s+/) ?? []).filter(
              (descriptionId) => descriptionId !== errorId && descriptionId !== hintId,
            ),
            visibleIssue ? errorId : undefined,
            visibleHint ? hintId : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
        "aria-invalid": Boolean(visibleIssue && error?.severity === "error"),
        "aria-required": required || undefined,
        required: required || undefined,
      })
    : children;

  return (
    <div className="cv-form-field">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {control}
      {visibleHint ? (
        <p className="cv-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <FieldMessage issue={error} visible={showError} />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  subtitle,
  title,
}: Readonly<{ eyebrow: string; subtitle: string; title: string }>) {
  return (
    <header className="cv-editor-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{subtitle}</span>
    </header>
  );
}

function EmptyState({
  action,
  description,
  icon,
  title,
}: Readonly<{ action: ReactNode; description: string; icon: ReactNode; title: string }>) {
  return (
    <div className="cv-empty-state">
      <span className="cv-empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function ItemActions({
  index,
  length,
  name,
  onDelete,
  onMove,
}: Readonly<{
  index: number;
  length: number;
  name: string;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}>) {
  const t = useTranslations("CvBuilder");
  return (
    <div className="cv-item-actions">
      <button
        aria-label={t("actions.moveUp", { name })}
        disabled={index === 0}
        onClick={() => onMove("up")}
        title={t("actions.moveUp", { name })}
        type="button"
      >
        <ArrowUp aria-hidden="true" />
      </button>
      <button
        aria-label={t("actions.moveDown", { name })}
        disabled={index === length - 1}
        onClick={() => onMove("down")}
        title={t("actions.moveDown", { name })}
        type="button"
      >
        <ArrowDown aria-hidden="true" />
      </button>
      <button
        aria-label={t("actions.delete", { name })}
        className="cv-item-actions__delete"
        onClick={onDelete}
        title={t("actions.delete", { name })}
        type="button"
      >
        <Trash aria-hidden="true" />
      </button>
    </div>
  );
}

function TargetingEditor({ evaluation }: Readonly<{ evaluation: CvEvaluation }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, updatePersonalInfo, updateTargetJob } = useCvBuilderStore();
  const target = cvData.targetJob;
  const match = evaluation.jobMatch;
  const canUseRole =
    Boolean(target.role.trim()) && target.role.trim() !== cvData.personalInfo.title;

  return (
    <div className="cv-editor-section cv-targeting-editor">
      <SectionHeading
        eyebrow={t("targeting.eyebrow")}
        subtitle={t("targeting.subtitle")}
        title={t("targeting.title")}
      />

      <div className="cv-targeting-grid">
        <section className="cv-targeting-form" aria-labelledby="cv-targeting-form-title">
          <div className="cv-panel-heading">
            <span aria-hidden="true">
              <Crosshair />
            </span>
            <div>
              <h3 id="cv-targeting-form-title">{t("targeting.formTitle")}</h3>
              <p>{t("targeting.formDescription")}</p>
            </div>
          </div>
          <div className="cv-form-grid">
            <FormField id="cv-target-role" label={t("targeting.role")} showError={false}>
              <Input
                autoComplete="off"
                id="cv-target-role"
                name="targetJob.role"
                onChange={(event) => updateTargetJob({ role: event.target.value })}
                placeholder={t("targeting.rolePlaceholder")}
                value={target.role}
              />
            </FormField>
            <FormField id="cv-target-company" label={t("targeting.company")} showError={false}>
              <Input
                autoComplete="organization"
                id="cv-target-company"
                name="targetJob.company"
                onChange={(event) => updateTargetJob({ company: event.target.value })}
                placeholder={t("targeting.companyPlaceholder")}
                value={target.company}
              />
            </FormField>
          </div>
          <FormField
            hint={t("targeting.descriptionHint")}
            id="cv-target-description"
            label={t("targeting.description")}
            showError={false}
          >
            <textarea
              aria-label={t("targeting.description")}
              className="cv-textarea cv-target-description"
              id="cv-target-description"
              maxLength={5000}
              name="targetJob.description"
              onChange={(event) => updateTargetJob({ description: event.target.value })}
              placeholder={t("targeting.descriptionPlaceholder")}
              value={target.description}
            />
          </FormField>
          <div className="cv-targeting-form-footer">
            <span>
              <ShieldCheck aria-hidden="true" /> {t("targeting.privateAnalysis")}
            </span>
            <Button
              disabled={!canUseRole}
              onClick={() => updatePersonalInfo({ title: target.role.trim() })}
              size="sm"
              variant="outline"
            >
              {t("targeting.useAsHeadline")}
            </Button>
          </div>
        </section>

        <aside className="cv-match-card" aria-live="polite">
          <div className="cv-panel-heading">
            <span aria-hidden="true">
              <ListChecks />
            </span>
            <div>
              <h3>{t("targeting.matchTitle")}</h3>
              <p>{t("targeting.matchDescription")}</p>
            </div>
          </div>
          {match.hasDescription ? (
            <>
              <div className="cv-match-score-row">
                <output
                  aria-label={t("targeting.coverageValue", { score: match.score ?? 0 })}
                  className="cv-match-score"
                  style={{ "--cv-match": `${match.score ?? 0}%` } as CSSProperties}
                >
                  <strong>{match.score ?? 0}</strong>
                  <span>%</span>
                </output>
                <div>
                  <strong>{t("targeting.coverageLabel")}</strong>
                  <p>
                    {t("targeting.coverageSummary", {
                      matched: match.matched.length,
                      total: match.total,
                    })}
                  </p>
                </div>
              </div>
              <div className="cv-keyword-group">
                <strong>{t("targeting.matchedKeywords")}</strong>
                <div className="cv-keyword-list">
                  {match.matched.length > 0 ? (
                    match.matched.slice(0, 8).map((item) => (
                      <span className="is-matched" key={item.keyword}>
                        <Check aria-hidden="true" /> {item.keyword}
                      </span>
                    ))
                  ) : (
                    <small>{t("targeting.noMatchedKeywords")}</small>
                  )}
                </div>
              </div>
              <div className="cv-keyword-group">
                <strong>{t("targeting.missingKeywords")}</strong>
                <div className="cv-keyword-list">
                  {match.missing.length > 0 ? (
                    match.missing.slice(0, 8).map((keyword) => (
                      <span className="is-missing" key={keyword}>
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <small>{t("targeting.noMissingKeywords")}</small>
                  )}
                </div>
              </div>
              <p className="cv-match-disclaimer">
                <Info aria-hidden="true" /> {t("targeting.notAtsScore")}
              </p>
            </>
          ) : (
            <div className="cv-match-empty">
              <Crosshair aria-hidden="true" />
              <strong>{t("targeting.emptyMatchTitle")}</strong>
              <p>{t("targeting.emptyMatchDescription")}</p>
            </div>
          )}
        </aside>
      </div>

      <div className="cv-evidence-principles">
        <div>
          <span>01</span>
          <p>
            <strong>{t("targeting.principles.evidenceTitle")}</strong>
            {t("targeting.principles.evidenceDescription")}
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            <strong>{t("targeting.principles.truthTitle")}</strong>
            {t("targeting.principles.truthDescription")}
          </p>
        </div>
        <div>
          <span>03</span>
          <p>
            <strong>{t("targeting.principles.versionTitle")}</strong>
            {t("targeting.principles.versionDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}

function PersonalEditor({
  evaluation,
  revealValidation,
}: Readonly<{ evaluation: CvEvaluation; revealValidation: boolean }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, updatePersonalInfo } = useCvBuilderStore();
  const personal = cvData.personalInfo;
  const fullNameIssue = getIssue(evaluation, "personalInfo.fullName");
  const titleIssue = getIssue(evaluation, "personalInfo.title");
  const emailIssue = getIssue(evaluation, "personalInfo.email");
  const phoneIssue = getIssue(evaluation, "personalInfo.phoneNumber");
  const websiteIssue = getIssue(evaluation, "personalInfo.website");

  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("editor.step", { current: 1, total: 6 })}
        subtitle={t("personal.subtitle")}
        title={t("personal.title")}
      />
      <div className="cv-form-grid">
        <FormField
          error={fullNameIssue}
          id="cv-full-name"
          label={t("personal.fullName")}
          required
          showError={revealValidation}
        >
          <Input
            aria-describedby={fullNameIssue ? "cv-error-personalInfo-fullName" : undefined}
            aria-invalid={Boolean(fullNameIssue && revealValidation)}
            autoComplete="name"
            id="cv-full-name"
            name="fullName"
            onChange={(event) => updatePersonalInfo({ fullName: event.target.value })}
            placeholder={t("personal.fullNamePlaceholder")}
            value={personal.fullName}
          />
        </FormField>
        <FormField
          error={titleIssue}
          id="cv-job-title"
          label={t("personal.jobTitle")}
          required
          showError={revealValidation}
        >
          <Input
            aria-describedby={titleIssue ? "cv-error-personalInfo-title" : undefined}
            aria-invalid={Boolean(titleIssue && revealValidation)}
            autoComplete="organization-title"
            id="cv-job-title"
            name="jobTitle"
            onChange={(event) => updatePersonalInfo({ title: event.target.value })}
            placeholder={t("personal.jobTitlePlaceholder")}
            value={personal.title}
          />
        </FormField>
        <FormField
          error={emailIssue}
          id="cv-email"
          label={t("personal.email")}
          required
          showError={revealValidation || Boolean(personal.email)}
        >
          <Input
            aria-describedby={emailIssue ? "cv-error-personalInfo-email" : undefined}
            aria-invalid={Boolean(emailIssue && (revealValidation || personal.email))}
            autoComplete="email"
            id="cv-email"
            inputMode="email"
            name="email"
            onChange={(event) => updatePersonalInfo({ email: event.target.value })}
            placeholder={t("personal.emailPlaceholder")}
            spellCheck={false}
            type="email"
            value={personal.email}
          />
        </FormField>
        <FormField
          error={phoneIssue}
          id="cv-phone"
          label={t("personal.phone")}
          required
          showError={revealValidation || Boolean(personal.phoneNumber)}
        >
          <Input
            aria-describedby={phoneIssue ? "cv-error-personalInfo-phoneNumber" : undefined}
            aria-invalid={Boolean(phoneIssue && (revealValidation || personal.phoneNumber))}
            autoComplete="tel"
            id="cv-phone"
            inputMode="tel"
            name="phoneNumber"
            onChange={(event) => updatePersonalInfo({ phoneNumber: event.target.value })}
            placeholder={t("personal.phonePlaceholder")}
            type="tel"
            value={personal.phoneNumber}
          />
        </FormField>
        <FormField id="cv-address" label={t("personal.address")} showError={false}>
          <Input
            autoComplete="address-level2"
            id="cv-address"
            name="address"
            onChange={(event) => updatePersonalInfo({ address: event.target.value })}
            placeholder={t("personal.addressPlaceholder")}
            value={personal.address}
          />
        </FormField>
        <FormField
          error={websiteIssue}
          hint={t("personal.websiteHint")}
          id="cv-website"
          label={t("personal.website")}
          showError={Boolean(personal.website)}
        >
          <Input
            aria-describedby={websiteIssue ? "cv-error-personalInfo-website" : undefined}
            aria-invalid={Boolean(websiteIssue && personal.website)}
            autoComplete="url"
            id="cv-website"
            inputMode="url"
            name="website"
            onChange={(event) => updatePersonalInfo({ website: event.target.value })}
            placeholder={t("personal.websitePlaceholder")}
            spellCheck={false}
            type="url"
            value={personal.website}
          />
        </FormField>
      </div>
    </div>
  );
}

function SummaryEditor({ evaluation }: Readonly<{ evaluation: CvEvaluation }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, updateSummary } = useCvBuilderStore();
  const summary = toPlainText(cvData.summary);
  const issue = getIssue(evaluation, "summary");
  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("editor.step", { current: 2, total: 6 })}
        subtitle={t("summary.subtitle")}
        title={t("summary.title")}
      />
      <div className="cv-writing-guide">
        <strong>{t("summary.formulaTitle")}</strong>
        <p>{t("summary.formula")}</p>
      </div>
      <FormField
        error={issue}
        hint={t("summary.hint")}
        id="cv-summary"
        label={t("summary.label")}
        showError={summary.length > 0 && summary.length < 60}
      >
        <textarea
          aria-label={t("summary.label")}
          aria-describedby="cv-summary-count"
          className="cv-textarea cv-textarea--large"
          id="cv-summary"
          maxLength={700}
          name="summary"
          onChange={(event) => updateSummary(event.target.value)}
          placeholder={t("summary.placeholder")}
          value={summary}
        />
      </FormField>
      <p className="cv-character-count" id="cv-summary-count">
        {t("editor.characters", { current: summary.length, recommended: 120 })}
      </p>
    </div>
  );
}

function ExperienceEditor({
  evaluation,
  revealValidation,
}: Readonly<{ evaluation: CvEvaluation; revealValidation: boolean }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, addExperience, updateExperience, deleteExperience, moveExperience } =
    useCvBuilderStore();

  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("editor.step", { current: 3, total: 6 })}
        subtitle={t("experience.subtitle")}
        title={t("experience.title")}
      />
      {cvData.experiences.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={addExperience} size="sm">
              <Plus /> {t("experience.add")}
            </Button>
          }
          description={t("experience.emptyDescription")}
          icon={<Briefcase />}
          title={t("experience.empty")}
        />
      ) : (
        <div className="cv-item-list">
          {cvData.experiences.map((experience, index) => {
            const prefix = `experiences.${index}`;
            const title = experience.positionTitle || t("experience.item", { index: index + 1 });
            const companyIssue = getIssue(evaluation, `${prefix}.companyName`);
            const positionIssue = getIssue(evaluation, `${prefix}.positionTitle`);
            const startIssue = getIssue(evaluation, `${prefix}.startDate`);
            const endIssue = getIssue(evaluation, `${prefix}.endDate`);
            const descriptionIssue = getIssue(evaluation, `${prefix}.description`);
            const description = toPlainText(experience.description);
            return (
              <article
                aria-labelledby={`experience-heading-${experience.id}`}
                className="cv-item-card"
                key={experience.id}
              >
                <header className="cv-item-card__header">
                  <div>
                    <span>{t("experience.item", { index: index + 1 })}</span>
                    <h3 id={`experience-heading-${experience.id}`}>{title}</h3>
                  </div>
                  <ItemActions
                    index={index}
                    length={cvData.experiences.length}
                    name={title}
                    onDelete={() => deleteExperience(experience.id)}
                    onMove={(direction) => moveExperience(experience.id, direction)}
                  />
                </header>
                <div className="cv-form-grid">
                  <FormField
                    error={positionIssue}
                    id={`experience-position-${experience.id}`}
                    label={t("experience.position")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      aria-invalid={Boolean(positionIssue && revealValidation)}
                      autoComplete="organization-title"
                      id={`experience-position-${experience.id}`}
                      maxLength={150}
                      name={`experiences[${index}].positionTitle`}
                      onChange={(event) =>
                        updateExperience(experience.id, { positionTitle: event.target.value })
                      }
                      placeholder={t("experience.positionPlaceholder")}
                      value={experience.positionTitle}
                    />
                  </FormField>
                  <FormField
                    error={companyIssue}
                    id={`experience-company-${experience.id}`}
                    label={t("experience.company")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      aria-invalid={Boolean(companyIssue && revealValidation)}
                      autoComplete="organization"
                      id={`experience-company-${experience.id}`}
                      maxLength={200}
                      name={`experiences[${index}].companyName`}
                      onChange={(event) =>
                        updateExperience(experience.id, { companyName: event.target.value })
                      }
                      placeholder={t("experience.companyPlaceholder")}
                      value={experience.companyName}
                    />
                  </FormField>
                  <FormField
                    error={startIssue}
                    id={`experience-start-${experience.id}`}
                    label={t("experience.start")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      aria-invalid={Boolean(startIssue && revealValidation)}
                      id={`experience-start-${experience.id}`}
                      name={`experiences[${index}].startDate`}
                      onChange={(event) =>
                        updateExperience(experience.id, { startDate: event.target.value })
                      }
                      type="month"
                      value={experience.startDate}
                    />
                  </FormField>
                  <FormField
                    error={endIssue}
                    id={`experience-end-${experience.id}`}
                    label={t("experience.end")}
                    showError={Boolean(endIssue)}
                  >
                    <Input
                      aria-invalid={Boolean(endIssue)}
                      disabled={experience.isCurrent}
                      id={`experience-end-${experience.id}`}
                      min={experience.startDate || undefined}
                      name={`experiences[${index}].endDate`}
                      onChange={(event) =>
                        updateExperience(experience.id, { endDate: event.target.value })
                      }
                      type="month"
                      value={experience.endDate}
                    />
                  </FormField>
                </div>
                <label className="cv-checkbox-row">
                  <input
                    aria-label={t("experience.current")}
                    checked={experience.isCurrent}
                    name={`experiences[${index}].isCurrent`}
                    onChange={(event) =>
                      updateExperience(experience.id, {
                        isCurrent: event.target.checked,
                        ...(event.target.checked ? { endDate: "" } : {}),
                      })
                    }
                    type="checkbox"
                  />
                  <span>{t("experience.current")}</span>
                </label>
                <FormField
                  error={descriptionIssue}
                  hint={t("experience.descriptionHint")}
                  id={`experience-description-${experience.id}`}
                  label={t("experience.description")}
                  showError={description.length > 0 && description.length < 60}
                >
                  <textarea
                    aria-label={t("experience.description")}
                    className="cv-textarea"
                    id={`experience-description-${experience.id}`}
                    maxLength={1200}
                    name={`experiences[${index}].description`}
                    onChange={(event) =>
                      updateExperience(experience.id, { description: event.target.value })
                    }
                    placeholder={t("experience.descriptionPlaceholder")}
                    value={description}
                  />
                </FormField>
                <FormField
                  id={`experience-tech-${experience.id}`}
                  label={t("experience.tech")}
                  showError={false}
                >
                  <Input
                    id={`experience-tech-${experience.id}`}
                    name={`experiences[${index}].technologies`}
                    onChange={(event) =>
                      updateExperience(experience.id, { technologies: event.target.value })
                    }
                    placeholder={t("experience.techPlaceholder")}
                    value={experience.technologies}
                  />
                </FormField>
              </article>
            );
          })}
          <Button className="cv-add-another" onClick={addExperience} variant="outline">
            <Plus /> {t("experience.addAnother")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ProjectsEditor({
  evaluation,
  revealValidation,
}: Readonly<{ evaluation: CvEvaluation; revealValidation: boolean }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, addProject, updateProject, deleteProject, moveProject } = useCvBuilderStore();
  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("editor.step", { current: 4, total: 6 })}
        subtitle={t("projects.subtitle")}
        title={t("projects.title")}
      />
      {cvData.projects.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={addProject} size="sm">
              <Plus /> {t("projects.add")}
            </Button>
          }
          description={t("projects.emptyDescription")}
          icon={<Code />}
          title={t("projects.empty")}
        />
      ) : (
        <div className="cv-item-list">
          {cvData.projects.map((project, index) => {
            const prefix = `projects.${index}`;
            const title = project.name || t("projects.item", { index: index + 1 });
            const description = toPlainText(project.description);
            return (
              <article
                aria-labelledby={`project-heading-${project.id}`}
                className="cv-item-card"
                key={project.id}
              >
                <header className="cv-item-card__header">
                  <div>
                    <span>{t("projects.item", { index: index + 1 })}</span>
                    <h3 id={`project-heading-${project.id}`}>{title}</h3>
                  </div>
                  <ItemActions
                    index={index}
                    length={cvData.projects.length}
                    name={title}
                    onDelete={() => deleteProject(project.id)}
                    onMove={(direction) => moveProject(project.id, direction)}
                  />
                </header>
                <div className="cv-form-grid">
                  <FormField
                    error={getIssue(evaluation, `${prefix}.name`)}
                    id={`project-name-${project.id}`}
                    label={t("projects.name")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      id={`project-name-${project.id}`}
                      maxLength={200}
                      name={`projects[${index}].name`}
                      onChange={(event) => updateProject(project.id, { name: event.target.value })}
                      placeholder={t("projects.namePlaceholder")}
                      value={project.name}
                    />
                  </FormField>
                  <FormField
                    error={getIssue(evaluation, `${prefix}.role`)}
                    id={`project-role-${project.id}`}
                    label={t("projects.role")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      id={`project-role-${project.id}`}
                      maxLength={150}
                      name={`projects[${index}].role`}
                      onChange={(event) => updateProject(project.id, { role: event.target.value })}
                      placeholder={t("projects.rolePlaceholder")}
                      value={project.role}
                    />
                  </FormField>
                  <FormField
                    error={getIssue(evaluation, `${prefix}.projectUrl`)}
                    id={`project-source-${project.id}`}
                    label={t("projects.github")}
                    showError={Boolean(project.projectUrl)}
                  >
                    <Input
                      autoComplete="url"
                      id={`project-source-${project.id}`}
                      inputMode="url"
                      name={`projects[${index}].projectUrl`}
                      onChange={(event) =>
                        updateProject(project.id, { projectUrl: event.target.value })
                      }
                      placeholder="github.com/username/project"
                      spellCheck={false}
                      type="url"
                      value={project.projectUrl}
                    />
                  </FormField>
                  <FormField
                    error={getIssue(evaluation, `${prefix}.deployUrl`)}
                    id={`project-demo-${project.id}`}
                    label={t("projects.demo")}
                    showError={Boolean(project.deployUrl)}
                  >
                    <Input
                      autoComplete="url"
                      id={`project-demo-${project.id}`}
                      inputMode="url"
                      name={`projects[${index}].deployUrl`}
                      onChange={(event) =>
                        updateProject(project.id, { deployUrl: event.target.value })
                      }
                      placeholder="project.example.com"
                      spellCheck={false}
                      type="url"
                      value={project.deployUrl}
                    />
                  </FormField>
                </div>
                <FormField
                  error={getIssue(evaluation, `${prefix}.description`)}
                  hint={t("projects.descriptionHint")}
                  id={`project-description-${project.id}`}
                  label={t("projects.description")}
                  showError={description.length > 0 && description.length < 40}
                >
                  <textarea
                    aria-label={t("projects.description")}
                    className="cv-textarea"
                    id={`project-description-${project.id}`}
                    maxLength={900}
                    name={`projects[${index}].description`}
                    onChange={(event) =>
                      updateProject(project.id, { description: event.target.value })
                    }
                    placeholder={t("projects.descriptionPlaceholder")}
                    value={description}
                  />
                </FormField>
                <FormField
                  id={`project-tech-${project.id}`}
                  label={t("projects.tech")}
                  showError={false}
                >
                  <Input
                    id={`project-tech-${project.id}`}
                    name={`projects[${index}].technologies`}
                    onChange={(event) =>
                      updateProject(project.id, { technologies: event.target.value })
                    }
                    placeholder={t("projects.techPlaceholder")}
                    value={project.technologies}
                  />
                </FormField>
              </article>
            );
          })}
          <Button className="cv-add-another" onClick={addProject} variant="outline">
            <Plus /> {t("projects.addAnother")}
          </Button>
        </div>
      )}
    </div>
  );
}

function EducationEditor({
  evaluation,
  revealValidation,
}: Readonly<{ evaluation: CvEvaluation; revealValidation: boolean }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, addEducation, updateEducation, deleteEducation, moveEducation } =
    useCvBuilderStore();
  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("editor.step", { current: 5, total: 6 })}
        subtitle={t("education.subtitle")}
        title={t("education.title")}
      />
      {cvData.educations.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={addEducation} size="sm">
              <Plus /> {t("education.add")}
            </Button>
          }
          description={t("education.emptyDescription")}
          icon={<GraduationCap />}
          title={t("education.empty")}
        />
      ) : (
        <div className="cv-item-list">
          {cvData.educations.map((education, index) => {
            const prefix = `educations.${index}`;
            const title = education.schoolName || t("education.item", { index: index + 1 });
            return (
              <article
                aria-labelledby={`education-heading-${education.id}`}
                className="cv-item-card"
                key={education.id}
              >
                <header className="cv-item-card__header">
                  <div>
                    <span>{t("education.item", { index: index + 1 })}</span>
                    <h3 id={`education-heading-${education.id}`}>{title}</h3>
                  </div>
                  <ItemActions
                    index={index}
                    length={cvData.educations.length}
                    name={title}
                    onDelete={() => deleteEducation(education.id)}
                    onMove={(direction) => moveEducation(education.id, direction)}
                  />
                </header>
                <div className="cv-form-grid">
                  <FormField
                    error={getIssue(evaluation, `${prefix}.schoolName`)}
                    id={`education-school-${education.id}`}
                    label={t("education.school")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      autoComplete="organization"
                      id={`education-school-${education.id}`}
                      maxLength={200}
                      name={`educations[${index}].schoolName`}
                      onChange={(event) =>
                        updateEducation(education.id, { schoolName: event.target.value })
                      }
                      placeholder={t("education.schoolPlaceholder")}
                      value={education.schoolName}
                    />
                  </FormField>
                  <FormField
                    error={getIssue(evaluation, `${prefix}.degree`)}
                    id={`education-degree-${education.id}`}
                    label={t("education.degree")}
                    required
                    showError={revealValidation}
                  >
                    <Input
                      id={`education-degree-${education.id}`}
                      maxLength={150}
                      name={`educations[${index}].degree`}
                      onChange={(event) =>
                        updateEducation(education.id, { degree: event.target.value })
                      }
                      placeholder={t("education.degreePlaceholder")}
                      value={education.degree}
                    />
                  </FormField>
                  <FormField
                    id={`education-major-${education.id}`}
                    label={t("education.major")}
                    showError={false}
                  >
                    <Input
                      id={`education-major-${education.id}`}
                      maxLength={150}
                      name={`educations[${index}].major`}
                      onChange={(event) =>
                        updateEducation(education.id, { major: event.target.value })
                      }
                      placeholder={t("education.majorPlaceholder")}
                      value={education.major}
                    />
                  </FormField>
                  <FormField
                    error={getIssue(evaluation, `${prefix}.gpa`)}
                    id={`education-gpa-${education.id}`}
                    label={t("education.gpa")}
                    showError={Boolean(education.gpa)}
                  >
                    <Input
                      aria-invalid={Boolean(getIssue(evaluation, `${prefix}.gpa`))}
                      id={`education-gpa-${education.id}`}
                      name={`educations[${index}].gpa`}
                      onChange={(event) =>
                        updateEducation(education.id, { gpa: event.target.value })
                      }
                      placeholder="3.5/4.0"
                      value={education.gpa ?? ""}
                    />
                  </FormField>
                  <FormField
                    id={`education-start-${education.id}`}
                    label={t("education.start")}
                    showError={false}
                  >
                    <Input
                      id={`education-start-${education.id}`}
                      name={`educations[${index}].startDate`}
                      onChange={(event) =>
                        updateEducation(education.id, { startDate: event.target.value })
                      }
                      type="month"
                      value={education.startDate}
                    />
                  </FormField>
                  <FormField
                    error={getIssue(evaluation, `${prefix}.endDate`)}
                    id={`education-end-${education.id}`}
                    label={t("education.end")}
                    showError={Boolean(getIssue(evaluation, `${prefix}.endDate`))}
                  >
                    <Input
                      disabled={education.isCurrent}
                      id={`education-end-${education.id}`}
                      min={education.startDate || undefined}
                      name={`educations[${index}].endDate`}
                      onChange={(event) =>
                        updateEducation(education.id, { endDate: event.target.value })
                      }
                      type="month"
                      value={education.endDate}
                    />
                  </FormField>
                </div>
                <label className="cv-checkbox-row">
                  <input
                    aria-label={t("education.current")}
                    checked={education.isCurrent}
                    name={`educations[${index}].isCurrent`}
                    onChange={(event) =>
                      updateEducation(education.id, {
                        isCurrent: event.target.checked,
                        ...(event.target.checked ? { endDate: "" } : {}),
                      })
                    }
                    type="checkbox"
                  />
                  <span>{t("education.current")}</span>
                </label>
                <FormField
                  id={`education-description-${education.id}`}
                  label={t("education.description")}
                  showError={false}
                >
                  <textarea
                    aria-label={t("education.description")}
                    className="cv-textarea"
                    id={`education-description-${education.id}`}
                    maxLength={600}
                    name={`educations[${index}].description`}
                    onChange={(event) =>
                      updateEducation(education.id, { description: event.target.value })
                    }
                    placeholder={t("education.descriptionPlaceholder")}
                    value={toPlainText(education.description)}
                  />
                </FormField>
              </article>
            );
          })}
          <Button className="cv-add-another" onClick={addEducation} variant="outline">
            <Plus /> {t("education.addAnother")}
          </Button>
        </div>
      )}
    </div>
  );
}

function SkillsEditor({
  evaluation,
  revealValidation,
}: Readonly<{ evaluation: CvEvaluation; revealValidation: boolean }>) {
  const t = useTranslations("CvBuilder");
  const { cvData, addSkill, updateSkill, deleteSkill } = useCvBuilderStore();
  const generalIssue = getIssue(evaluation, "skills");
  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("editor.step", { current: 6, total: 6 })}
        subtitle={t("skills.subtitle")}
        title={t("skills.title")}
      />
      <div className="cv-writing-guide">
        <strong>{t("skills.guideTitle")}</strong>
        <p>{t("skills.guide")}</p>
      </div>
      {cvData.skills.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={addSkill} size="sm">
              <Plus /> {t("skills.add")}
            </Button>
          }
          description={t("skills.emptyDescription")}
          icon={<Wrench />}
          title={t("skills.empty")}
        />
      ) : (
        <div className="cv-skill-list">
          {cvData.skills.map((skill, index) => {
            const issue = getIssue(evaluation, `skills.${index}.name`);
            return (
              <div className="cv-skill-row" key={skill.id}>
                <div className="cv-form-field">
                  <Label htmlFor={`skill-name-${skill.id}`}>{t("skills.name")}</Label>
                  <Input
                    aria-describedby={
                      issue && revealValidation
                        ? `cv-error-${issue.path.replaceAll(".", "-")}`
                        : undefined
                    }
                    aria-invalid={Boolean(issue && revealValidation)}
                    id={`skill-name-${skill.id}`}
                    name={`skills[${index}].name`}
                    onChange={(event) => updateSkill(skill.id, { name: event.target.value })}
                    placeholder={t("skills.namePlaceholder")}
                    value={skill.name}
                  />
                  <FieldMessage issue={issue} visible={revealValidation} />
                </div>
                <div className="cv-form-field">
                  <Label htmlFor={`skill-level-${skill.id}`}>{t("skills.level")}</Label>
                  <select
                    className="cv-select"
                    id={`skill-level-${skill.id}`}
                    name={`skills[${index}].level`}
                    onChange={(event) =>
                      updateSkill(skill.id, { level: event.target.value as SkillLevel })
                    }
                    value={skill.level}
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {t(`skills.levels.${level.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  aria-label={t("actions.delete", {
                    name: skill.name || t("skills.item", { index: index + 1 }),
                  })}
                  className="cv-skill-delete"
                  onClick={() => deleteSkill(skill.id)}
                  type="button"
                >
                  <Trash aria-hidden="true" />
                </button>
              </div>
            );
          })}
          <Button className="cv-add-another" onClick={addSkill} variant="outline">
            <Plus /> {t("skills.addAnother")}
          </Button>
        </div>
      )}
      <FieldMessage issue={generalIssue} visible={Boolean(generalIssue)} />
    </div>
  );
}

function DesignEditor() {
  const t = useTranslations("CvBuilder");
  const {
    cvData,
    moveSection,
    renameSection,
    selectTemplate,
    setCvLanguage,
    toggleSectionVisibility,
    updateStyle,
  } = useCvBuilderStore();
  const hiddenSections = new Set(cvData.hiddenSections ?? []);
  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("styling.eyebrow")}
        subtitle={t("styling.subtitle")}
        title={t("styling.title")}
      />
      <fieldset className="cv-design-group">
        <legend>{t("styling.template")}</legend>
        <div className="cv-template-grid">
          {TEMPLATE_OPTIONS.map((template) => (
            <button
              aria-label={t(`styling.templates.${template}`)}
              aria-pressed={cvData.selectedTemplate === template}
              className={cn(
                "cv-template-option",
                cvData.selectedTemplate === template && "cv-template-option--selected",
              )}
              key={template}
              onClick={() => selectTemplate(template)}
              type="button"
            >
              <span
                className={`cv-template-thumbnail cv-template-thumbnail--${template}`}
                aria-hidden="true"
              >
                <span className="cv-template-mini-header">
                  <b />
                  <i />
                </span>
                <span className="cv-template-mini-section">
                  <b />
                  <i />
                  <i />
                </span>
                <span className="cv-template-mini-section">
                  <b />
                  <i />
                  <i />
                </span>
              </span>
              <span className="cv-template-copy">
                <strong>
                  {t(`styling.templates.${template}`)}
                  <em>{t("styling.atsBadge")}</em>
                </strong>
                <small>{t(`styling.templateDescriptions.${template}`)}</small>
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="cv-design-group">
        <legend>{t("styling.themeColor")}</legend>
        <div className="cv-color-options">
          {THEME_OPTIONS.map((theme) => (
            <button
              aria-label={t(`styling.colors.${theme.id}`)}
              aria-pressed={cvData.style.themeColor === theme.id}
              className={cn(
                "cv-color-option",
                cvData.style.themeColor === theme.id && "cv-color-option--selected",
              )}
              key={theme.id}
              onClick={() => updateStyle({ themeColor: theme.id })}
              style={{ "--swatch": theme.color } as CSSProperties}
              title={t(`styling.colors.${theme.id}`)}
              type="button"
            >
              {cvData.style.themeColor === theme.id ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="cv-design-grid">
        <FormField id="cv-font" label={t("styling.fontFamily")} showError={false}>
          <select
            className="cv-select"
            id="cv-font"
            name="fontFamily"
            onChange={(event) =>
              updateStyle({ fontFamily: event.target.value as CvData["style"]["fontFamily"] })
            }
            value={cvData.style.fontFamily}
          >
            <option value="font-sans">Inter / System</option>
            <option value="font-serif">Georgia</option>
            <option value="font-mono">Courier / Mono</option>
            <option value="font-outfit">Outfit</option>
          </select>
        </FormField>
        <FormField id="cv-language" label={t("styling.cvLanguage")} showError={false}>
          <select
            className="cv-select"
            id="cv-language"
            name="cvLanguage"
            onChange={(event) => setCvLanguage(event.target.value as CvData["cvLanguage"])}
            value={cvData.cvLanguage}
          >
            <option value="vi">{t("styling.cvLanguages.vi")}</option>
            <option value="en">{t("styling.cvLanguages.en")}</option>
          </select>
        </FormField>
      </div>
      <div className="cv-design-grid">
        <fieldset className="cv-design-group cv-design-group--compact">
          <legend>{t("styling.textSize")}</legend>
          <div className="cv-segmented-control">
            {(["sm", "base", "lg"] as const).map((size) => (
              <button
                aria-pressed={cvData.style.textSize === size}
                className={cvData.style.textSize === size ? "is-active" : undefined}
                key={size}
                onClick={() => updateStyle({ textSize: size })}
                type="button"
              >
                {t(`styling.textSizes.${size}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="cv-design-group cv-design-group--compact">
          <legend>{t("styling.marginSize")}</legend>
          <div className="cv-segmented-control">
            {(["sm", "base", "lg"] as const).map((size) => (
              <button
                aria-pressed={cvData.style.marginSize === size}
                className={cvData.style.marginSize === size ? "is-active" : undefined}
                key={size}
                onClick={() => updateStyle({ marginSize: size })}
                type="button"
              >
                {t(`styling.marginSizes.${size}`)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="cv-design-group">
        <h3>{t("styling.sectionsOrder")}</h3>
        <p>{t("styling.sectionsHint")}</p>
        <div className="cv-section-order-list">
          {cvData.sectionsOrder.map((section, index) => {
            const Icon = SECTION_ICONS[section];
            const isPersonal = section === "personal";
            const isHidden = hiddenSections.has(section);
            return (
              <div className={cn("cv-section-order-item", isHidden && "is-hidden")} key={section}>
                <Icon aria-hidden="true" />
                <Input
                  aria-label={t("styling.sectionName", { section: t(`tabs.${section}`) })}
                  disabled={isPersonal}
                  onChange={(event) => renameSection(section, event.target.value)}
                  value={cvData.customSectionNames?.[section] ?? t(`tabs.${section}`)}
                />
                <div>
                  <button
                    aria-label={t("actions.moveUp", { name: t(`tabs.${section}`) })}
                    disabled={isPersonal || index <= 1}
                    onClick={() => moveSection(section, "up")}
                    type="button"
                  >
                    <ArrowUp />
                  </button>
                  <button
                    aria-label={t("actions.moveDown", { name: t(`tabs.${section}`) })}
                    disabled={isPersonal || index === cvData.sectionsOrder.length - 1}
                    onClick={() => moveSection(section, "down")}
                    type="button"
                  >
                    <ArrowDown />
                  </button>
                  <button
                    aria-label={isHidden ? t("visibility.show") : t("visibility.hide")}
                    disabled={isPersonal}
                    onClick={() => toggleSectionVisibility(section)}
                    type="button"
                  >
                    {isHidden ? <EyeSlash /> : <Eye />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewEditor({
  evaluation,
  onFixIssue,
  onNavigate,
  pageCount,
}: Readonly<{
  evaluation: CvEvaluation;
  onFixIssue: (issue: CvIssue) => void;
  onNavigate: (section: CvEditorSectionKey) => void;
  pageCount: number;
}>) {
  const t = useTranslations("CvBuilder");
  const importantIssues = evaluation.issues
    .toSorted(
      (first, second) => Number(second.severity === "error") - Number(first.severity === "error"),
    )
    .slice(0, 8);
  const isReady = evaluation.exportReady;
  const signals = evaluation.contentSignals;
  const evidenceScore =
    signals.totalSkills > 0
      ? Math.round((signals.skillsWithEvidence / signals.totalSkills) * 100)
      : 0;

  return (
    <div className="cv-editor-section">
      <SectionHeading
        eyebrow={t("review.eyebrow")}
        subtitle={t("review.subtitle")}
        title={t("review.title")}
      />

      <section className={cn("cv-review-hero", isReady ? "is-ready" : "has-errors")}>
        <div className="cv-review-score">
          <strong>{evaluation.score}</strong>
          <span>/ 100</span>
        </div>
        <div>
          <span className="cv-review-status-badge">
            {isReady ? <CheckCircle aria-hidden="true" /> : <WarningCircle aria-hidden="true" />}
            {isReady ? t("review.exportable") : t("review.notExportable")}
          </span>
          <h3>{isReady ? t("review.readyTitle") : t("review.needsWorkTitle")}</h3>
          <p>
            {isReady
              ? t("review.readyDescription", { pages: pageCount })
              : t("review.needsWorkDescription", { count: evaluation.blockingIssues.length })}
          </p>
        </div>
      </section>

      <div className="cv-review-metrics">
        <div>
          <strong>{evaluation.blockingIssues.length}</strong>
          <span>{t("review.errors")}</span>
        </div>
        <div>
          <strong>{evaluation.issues.length - evaluation.blockingIssues.length}</strong>
          <span>{t("review.suggestions")}</span>
        </div>
        <div>
          <strong>{pageCount}</strong>
          <span>{t("review.pages")}</span>
        </div>
      </div>

      <section className="cv-review-insights" aria-labelledby="cv-review-insights-title">
        <div className="cv-review-section-heading">
          <div>
            <span>{t("review.insightsEyebrow")}</span>
            <h3 id="cv-review-insights-title">{t("review.insightsTitle")}</h3>
          </div>
          <p>{t("review.insightsDescription")}</p>
        </div>
        <div className="cv-insight-grid">
          <article>
            <span className="cv-insight-icon">
              <Crosshair aria-hidden="true" />
            </span>
            <div>
              <strong>
                {evaluation.jobMatch.score === null ? "—" : `${evaluation.jobMatch.score}%`}
              </strong>
              <h4>{t("review.keywordCoverage")}</h4>
              <p>
                {evaluation.jobMatch.hasDescription
                  ? t("review.keywordCoverageDescription", {
                      matched: evaluation.jobMatch.matched.length,
                      total: evaluation.jobMatch.total,
                    })
                  : t("review.keywordCoverageEmpty")}
              </p>
              <button onClick={() => onNavigate("targeting")} type="button">
                {t("review.openTargeting")} <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </article>
          <article>
            <span className="cv-insight-icon">
              <ChartLineUp aria-hidden="true" />
            </span>
            <div>
              <strong>
                {signals.quantifiedBullets}/{signals.totalBullets}
              </strong>
              <h4>{t("review.measurableImpact")}</h4>
              <p>{t("review.measurableImpactDescription")}</p>
              <button onClick={() => onNavigate("experience")} type="button">
                {t("review.improveExperience")} <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </article>
          <article>
            <span className="cv-insight-icon">
              <ShieldCheck aria-hidden="true" />
            </span>
            <div>
              <strong>{evidenceScore}%</strong>
              <h4>{t("review.skillEvidence")}</h4>
              <p>
                {t("review.skillEvidenceDescription", {
                  evidenced: signals.skillsWithEvidence,
                  total: signals.totalSkills,
                })}
              </p>
              <button onClick={() => onNavigate("skills")} type="button">
                {t("review.reviewSkills")} <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
        {signals.skillsWithoutEvidence.length > 0 ? (
          <div className="cv-evidence-gap">
            <strong>{t("review.skillsWithoutEvidence")}</strong>
            <div className="cv-keyword-list">
              {signals.skillsWithoutEvidence.slice(0, 8).map((skill) => (
                <span className="is-missing" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {evaluation.jobMatch.hasDescription ? (
        <section className="cv-review-keywords" aria-labelledby="cv-review-keywords-title">
          <div className="cv-review-section-heading">
            <div>
              <span>{t("review.jobEvidenceEyebrow")}</span>
              <h3 id="cv-review-keywords-title">{t("review.jobEvidenceTitle")}</h3>
            </div>
            <p>{t("review.jobEvidenceDescription")}</p>
          </div>
          <div className="cv-review-keyword-columns">
            <div>
              <strong>{t("targeting.matchedKeywords")}</strong>
              <div className="cv-keyword-list">
                {evaluation.jobMatch.matched.map((item) => (
                  <span className="is-matched" key={item.keyword}>
                    <Check aria-hidden="true" /> {item.keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <strong>{t("targeting.missingKeywords")}</strong>
              <div className="cv-keyword-list">
                {evaluation.jobMatch.missing.map((keyword) => (
                  <span className="is-missing" key={keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="cv-review-list" aria-labelledby="cv-review-checklist-title">
        <div className="cv-review-section-heading">
          <div>
            <span>{t("review.checklistEyebrow")}</span>
            <h3 id="cv-review-checklist-title">{t("review.checklist")}</h3>
          </div>
          <p>{t("review.checklistDescription")}</p>
        </div>
        {importantIssues.length > 0 ? (
          <ul>
            {importantIssues.map((issue) => (
              <li key={`${issue.path}-${issue.code}`}>
                <span className={issue.severity === "error" ? "is-error" : "is-warning"}>
                  {issue.severity === "error" ? <WarningCircle /> : <Info />}
                </span>
                <p>{t(`validation.${issue.code}`)}</p>
                <button onClick={() => onFixIssue(issue)} type="button">
                  {t("review.fix")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="cv-review-empty">
            <CheckCircle />
            <p>{t("review.noIssues")}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function CandidateCvBuilder() {
  const t = useTranslations("CvBuilder");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCvId = searchParams.get("cvId");
  const { cvData, draftSavedAt, past, future, clearCv, redo, setCvData, undo } =
    useCvBuilderStore();
  const [activeSection, setActiveSection] = useState<CvEditorSectionKey>("targeting");
  const [workspaceMode, setWorkspaceMode] = useState<"edit" | "preview">("edit");
  const [zoom, setZoom] = useState(0.82);
  const [previewHeight, setPreviewHeight] = useState(1123);
  const [pageCount, setPageCount] = useState(1);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<CandidateProfileApi | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [saveCvDialogOpen, setSaveCvDialogOpen] = useState(false);
  const [saveCvTitle, setSaveCvTitle] = useState("");
  const [saveCvError, setSaveCvError] = useState<string | null>(null);
  const [savingCv, setSavingCv] = useState(false);
  const [savedBuilderCv, setSavedBuilderCv] = useState<SavedBuilderCv | null>(null);
  const [savedSnapshotSignature, setSavedSnapshotSignature] = useState<string | null>(null);
  // Đúng thời điểm ứng viên nghĩ mình "đã xong" (dialog hướng dẫn in) là chỗ
  // duy nhất đáng tin cậy để nhắc: in/xuất PDF không tạo ra bản ghi CV nào cả —
  // chỉ "Lưu CV" mới làm việc đó, và đó là thứ hệ thống ứng tuyển cần.
  const [hasSavedCvThisSession, setHasSavedCvThisSession] = useState(false);
  const [exportDialog, setExportDialog] = useState<"closed" | "blocked" | "guide">("closed");
  const [revealValidation, setRevealValidation] = useState(false);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const evaluation = useMemo(() => evaluateCv(cvData), [cvData]);
  const snapshotSignature = useMemo(() => JSON.stringify(cvData), [cvData]);
  const hasUnsyncedServerChanges = Boolean(
    savedBuilderCv && savedSnapshotSignature !== snapshotSignature,
  );

  const measurePreview = useCallback(() => {
    const element = previewRef.current;
    if (!element) return;
    const height = Math.max(1123, element.scrollHeight);
    setPreviewHeight(height);
    setPageCount(Math.max(1, Math.ceil(height / 1123)));
  }, []);

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;
    measurePreview();
    const observer = new ResizeObserver(measurePreview);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measurePreview]);

  const fitPreviewToViewport = useCallback(() => {
    const viewport = previewViewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    const styles = window.getComputedStyle(viewport);
    const availableWidth =
      viewport.clientWidth -
      Number.parseFloat(styles.paddingLeft) -
      Number.parseFloat(styles.paddingRight);
    const fittedZoom = Math.min(
      MAX_PREVIEW_ZOOM,
      Math.max(MIN_PREVIEW_ZOOM, availableWidth / PREVIEW_WIDTH),
    );
    setZoom((current) => (Math.abs(current - fittedZoom) < 0.005 ? current : fittedZoom));
  }, []);

  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;
    const frame = window.requestAnimationFrame(fitPreviewToViewport);
    const observer = new ResizeObserver(fitPreviewToViewport);
    observer.observe(viewport);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fitPreviewToViewport, workspaceMode]);

  useEffect(() => {
    const session = getCandidateSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    void (async () => {
      const hasScopedDraft = window.localStorage.getItem(getCvBuilderStorageKey(session.user.id));
      if (!hasScopedDraft) {
        useCvBuilderStore.setState({
          cvData: createInitialCvData(locale === "en" ? "en" : "vi"),
          draftSavedAt: null,
          future: [],
          past: [],
        });
      }
      await useCvBuilderStore.persist.rehydrate();
      if (cancelled) return;
      setAuthReady(true);

      try {
        const [candidateProfile, requestedCv] = await Promise.all([
          getMyCandidateProfile(session.accessToken),
          requestedCvId
            ? getCandidateCv(session.accessToken, requestedCvId)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setProfile(candidateProfile);
        if (requestedCv) {
          if (requestedCv.source !== "BUILDER") {
            setProfileNotice(t("serverSave.uploadedCvNotEditable"));
          } else {
            const latestVersion = [...requestedCv.versions].sort(
              (left, right) =>
                right.versionNo - left.versionNo ||
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
            )[0];
            const snapshot = latestVersion ? parseCvSnapshot(latestVersion.contentJson) : null;
            if (snapshot) {
              useCvBuilderStore.getState().setCvData(snapshot);
              setSavedBuilderCv({
                id: requestedCv.id,
                title: requestedCv.title,
                version: requestedCv.version,
              });
              setSavedSnapshotSignature(JSON.stringify(snapshot));
            } else {
              setProfileNotice(t("serverSave.builderSnapshotMissing"));
            }
          }
        } else if (isCvEmpty(useCvBuilderStore.getState().cvData)) {
          useCvBuilderStore
            .getState()
            .hydrateCvData(
              mapProfileToCvData(candidateProfile, useCvBuilderStore.getState().cvData),
            );
        }
      } catch {
        // A local draft remains fully usable when the optional profile request is unavailable.
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, requestedCvId, router, t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, textarea, select") ||
        target?.isContentEditable ||
        target?.closest("[contenteditable='true']")
      ) {
        return;
      }
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          useCvBuilderStore.getState().redo();
        } else {
          useCvBuilderStore.getState().undo();
        }
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        useCvBuilderStore.getState().redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Bản nháp tự lưu vào localStorage đồng bộ nên không sao — cái duy nhất có
   * thể mất là lượt "Lưu CV" đang gửi lên server (`saveSnapshotToUpNext`), một
   * request bất đồng bộ không có gì cảnh báo trước đây nếu người dùng đóng tab
   * giữa chừng. Theo đúng pattern đã dùng ở `profile-editor.tsx`.
   */
  useEffect(() => {
    if (!savingCv && !hasUnsyncedServerChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsyncedServerChanges, savingCv]);

  const requestProfileSync = async () => {
    setProfileNotice(null);
    if (profile) {
      setSyncDialogOpen(true);
      return;
    }
    const session = getCandidateSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setProfileLoading(true);
    try {
      const candidateProfile = await getMyCandidateProfile(session.accessToken);
      setProfile(candidateProfile);
      setSyncDialogOpen(true);
    } catch {
      setProfileNotice(t("profileSync.error"));
    } finally {
      setProfileLoading(false);
    }
  };

  const applyProfile = () => {
    if (!profile) return;
    setCvData(mapProfileToCvData(profile, useCvBuilderStore.getState().cvData));
    setSyncDialogOpen(false);
    setProfileNotice(t("profileSync.success"));
  };

  const requestExport = () => {
    setRevealValidation(true);
    if (!evaluation.exportReady) {
      setExportDialog("blocked");
      return;
    }
    setExportDialog("guide");
  };

  const requestSaveToUpNext = () => {
    if (savedBuilderCv) {
      void saveSnapshotToUpNext();
      return;
    }
    const role = cvData.targetJob.role.trim() || cvData.personalInfo.title.trim();
    const company = cvData.targetJob.company.trim();
    setSaveCvTitle([role || t("serverSave.defaultTitle"), company].filter(Boolean).join(" · "));
    setSaveCvError(null);
    setSaveCvDialogOpen(true);
  };

  const saveSnapshotToUpNext = async () => {
    const session = getCandidateSession();
    const title = (savedBuilderCv?.title ?? saveCvTitle).trim();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!title) return;

    setSavingCv(true);
    setSaveCvError(null);
    setProfileNotice(null);
    try {
      const status = evaluation.exportReady ? "ACTIVE" : "DRAFT";
      if (savedBuilderCv) {
        const saved = await createCandidateBuilderVersion(session.accessToken, savedBuilderCv.id, {
          contentJson: cvData as unknown as Record<string, unknown>,
          parsedText: createCvSnapshotText(cvData),
          status,
          title,
          expectedVersion: savedBuilderCv.version,
        });
        setSavedBuilderCv({ id: saved.cv.id, title: saved.cv.title, version: saved.cv.version });
      } else {
        const saved = await createCandidateCv(session.accessToken, {
          contentJson: cvData as unknown as Record<string, unknown>,
          isDefault: status === "ACTIVE",
          parsedText: createCvSnapshotText(cvData),
          source: "BUILDER",
          status,
          title,
        });
        setSavedBuilderCv({ id: saved.id, title: saved.title, version: saved.version });
      }
      setSaveCvDialogOpen(false);
      setHasSavedCvThisSession(true);
      setSavedSnapshotSignature(snapshotSignature);
      setProfileNotice(
        t(evaluation.exportReady ? "serverSave.success" : "serverSave.draftSuccess", { title }),
      );
    } catch {
      setSaveCvError(t("serverSave.error"));
    } finally {
      setSavingCv(false);
    }
  };

  const proceedToPrint = () => {
    setExportDialog("closed");
    window.setTimeout(() => window.print(), 100);
  };

  const savedLabel = draftSavedAt
    ? t("save.savedAt", {
        time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
          new Date(draftSavedAt),
        ),
      })
    : t("save.autosaveReady");

  const navItems: Array<{ id: CvEditorSectionKey; label: string }> = [
    { id: "targeting", label: t("tabs.targeting") },
    ...CONTENT_SECTIONS.map((id) => ({ id, label: t(`tabs.${id}`) })),
    { id: "review", label: t("tabs.review") },
    { id: "styling", label: t("tabs.styling") },
  ];
  const activeIndex = EDITOR_SEQUENCE.indexOf(activeSection);
  const previousSection = activeIndex > 0 ? EDITOR_SEQUENCE[activeIndex - 1] : undefined;
  const nextSection =
    activeIndex >= 0 && activeIndex < EDITOR_SEQUENCE.length - 1
      ? EDITOR_SEQUENCE[activeIndex + 1]
      : undefined;

  const goToSection = (section: CvEditorSectionKey) => {
    setActiveSection(section);
    setWorkspaceMode("edit");
    window.requestAnimationFrame(() => editorScrollRef.current?.scrollTo({ top: 0 }));
  };

  const focusIssue = (section: CvEditorSectionKey, issue?: CvIssue) => {
    setRevealValidation(true);
    goToSection(section);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const sectionRoot =
          editorScrollRef.current?.querySelector<HTMLElement>(".cv-editor-section");
        const issueMessageId = issue ? `cv-error-${issue.path.replaceAll(".", "-")}` : undefined;
        const target =
          (issueMessageId
            ? sectionRoot?.querySelector<HTMLElement>(`[aria-describedby~="${issueMessageId}"]`)
            : undefined) ??
          sectionRoot?.querySelector<HTMLElement>(
            '[aria-invalid="true"], input[required]:invalid, textarea[required]:invalid, button',
          );
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: "center" });
      });
    });
  };

  const goToIssueSection = (section: CvEditorSectionKey) => focusIssue(section);
  const goToIssue = (issue: CvIssue) => focusIssue(issue.section, issue);

  const renderEditor = () => {
    switch (activeSection) {
      case "targeting":
        return <TargetingEditor evaluation={evaluation} />;
      case "personal":
        return <PersonalEditor evaluation={evaluation} revealValidation={revealValidation} />;
      case "summary":
        return <SummaryEditor evaluation={evaluation} />;
      case "experience":
        return <ExperienceEditor evaluation={evaluation} revealValidation={revealValidation} />;
      case "projects":
        return <ProjectsEditor evaluation={evaluation} revealValidation={revealValidation} />;
      case "education":
        return <EducationEditor evaluation={evaluation} revealValidation={revealValidation} />;
      case "skills":
        return <SkillsEditor evaluation={evaluation} revealValidation={revealValidation} />;
      case "review":
        return (
          <ReviewEditor
            evaluation={evaluation}
            onFixIssue={goToIssue}
            onNavigate={goToSection}
            pageCount={pageCount}
          />
        );
      case "styling":
        return <DesignEditor />;
    }
  };

  if (!authReady) {
    return (
      <main className="cv-builder-loading" aria-live="polite">
        <span />
        <p>{t("loading")}</p>
      </main>
    );
  }

  return (
    <main className="cv-builder-shell">
      <header className="cv-builder-topbar">
        <div className="cv-builder-brand">
          <button
            aria-label={t("backToProfile")}
            onClick={() => router.push("/candidate/profile")}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <span className="cv-builder-brand__mark" aria-hidden="true">
            U
          </span>
          <div>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
        </div>
        <div className="cv-builder-status-cluster">
          <button
            className="cv-target-context"
            onClick={() => goToSection("targeting")}
            type="button"
          >
            <Crosshair aria-hidden="true" />
            <span>
              <small>{t("targeting.contextLabel")}</small>
              <strong>{cvData.targetJob.role || t("targeting.contextEmpty")}</strong>
            </span>
          </button>
          <div className="cv-builder-save-state" aria-live="polite">
            <ShieldCheck aria-hidden="true" />
            <span>{savedLabel}</span>
            <small>{t("save.localOnly")}</small>
          </div>
        </div>
        <div className="cv-builder-toolbar">
          <div className="cv-history-actions">
            <button
              aria-label={t("actions.undo")}
              disabled={past.length === 0}
              onClick={undo}
              title={t("actions.undo")}
              type="button"
            >
              <ArrowCounterClockwise />
            </button>
            <button
              aria-label={t("actions.redo")}
              disabled={future.length === 0}
              onClick={redo}
              title={t("actions.redo")}
              type="button"
            >
              <ArrowClockwise />
            </button>
          </div>
          <Button
            aria-label={t("profileSync.button")}
            className="cv-toolbar-secondary"
            disabled={profileLoading}
            onClick={() => void requestProfileSync()}
            size="sm"
            variant="outline"
          >
            <ArrowClockwise /> <span>{t("profileSync.buttonShort")}</span>
          </Button>
          <Button
            aria-label={t("reset")}
            className="cv-toolbar-danger"
            onClick={() => setClearDialogOpen(true)}
            size="sm"
            variant="ghost"
          >
            <Trash /> <span>{t("resetShort")}</span>
          </Button>
          <Button
            aria-label={t("export")}
            className="cv-toolbar-secondary"
            onClick={requestExport}
            size="sm"
            variant="outline"
          >
            <DownloadSimple /> <span>{t("export")}</span>
          </Button>
          {/*
            Đây là nút DUY NHẤT tạo ra bản ghi CV mà hệ thống ứng tuyển dùng
            được (xem `saveSnapshotToUpNext`) — "Export" chỉ gọi `window.print()`.
            Trước đây "Export" là nút nổi bật nhất (variant mặc định) còn nút
            này là outline, khiến ứng viên hoàn thành CV, bấm Export, in/lưu PDF
            rồi tưởng đã xong — trong khi chưa có gì để đính kèm khi ứng tuyển.
          */}
          <Button
            aria-label={t("serverSave.button")}
            className="cv-toolbar-save"
            onClick={requestSaveToUpNext}
            size="sm"
          >
            <CheckCircle /> <span>{t("serverSave.buttonShort")}</span>
          </Button>
        </div>
      </header>

      {profileNotice ? (
        <div className="cv-profile-notice" aria-live="polite">
          <Info aria-hidden="true" />
          <span>{profileNotice}</span>
          <button
            aria-label={t("actions.dismiss")}
            onClick={() => setProfileNotice(null)}
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}

      <fieldset className="cv-mobile-mode-switch">
        <legend className="sr-only">{t("mobile.viewMode")}</legend>
        <button
          aria-pressed={workspaceMode === "edit" && activeSection !== "review"}
          onClick={() => {
            if (activeSection === "review") goToSection("targeting");
            else setWorkspaceMode("edit");
          }}
          type="button"
        >
          <FileText /> {t("mobile.edit")}
        </button>
        <button
          aria-pressed={workspaceMode === "preview"}
          onClick={() => setWorkspaceMode("preview")}
          type="button"
        >
          <Eye /> {t("mobile.preview")}
        </button>
        <button
          aria-pressed={workspaceMode === "edit" && activeSection === "review"}
          onClick={() => goToSection("review")}
          type="button"
        >
          <ListChecks /> {t("mobile.review")}
        </button>
      </fieldset>

      <div className="cv-builder-workspace">
        <aside
          className={cn("cv-builder-sidebar", workspaceMode === "preview" && "cv-mobile-hidden")}
        >
          <button
            className={cn("cv-sidebar-target", activeSection === "targeting" && "is-active")}
            onClick={() => goToSection("targeting")}
            type="button"
          >
            <span aria-hidden="true">
              <Crosshair />
            </span>
            <span>
              <small>{t("targeting.sidebarLabel")}</small>
              <strong>{cvData.targetJob.role || t("targeting.sidebarEmpty")}</strong>
              {cvData.targetJob.company ? <em>{cvData.targetJob.company}</em> : null}
            </span>
            <ArrowRight aria-hidden="true" />
          </button>
          <section className="cv-progress-card" aria-labelledby="cv-progress-title">
            <div>
              <p id="cv-progress-title">{t("assistant.completeness")}</p>
              <strong>{evaluation.score}%</strong>
            </div>
            <progress
              aria-label={t("assistant.completenessValue", { score: evaluation.score })}
              className="cv-progress-track"
              max={100}
              value={evaluation.score}
            />
            <small>{t("assistant.progressHint")}</small>
          </section>
          <nav aria-label={t("navigation.label")} className="cv-section-navigation">
            <p>{t("navigation.content")}</p>
            {navItems.map((item, index) => {
              const Icon = SECTION_ICONS[item.id];
              const sectionEvaluation =
                item.id in evaluation.sections
                  ? evaluation.sections[item.id as CvSectionKey]
                  : null;
              const active = activeSection === item.id;
              return (
                <button
                  aria-current={active ? "step" : undefined}
                  className={cn("cv-section-nav-item", active && "is-active")}
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  type="button"
                >
                  <span className="cv-section-nav-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="cv-section-nav-label">
                    <strong>{item.label}</strong>
                    <small>
                      {item.id === "targeting"
                        ? evaluation.jobMatch.hasDescription
                          ? t("navigation.matchStatus", { score: evaluation.jobMatch.score ?? 0 })
                          : t("navigation.targetStatus")
                        : item.id === "review"
                          ? t("navigation.reviewStatus", {
                              count: evaluation.blockingIssues.length,
                            })
                          : item.id === "styling"
                            ? t("navigation.designStatus")
                            : sectionEvaluation
                              ? t(`status.${sectionEvaluation.status}`)
                              : ""}
                    </small>
                  </span>
                  {sectionEvaluation ? (
                    <span
                      aria-label={t(`status.${sectionEvaluation.status}`)}
                      className={cn("cv-section-status", `is-${sectionEvaluation.status}`)}
                    >
                      {sectionEvaluation.status === "complete" ? <Check /> : index + 1}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="cv-local-draft-note">
            <ShieldCheck aria-hidden="true" />
            <p>
              <strong>{t("save.privateTitle")}</strong>
              <span>{t("save.privateDescription")}</span>
            </p>
          </div>
        </aside>

        <section
          aria-label={t("editor.label")}
          className={cn("cv-builder-editor", workspaceMode === "preview" && "cv-mobile-hidden")}
        >
          <div className="cv-builder-editor-scroll" ref={editorScrollRef}>
            {renderEditor()}
          </div>
          <footer className="cv-editor-footer">
            <div>
              <span>
                {t("workflow.progress", {
                  current: activeIndex + 1,
                  total: EDITOR_SEQUENCE.length,
                })}
              </span>
              <strong>{t(`tabs.${activeSection}`)}</strong>
            </div>
            <div>
              <Button
                disabled={!previousSection}
                onClick={() => previousSection && goToSection(previousSection)}
                size="sm"
                variant="outline"
              >
                <ArrowLeft aria-hidden="true" /> {t("workflow.previous")}
              </Button>
              {nextSection ? (
                <Button onClick={() => goToSection(nextSection)} size="sm">
                  {t("workflow.next", { section: t(`tabs.${nextSection}`) })}
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={requestExport} size="sm">
                  <DownloadSimple aria-hidden="true" /> {t("workflow.export")}
                </Button>
              )}
            </div>
          </footer>
        </section>

        <section
          aria-label={t("preview.title")}
          className={cn(
            "cv-builder-preview",
            workspaceMode === "edit" && "cv-preview-mobile-hidden",
          )}
        >
          <header className="cv-preview-toolbar">
            <div>
              <strong>{t("preview.title")}</strong>
              <span className={pageCount > 2 ? "is-warning" : undefined}>
                {t("preview.pageCount", { count: pageCount })}
              </span>
            </div>
            <span className="cv-preview-active-section">
              {t("preview.editing", { section: t(`tabs.${activeSection}`) })}
            </span>
            <fieldset className="cv-zoom-control">
              <legend className="sr-only">{t("preview.zoom")}</legend>
              <button aria-label={t("preview.fit")} onClick={fitPreviewToViewport} type="button">
                <ArrowsInSimple />
              </button>
              <button
                aria-label={t("preview.zoomOut")}
                disabled={zoom <= MIN_PREVIEW_ZOOM}
                onClick={() => setZoom((value) => Math.max(MIN_PREVIEW_ZOOM, value - 0.1))}
                type="button"
              >
                <Minus />
              </button>
              <output>{Math.round(zoom * 100)}%</output>
              <button
                aria-label={t("preview.zoomIn")}
                disabled={zoom >= MAX_PREVIEW_ZOOM}
                onClick={() => setZoom((value) => Math.min(MAX_PREVIEW_ZOOM, value + 0.1))}
                type="button"
              >
                <Plus />
              </button>
            </fieldset>
          </header>
          <div className="cv-preview-scroll" ref={previewViewportRef}>
            <div
              className="cv-preview-scale-frame"
              style={{ height: previewHeight * zoom, width: PREVIEW_WIDTH * zoom }}
            >
              <div className="cv-preview-scale" style={{ transform: `scale(${zoom})` }}>
                <CvPreview
                  activeSection={
                    CONTENT_SECTIONS.includes(activeSection as CvSectionKey)
                      ? (activeSection as CvSectionKey)
                      : undefined
                  }
                  cvData={cvData}
                  ref={previewRef}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Dialog onOpenChange={setSyncDialogOpen} open={syncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profileSync.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("profileSync.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="cv-dialog-callout">
            <Info />
            <p>
              <strong>{t("profileSync.replaceTitle")}</strong>
              <span>{t("profileSync.replaceDescription")}</span>
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSyncDialogOpen(false)} variant="outline">
              {t("actions.cancel")}
            </Button>
            <Button onClick={applyProfile}>
              <ArrowClockwise /> {t("profileSync.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setClearDialogOpen} open={clearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clearDialog.title")}</DialogTitle>
            <DialogDescription>{t("clearDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setClearDialogOpen(false)} variant="outline">
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() => {
                clearCv();
                setClearDialogOpen(false);
                setActiveSection("personal");
              }}
              variant="destructive"
            >
              <Trash /> {t("clearDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!savingCv) {
            setSaveCvDialogOpen(open);
            if (!open) setSaveCvError(null);
          }
        }}
        open={saveCvDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("serverSave.title")}</DialogTitle>
            <DialogDescription>{t("serverSave.description")}</DialogDescription>
          </DialogHeader>
          <FormField id="cv-server-title" label={t("serverSave.nameLabel")} showError={false}>
            <Input
              autoComplete="off"
              id="cv-server-title"
              maxLength={150}
              name="cvTitle"
              onChange={(event) => setSaveCvTitle(event.target.value)}
              placeholder={t("serverSave.namePlaceholder")}
              value={saveCvTitle}
            />
          </FormField>
          <p className="cv-server-save-note">
            <Info aria-hidden="true" />
            <span>
              {t(evaluation.exportReady ? "serverSave.activeNote" : "serverSave.draftNote")}
            </span>
          </p>
          {saveCvError ? (
            <p className="cv-field-message cv-field-message--error" role="alert">
              <WarningCircle aria-hidden="true" />
              {saveCvError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={savingCv}
              onClick={() => {
                setSaveCvDialogOpen(false);
                setSaveCvError(null);
              }}
              variant="outline"
            >
              {t("actions.cancel")}
            </Button>
            <Button
              disabled={savingCv || !saveCvTitle.trim()}
              onClick={() => void saveSnapshotToUpNext()}
            >
              {savingCv ? (
                <ArrowClockwise aria-hidden="true" className="animate-spin" />
              ) : (
                <CheckCircle aria-hidden="true" />
              )}
              {savingCv ? t("serverSave.saving") : t("serverSave.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => setExportDialog(open ? "blocked" : "closed")}
        open={exportDialog === "blocked"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("exportValidation.title")}</DialogTitle>
            <DialogDescription>
              {t("exportValidation.description", { count: evaluation.blockingIssues.length })}
            </DialogDescription>
          </DialogHeader>
          <ul className="cv-dialog-issues">
            {evaluation.blockingIssues.slice(0, 5).map((issue) => (
              <li key={`${issue.path}-${issue.code}`}>
                <WarningCircle /> {t(`validation.${issue.code}`)}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              onClick={() => {
                setExportDialog("closed");
                goToIssueSection(evaluation.blockingIssues[0]?.section ?? "personal");
              }}
            >
              {t("exportValidation.fix")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => setExportDialog(open ? "guide" : "closed")}
        open={exportDialog === "guide"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pdfGuide.title")}</DialogTitle>
            <DialogDescription>{t("pdfGuide.subtitle")}</DialogDescription>
          </DialogHeader>
          <ol className="cv-print-guide">
            <li>
              <span>1</span>
              <p>{t("pdfGuide.destination")}</p>
            </li>
            <li>
              <span>2</span>
              <p>{t("pdfGuide.margin")}</p>
            </li>
            <li>
              <span>3</span>
              <p>{t("pdfGuide.graphics")}</p>
            </li>
            <li>
              <span>4</span>
              <p>{t("pdfGuide.headerFooter")}</p>
            </li>
          </ol>
          {hasSavedCvThisSession && !hasUnsyncedServerChanges ? null : (
            <div className="cv-print-guide-save-warning">
              <WarningCircle aria-hidden="true" />
              <p>{t("pdfGuide.notSavedWarning")}</p>
              <Button
                onClick={() => {
                  setExportDialog("closed");
                  requestSaveToUpNext();
                }}
                size="sm"
                variant="outline"
              >
                <CheckCircle /> {t("serverSave.buttonShort")}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setExportDialog("closed")} variant="outline">
              {t("actions.cancel")}
            </Button>
            <Button onClick={proceedToPrint}>
              <DownloadSimple /> {t("pdfGuide.proceed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default CandidateCvBuilder;
