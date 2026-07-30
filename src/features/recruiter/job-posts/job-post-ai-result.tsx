"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Check,
  DotsSixVertical,
  DownloadSimple,
  NotePencil,
  Plus,
  Sparkle,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

import type {
  GenerateJobPostDraftPayload,
  JobOption,
  JobPostAiDraftResponse,
  JobPostCatalogs,
  JobPostPresentationStyle,
  JobPostWorkMode,
} from "@/features/recruiter/job-posts/api";
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
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

type JobPostAiResultProps = Readonly<{
  companyName: string;
  catalogs: JobPostCatalogs;
  payload: GenerateJobPostDraftPayload;
  response: JobPostAiDraftResponse;
  onCreateJobPost: () => void;
  isCreatingJobPost?: boolean;
  onExit: () => void;
  isExitDialogOpen: boolean;
  onExitDialogOpenChange: (open: boolean) => void;
  onDraftChange: (patch: Partial<JobPostAiDraftResponse["draft"]>) => void;
  onPayloadChange: (patch: Partial<GenerateJobPostDraftPayload>) => void;
  onSuggestionsChange: (patch: Partial<JobPostAiDraftResponse["suggestions"]>) => void;
  sectionOrder: ReadonlyArray<string>;
  onSectionOrderChange: (order: string[]) => void;
  customSections: ReadonlyArray<CustomJobPostSection>;
  onCustomSectionsChange: (sections: CustomJobPostSection[]) => void;
  aside?: React.ReactNode;
}>;

/** A block the recruiter added themselves, on top of the ones the AI produces. */
export type CustomJobPostSection = {
  id: string;
  title: string;
  content: string;
};

const CUSTOM_SECTION_PREFIX = "custom-";

function isCustomSectionId(id: string) {
  return id.startsWith(CUSTOM_SECTION_PREFIX);
}

type SectionKey =
  | "about"
  | "roleContext"
  | "roleImpact"
  | "requirements"
  | "description"
  | "benefits";

const STYLE_SECTION_ORDER: Record<JobPostPresentationStyle, SectionKey[]> = {
  traditional: ["about", "roleContext", "roleImpact", "description", "requirements", "benefits"],
  value_focused: ["about", "roleContext", "roleImpact", "description", "requirements", "benefits"],
  skill_focused: ["about", "requirements", "roleContext", "roleImpact", "description", "benefits"],
};

export function getDefaultSectionOrder(style: JobPostPresentationStyle): string[] {
  return [...STYLE_SECTION_ORDER[style]];
}

const SECTION_TITLES = {
  vi: {
    about: "Về công ty",
    roleContext: "Bối cảnh vị trí",
    roleImpact: "Tác động của vai trò",
    requirements: "Yêu cầu công việc",
    description: "Mô tả công việc",
    benefits: "Quyền lợi / Phúc lợi",
  },
  en: {
    about: "About us",
    roleContext: "Role context",
    roleImpact: "Role impact",
    requirements: "Job requirements",
    description: "Job description",
    benefits: "Benefits",
  },
} as const satisfies Record<"vi" | "en", Record<SectionKey, string>>;

const EDIT_TEXTAREA_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const EDIT_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const EDIT_FIELD_LABEL_CLASS = "text-xs font-medium tracking-wide text-slate-500 uppercase";

const WORK_MODE_OPTIONS: Record<"vi" | "en", JobOption[]> = {
  vi: [
    { id: "onsite", name: "Tại văn phòng" },
    { id: "hybrid", name: "Hybrid" },
    { id: "remote", name: "Remote" },
  ],
  en: [
    { id: "onsite", name: "On-site" },
    { id: "hybrid", name: "Hybrid" },
    { id: "remote", name: "Remote" },
  ],
};

const WORK_MODE_LABELS = {
  vi: {
    onsite: "Tại văn phòng",
    hybrid: "Hybrid",
    remote: "Remote",
  },
  en: {
    onsite: "On-site",
    hybrid: "Hybrid",
    remote: "Remote",
  },
} as const;

const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 297;
const PDF_IMAGE_QUALITY = 0.95;
const PDF_CONTINUATION_MARGIN_MM = 12;
const PDF_CAPTURE_SCALE = 2;
const PDF_FOOTER_CLASS = "ai-jd-document-footer";
const PDF_FOOTER_BLEED_PX = 8;

/**
 * html2canvas clones the document into an iframe and resolves styles there, but the clone's own
 * <link> stylesheets race the render: often enough they lose, and the capture comes out with no app
 * CSS at all (serif text, no colours, no layout). Injecting the live CSS synchronously into the
 * clone removes the race, so every export is identical instead of occasionally unusable.
 */
function inlineDocumentStyles(clonedDocument: Document) {
  const css = Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText);
      } catch {
        // Cross-origin sheets are unreadable and never carry this document's design.
        return [];
      }
    })
    // Re-declaring @font-face makes the iframe re-download the font, and text is measured before
    // it arrives — which visibly eats the spaces between words. The already-loaded FontFace
    // objects are handed over below instead.
    .filter((rule) => !rule.startsWith("@font-face"))
    .join("\n");

  document.fonts.forEach((font) => {
    if (font.status === "loaded") clonedDocument.fonts.add(font);
  });

  if (!css) return;

  const style = clonedDocument.createElement("style");
  style.textContent = css;
  clonedDocument.head.append(style);
}

/**
 * Marks every horizontal row of the render that carries no ink.
 *
 * Page breaks are chosen from these rows rather than from DOM rectangles: element and line boxes
 * do not map onto the rasterised canvas closely enough, and being a few pixels out slices a row of
 * glyphs in half. A blank row provably cannot.
 */
function findBlankRows(canvas: HTMLCanvasElement) {
  const blank = new Uint8Array(canvas.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return blank;

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const rowBytes = canvas.width * 4;

  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * rowBytes;
    let isBlank = 1;
    for (let index = rowStart; index < rowStart + rowBytes; index += 4) {
      // Near-white is background: only real ink should block a break.
      if (data[index]! < 245 || data[index + 1]! < 245 || data[index + 2]! < 245) {
        isBlank = 0;
        break;
      }
    }
    blank[y] = isBlank;
  }

  return blank;
}

function isBlankRange(blankRows: Uint8Array, from: number, to: number) {
  for (let y = Math.max(0, from); y < to; y += 1) {
    if (!blankRows[y]) return false;
  }
  return true;
}

/**
 * Picks where one page ends: the lowest blank row that still fills most of the page, falling back
 * to a hard cut so a solid block taller than a page can never stall the loop or lose content.
 */
function pickPageBreak(blankRows: Uint8Array, start: number, limit: number, available: number) {
  const earliest = start + Math.floor(available * 0.75);

  for (let y = limit; y > earliest; y -= 1) {
    if (blankRows[y]) return y;
  }

  return limit;
}

const BLOCK_CONTROL_BUTTON_CLASS =
  "flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700";

const CONTROL_BAR_CLASS =
  "ai-jd-no-print absolute z-10 flex items-center gap-0.5 rounded-full border border-slate-200 bg-white/95 px-1 py-1 shadow-sm transition-opacity";

/** Hover-to-reveal edit affordance for blocks that are not part of the sortable list. */
function HoverEditWrapper({
  label,
  isEditing,
  showControls,
  onToggleEdit,
  controlsClassName = "top-0 right-0",
  children,
}: Readonly<{
  label: string;
  isEditing: boolean;
  showControls: boolean;
  onToggleEdit: () => void;
  controlsClassName?: string;
  children: ReactNode;
}>) {
  return (
    <div className="group relative">
      <div
        className={cn(
          CONTROL_BAR_CLASS,
          controlsClassName,
          isEditing || showControls
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <EditToggleButton isEditing={isEditing} label={label} onToggle={onToggleEdit} />
      </div>
      {children}
    </div>
  );
}

function MetaTextField({
  label,
  value,
  onChange,
  type = "text",
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}>) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className={EDIT_FIELD_LABEL_CLASS}>{label}</span>
      <input
        type={type}
        {...(type === "number" ? { min: 0, max: 50, step: 1 } : {})}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={EDIT_INPUT_CLASS}
      />
    </label>
  );
}

function MetaSelectField({
  label,
  value,
  options,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  options: ReadonlyArray<JobOption>;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={EDIT_FIELD_LABEL_CLASS}>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={label}
          className="upnext-focus h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 shadow-none"
        >
          <SelectValue placeholder="Chưa xác định" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="font-normal">
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SalaryEditField({
  language,
  salaryMin,
  salaryMax,
  isNegotiable,
  onChange,
}: Readonly<{
  language: "vi" | "en";
  salaryMin: number | null;
  salaryMax: number | null;
  isNegotiable: boolean;
  onChange: (patch: Partial<JobPostAiDraftResponse["draft"]>) => void;
}>) {
  const toSalary = (value: string) => {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
      <span className={EDIT_FIELD_LABEL_CLASS}>{language === "en" ? "Salary" : "Mức lương"}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          step={500_000}
          aria-label={language === "en" ? "Minimum salary" : "Mức lương tối thiểu"}
          placeholder={language === "en" ? "From" : "Từ"}
          disabled={isNegotiable}
          value={salaryMin ?? ""}
          onChange={(event) => onChange({ salaryMin: toSalary(event.target.value) })}
          className={cn(EDIT_INPUT_CLASS, "w-32", isNegotiable && "opacity-50")}
        />
        <span className="text-sm text-slate-400">–</span>
        <input
          type="number"
          min={0}
          step={500_000}
          aria-label={language === "en" ? "Maximum salary" : "Mức lương tối đa"}
          placeholder={language === "en" ? "To" : "Đến"}
          disabled={isNegotiable}
          value={salaryMax ?? ""}
          onChange={(event) => onChange({ salaryMax: toSalary(event.target.value) })}
          className={cn(EDIT_INPUT_CLASS, "w-32", isNegotiable && "opacity-50")}
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-normal text-slate-600">
          <input
            type="checkbox"
            aria-label={language === "en" ? "Negotiable salary" : "Lương thỏa thuận"}
            checked={isNegotiable}
            onChange={(event) => onChange({ salaryIsNegotiable: event.target.checked })}
            className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          {language === "en" ? "Negotiable" : "Thỏa thuận"}
        </label>
      </div>
    </div>
  );
}

function EditToggleButton({
  isEditing,
  label,
  onToggle,
}: Readonly<{ isEditing: boolean; label: string; onToggle: () => void }>) {
  return (
    <button
      type="button"
      aria-label={isEditing ? `Xong: ${label}` : `Chỉnh sửa: ${label}`}
      title={isEditing ? "Xong" : "Chỉnh sửa"}
      onClick={onToggle}
      className={cn(
        BLOCK_CONTROL_BUTTON_CLASS,
        isEditing && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      )}
    >
      {isEditing ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <NotePencil size={16} aria-hidden="true" />
      )}
    </button>
  );
}

/** Wraps a block so its edit/drag controls only surface on hover, focus, or edit mode. */
function SortableSection({
  id,
  label,
  isEditing,
  showControls,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleEdit,
  onDelete,
  children,
}: Readonly<{
  id: string;
  label: string;
  isEditing: boolean;
  showControls: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleEdit: () => void;
  onDelete?: () => void;
  children: ReactNode;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative", isDragging && "z-10 opacity-80")}
    >
      <div
        className={cn(
          CONTROL_BAR_CLASS,
          "top-0 right-0",
          isEditing || showControls
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          aria-label={`Kéo để sắp xếp lại: ${label}`}
          title="Kéo để sắp xếp lại"
          className={cn(BLOCK_CONTROL_BUTTON_CLASS, "cursor-grab active:cursor-grabbing")}
          {...attributes}
          {...listeners}
        >
          <DotsSixVertical size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Di chuyển lên: ${label}`}
          title="Di chuyển lên"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className={cn(
            BLOCK_CONTROL_BUTTON_CLASS,
            "disabled:opacity-30 disabled:hover:bg-transparent",
          )}
        >
          <ArrowUp size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Di chuyển xuống: ${label}`}
          title="Di chuyển xuống"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className={cn(
            BLOCK_CONTROL_BUTTON_CLASS,
            "disabled:opacity-30 disabled:hover:bg-transparent",
          )}
        >
          <ArrowDown size={16} aria-hidden="true" />
        </button>
        <EditToggleButton isEditing={isEditing} label={label} onToggle={onToggleEdit} />
        {onDelete ? (
          <button
            type="button"
            aria-label={`Xóa mục: ${label}`}
            title="Xóa mục"
            onClick={onDelete}
            className={cn(BLOCK_CONTROL_BUTTON_CLASS, "hover:bg-rose-50 hover:text-rose-600")}
          >
            <Trash size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Removable chip list plus an "add" control, used to edit the skill groups inline. */
function EditableChipGroup({
  label,
  chipClassName,
  items,
  onRemove,
  addControl,
}: Readonly<{
  label: string;
  chipClassName: string;
  items: ReadonlyArray<{ id: string; name: string }>;
  onRemove: (id: string) => void;
  addControl: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={EDIT_FIELD_LABEL_CLASS}>{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <span
            key={item.id}
            className={cn(
              "inline-flex min-h-7 items-center gap-1 rounded-full border px-3 py-1 text-xs leading-4 font-medium",
              chipClassName,
            )}
          >
            {item.name}
            <button
              type="button"
              aria-label={`Xóa ${item.name} khỏi ${label}`}
              onClick={() => onRemove(item.id)}
              className="-mr-1 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={11} aria-hidden="true" />
            </button>
          </span>
        ))}
        {addControl}
      </div>
    </div>
  );
}

/** Picks one catalog skill at a time; resets after each pick so it acts as an "add" button. */
function AddSkillSelect({
  label,
  options,
  onAdd,
}: Readonly<{
  label: string;
  options: ReadonlyArray<JobOption>;
  onAdd: (id: string) => void;
}>) {
  if (options.length === 0) return null;

  return (
    <Select value="" onValueChange={onAdd}>
      <SelectTrigger
        aria-label={label}
        className="upnext-focus h-7 w-auto gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 text-xs font-medium text-slate-500 shadow-none"
      >
        <SelectValue placeholder="+ Thêm" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id} className="font-normal">
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Free-text keyword input for skills that are not in the catalog. */
function AddKeywordInput({
  label,
  onAdd,
}: Readonly<{ label: string; onAdd: (name: string) => void }>) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <input
      aria-label={label}
      value={draft}
      placeholder="+ Thêm từ khóa"
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === ",") {
          event.preventDefault();
          commit();
        }
      }}
      onBlur={commit}
      className="focus:border-primary h-7 w-36 rounded-full border border-dashed border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 outline-none placeholder:text-slate-400"
    />
  );
}

export function JobPostAiResult({
  companyName,
  catalogs,
  payload,
  response,
  onCreateJobPost,
  isCreatingJobPost = false,
  onExit,
  isExitDialogOpen,
  onExitDialogOpenChange,
  onDraftChange,
  onPayloadChange,
  onSuggestionsChange,
  sectionOrder,
  onSectionOrderChange,
  customSections,
  onCustomSectionsChange,
  aside,
}: JobPostAiResultProps) {
  const style = payload.presentationStyle;
  const isEnglish = payload.outputLanguage === "en";
  const language = payload.outputLanguage;
  const sectionTitles = SECTION_TITLES[language];
  const experience = findOption(catalogs.experienceLevels, response.draft.experienceLevelId);
  const employmentType = findOption(catalogs.employmentTypes, response.draft.employmentTypeId);
  const specialization = findOption(catalogs.specializations, response.draft.specializationIds[0]);
  const requiredSkillOptions = resolveSkillOptions(catalogs.skills, payload.requiredSkillIds);
  const preferredSkillOptions = resolveSkillOptions(catalogs.skills, payload.preferredSkillIds);
  const requiredSkills = requiredSkillOptions.map((option) => option.name);
  const preferredSkills = preferredSkillOptions.map((option) => option.name);
  const otherSkills = [
    ...(payload.keywords ?? []),
    ...response.suggestions.unmatchedSkillNames,
  ].filter((name, index, names) => names.indexOf(name) === index);
  const hasBenefits = hasRichText(response.draft.benefits);
  const hasRoleContext = Boolean(payload.productOrDomain || payload.teamContext);
  const hasRequirements = Boolean(
    requiredSkills.length ||
    preferredSkills.length ||
    otherSkills.length ||
    hasRichText(response.draft.requirements),
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAllControls, setShowAllControls] = useState(false);

  const toggleSectionEdit = (key: string) =>
    setEditingSection((current) => (current === key ? null : key));

  const closeAllEditors = () => {
    setEditingSection(null);
    setIsEditingHeader(false);
    setIsEditingMeta(false);
  };

  const toggleEditMode = () => {
    setShowAllControls((current) => {
      if (current) closeAllEditors();
      return !current;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** A block is shown only when it has content — or while it is being edited. */
  function sectionHasContent(key: string): boolean {
    if (editingSection === key) return true;
    // A block the recruiter added stays until they delete it, even while still empty.
    if (isCustomSectionId(key)) {
      return customSections.some((section) => section.id === key);
    }

    switch (key) {
      case "about":
        return Boolean(payload.companyDescription?.trim());
      case "roleContext":
        return hasRoleContext;
      case "roleImpact":
        return Boolean(payload.roleObjective?.trim());
      case "requirements":
        return hasRequirements;
      case "description":
        return hasRichText(response.draft.description);
      case "benefits":
        return hasBenefits;
      default:
        return false;
    }
  }

  function getSectionLabel(key: string): string {
    if (isCustomSectionId(key)) {
      const custom = customSections.find((section) => section.id === key);
      return custom?.title.trim() || (isEnglish ? "New section" : "Mục mới");
    }
    return sectionTitles[key as SectionKey];
  }

  const addCustomSection = () => {
    const usedNumbers = customSections.map((section) =>
      Number(section.id.slice(CUSTOM_SECTION_PREFIX.length)),
    );
    const nextNumber = (usedNumbers.length ? Math.max(...usedNumbers) : 0) + 1;
    const id = `${CUSTOM_SECTION_PREFIX}${nextNumber}`;

    onCustomSectionsChange([
      ...customSections,
      { id, title: isEnglish ? "New section" : "Mục mới", content: "" },
    ]);
    onSectionOrderChange([...sectionOrder, id]);
    setEditingSection(id);
  };

  const updateCustomSection = (id: string, patch: Partial<CustomJobPostSection>) =>
    onCustomSectionsChange(
      customSections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    );

  const removeCustomSection = (id: string) => {
    if (editingSection === id) setEditingSection(null);
    onCustomSectionsChange(customSections.filter((section) => section.id !== id));
    onSectionOrderChange(sectionOrder.filter((key) => key !== id));
  };

  const visibleSections = sectionOrder.filter((key) => sectionHasContent(key));

  /** Moves a block one step within the *visible* blocks, so hidden keys never absorb a click. */
  const moveSection = (key: string, direction: -1 | 1) => {
    const neighbour = visibleSections[visibleSections.indexOf(key) + direction];
    if (!neighbour) return;

    const next = [...sectionOrder];
    const from = next.indexOf(key);
    const to = next.indexOf(neighbour);
    next[from] = neighbour;
    next[to] = key;
    onSectionOrderChange(next);
  };

  const removeSkillId = (group: "requiredSkillIds" | "preferredSkillIds", id: string) =>
    onPayloadChange({ [group]: (payload[group] ?? []).filter((skillId) => skillId !== id) });

  const addSkillId = (group: "requiredSkillIds" | "preferredSkillIds", id: string) =>
    onPayloadChange({ [group]: [...(payload[group] ?? []), id] });

  /**
   * The "related" chips merge free keywords with the AI's unmatched-skill suggestions, so any
   * edit collapses both into `keywords` and clears the suggestions to keep one source of truth.
   */
  const setRelatedSkills = (names: string[]) => {
    onPayloadChange({ keywords: names });
    onSuggestionsChange({ unmatchedSkillNames: [] });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sectionOrder.indexOf(String(active.id));
    const newIndex = sectionOrder.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onSectionOrderChange(arrayMove([...sectionOrder], oldIndex, newIndex));
  };

  /**
   * Renders one JD block. Only blocks the AI actually produced content for are
   * rendered — an empty block would be a phantom section the recruiter never asked for.
   */
  function renderSection(key: string): ReactNode {
    const isEditing = editingSection === key;
    if (!sectionHasContent(key)) return null;

    if (isCustomSectionId(key)) {
      const custom = customSections.find((section) => section.id === key);
      if (!custom) return null;

      return (
        <section>
          {isEditing ? (
            <input
              aria-label={isEnglish ? "Section title" : "Tiêu đề mục"}
              value={custom.title}
              placeholder={isEnglish ? "Section title" : "Tiêu đề mục"}
              onChange={(event) => updateCustomSection(key, { title: event.target.value })}
              className="focus:border-primary focus:ring-primary mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-lg font-bold text-slate-950 outline-none focus:ring-1"
            />
          ) : (
            <h3 className="mb-3 text-lg font-bold text-slate-950">{getSectionLabel(key)}</h3>
          )}
          {isEditing ? (
            <RichTextEditor
              value={custom.content}
              onChange={(value) => updateCustomSection(key, { content: value })}
              placeholder={isEnglish ? "Section content..." : "Nội dung của mục..."}
            />
          ) : hasRichText(custom.content) ? (
            <div
              className="space-y-3 text-[15px] leading-7 font-normal text-slate-700 [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:font-normal [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: custom.content }}
            />
          ) : (
            <p className="text-sm font-normal text-slate-400 italic">
              {isEnglish
                ? "Empty section — add content or delete it."
                : "Mục này còn trống — thêm nội dung hoặc xóa đi."}
            </p>
          )}
        </section>
      );
    }

    switch (key) {
      case "about": {
        return (
          <DocumentSection title={sectionTitles.about}>
            {isEditing ? (
              <textarea
                aria-label={sectionTitles.about}
                value={payload.companyDescription ?? ""}
                onChange={(event) => onPayloadChange({ companyDescription: event.target.value })}
                rows={3}
                className={EDIT_TEXTAREA_CLASS}
              />
            ) : (
              <p className="leading-7 font-normal text-slate-700">{payload.companyDescription}</p>
            )}
          </DocumentSection>
        );
      }
      case "roleContext": {
        if (!isEditing) {
          return (
            <RoleContextSection
              productOrDomain={payload.productOrDomain}
              teamContext={payload.teamContext}
              language={language}
            />
          );
        }
        return (
          <DocumentSection title={sectionTitles.roleContext}>
            <div className="grid gap-3 sm:grid-cols-2">
              {payload.productOrDomain?.trim() ? (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {isEnglish ? "Product / domain" : "Sản phẩm / lĩnh vực"}
                  </span>
                  <textarea
                    aria-label={isEnglish ? "Product / domain" : "Sản phẩm / lĩnh vực"}
                    value={payload.productOrDomain ?? ""}
                    onChange={(event) => onPayloadChange({ productOrDomain: event.target.value })}
                    rows={2}
                    className={EDIT_TEXTAREA_CLASS}
                  />
                </label>
              ) : null}
              {payload.teamContext?.trim() ? (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {isEnglish ? "Engineering team & delivery" : "Đội ngũ & cách triển khai"}
                  </span>
                  <textarea
                    aria-label={
                      isEnglish ? "Engineering team & delivery" : "Đội ngũ & cách triển khai"
                    }
                    value={payload.teamContext ?? ""}
                    onChange={(event) => onPayloadChange({ teamContext: event.target.value })}
                    rows={2}
                    className={EDIT_TEXTAREA_CLASS}
                  />
                </label>
              ) : null}
            </div>
          </DocumentSection>
        );
      }
      case "roleImpact": {
        return (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
              {sectionTitles.roleImpact}
            </p>
            {isEditing ? (
              <textarea
                aria-label={sectionTitles.roleImpact}
                value={payload.roleObjective ?? ""}
                onChange={(event) => onPayloadChange({ roleObjective: event.target.value })}
                rows={2}
                className={cn(EDIT_TEXTAREA_CLASS, "mt-2")}
              />
            ) : (
              <p className="mt-2 text-base leading-7 font-medium text-emerald-950">
                {payload.roleObjective}
              </p>
            )}
          </div>
        );
      }
      case "requirements": {
        const hasSkillChips = Boolean(
          requiredSkills.length || preferredSkills.length || otherSkills.length,
        );
        const unusedSkills = catalogs.skills.filter(
          (skill) =>
            !(payload.requiredSkillIds ?? []).includes(skill.id) &&
            !(payload.preferredSkillIds ?? []).includes(skill.id),
        );
        return (
          <DocumentSection
            title={sectionTitles.requirements}
            className="ai-jd-skill-section"
            // The small uppercase group labels sit tight under the heading and read as one block;
            // this section needs more air than a section whose body is plain paragraphs.
            titleClassName="mb-5"
          >
            {isEditing ? (
              <div className="space-y-3">
                <EditableChipGroup
                  label={isEnglish ? "Required" : "Bắt buộc"}
                  chipClassName="border-emerald-200 bg-emerald-50 text-emerald-800"
                  items={requiredSkillOptions}
                  onRemove={(id) => removeSkillId("requiredSkillIds", id)}
                  addControl={
                    <AddSkillSelect
                      label={isEnglish ? "Add required skill" : "Thêm kỹ năng bắt buộc"}
                      options={unusedSkills}
                      onAdd={(id) => addSkillId("requiredSkillIds", id)}
                    />
                  }
                />
                <EditableChipGroup
                  label={isEnglish ? "Preferred" : "Ưu tiên"}
                  chipClassName="border-sky-200 bg-sky-50 text-sky-800"
                  items={preferredSkillOptions}
                  onRemove={(id) => removeSkillId("preferredSkillIds", id)}
                  addControl={
                    <AddSkillSelect
                      label={isEnglish ? "Add preferred skill" : "Thêm kỹ năng ưu tiên"}
                      options={unusedSkills}
                      onAdd={(id) => addSkillId("preferredSkillIds", id)}
                    />
                  }
                />
                <EditableChipGroup
                  label={isEnglish ? "Related" : "Liên quan"}
                  chipClassName="border-slate-200 bg-slate-50 text-slate-700"
                  items={otherSkills.map((name) => ({ id: name, name }))}
                  onRemove={(name) =>
                    setRelatedSkills(otherSkills.filter((current) => current !== name))
                  }
                  addControl={
                    <AddKeywordInput
                      label={isEnglish ? "Add related keyword" : "Thêm từ khóa liên quan"}
                      onAdd={(name) =>
                        otherSkills.includes(name)
                          ? undefined
                          : setRelatedSkills([...otherSkills, name])
                      }
                    />
                  }
                />
              </div>
            ) : (
              <SkillChips
                requiredSkills={requiredSkills}
                preferredSkills={preferredSkills}
                otherSkills={otherSkills}
                language={language}
                compact={style !== "skill_focused"}
              />
            )}
            {isEditing ? (
              <div className="mt-4">
                <RichTextEditor
                  value={response.draft.requirements}
                  onChange={(value) => onDraftChange({ requirements: value })}
                  placeholder={
                    isEnglish ? "Additional job requirements..." : "Yêu cầu công việc bổ sung..."
                  }
                />
              </div>
            ) : hasRichText(response.draft.requirements) ? (
              <div
                className={cn(
                  "space-y-3 text-[15px] leading-7 font-normal text-slate-700 [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:font-normal [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
                  hasSkillChips && "mt-4",
                )}
                dangerouslySetInnerHTML={{ __html: response.draft.requirements }}
              />
            ) : null}
          </DocumentSection>
        );
      }
      case "description": {
        return (
          <DocumentSection title={sectionTitles.description}>
            {isEditing ? (
              <RichTextEditor
                value={response.draft.description}
                onChange={(value) => onDraftChange({ description: value })}
                placeholder={isEnglish ? "Job description..." : "Mô tả công việc..."}
              />
            ) : (
              <div
                className="space-y-3 text-[15px] leading-7 font-normal text-slate-700 [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:font-normal [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: response.draft.description }}
              />
            )}
          </DocumentSection>
        );
      }
      case "benefits": {
        return (
          <DocumentSection title={sectionTitles.benefits}>
            {isEditing ? (
              <RichTextEditor
                value={response.draft.benefits}
                onChange={(value) => onDraftChange({ benefits: value })}
                placeholder={isEnglish ? "Benefits..." : "Quyền lợi / phúc lợi..."}
              />
            ) : (
              <div
                className="space-y-3 text-[15px] leading-7 font-normal text-slate-700 [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:font-normal [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: response.draft.benefits }}
              />
            )}
          </DocumentSection>
        );
      }
      default:
        return null;
    }
  }

  /**
   * Captures the live document once and slices that single image across A4 pages.
   * Rebuilding the layout into fixed-height page containers (the previous approach) silently
   * dropped anything taller than one page, so the rendered document is now the source of truth.
   */
  const exportPdf = async () => {
    // Close any open editor first so the PDF captures rendered content, not a TipTap toolbar.
    closeAllEditors();
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      await document.fonts.ready;

      // Read the DOM only after the awaits above, so React has committed the closed editors.
      const area = document.getElementById("ai-jd-print-area");
      if (!area) return;

      const previousWidth = area.style.width;
      let canvas: HTMLCanvasElement;
      let footerCanvas: HTMLCanvasElement | null = null;
      let footerLeft = 0;
      let footerBoxHeight = 0;
      try {
        // Pin the document to a real A4 width so `min-h-[297mm]` maps to exactly one page,
        // no matter how wide the viewport happens to render the preview.
        area.style.width = `${PDF_PAGE_WIDTH_MM}mm`;

        const footerElement = area.querySelector<HTMLElement>(`.${PDF_FOOTER_CLASS}`);

        canvas = await html2canvas(area, {
          scale: PDF_CAPTURE_SCALE,
          useCORS: true,
          backgroundColor: "#ffffff",
          // The footer is left out of the flow capture and stamped onto the last page below:
          // letting it flow parks it directly under the final line, halfway up the paper.
          ignoreElements: (node) =>
            (node.classList?.contains("ai-jd-no-print") ?? false) || node === footerElement,
          onclone: inlineDocumentStyles,
        });

        if (footerElement) {
          footerLeft = Math.round(
            (footerElement.getBoundingClientRect().left - area.getBoundingClientRect().left) *
              PDF_CAPTURE_SCALE,
          );
          footerBoxHeight = footerElement.offsetHeight * PDF_CAPTURE_SCALE;
          footerCanvas = await html2canvas(footerElement, {
            scale: PDF_CAPTURE_SCALE,
            useCORS: true,
            backgroundColor: "#ffffff",
            // Descenders overshoot the line box, and capturing the element on its own crops at its
            // border edge — which shears the bottom off "Công ty ..." and "Powered by UpNext AI".
            height: footerElement.offsetHeight + PDF_FOOTER_BLEED_PX,
            onclone: inlineDocumentStyles,
          });
        }
      } finally {
        area.style.width = previousWidth;
      }

      const blankRows = findBlankRows(canvas);
      const pageHeight = Math.floor((canvas.width * PDF_PAGE_HEIGHT_MM) / PDF_PAGE_WIDTH_MM);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeight;
      const context = pageCanvas.getContext("2d");
      if (!context) return;

      const pdf = new jsPDF("p", "mm", "a4");
      // The document's own padding only cushions the very top and bottom of the whole article, so
      // every page break needs its own breathing room or the text sits flush against the paper cut.
      const marginPx = Math.round((PDF_CONTINUATION_MARGIN_MM / PDF_PAGE_HEIGHT_MM) * pageHeight);
      // A short JD is padded out to a full A4 by `min-h`, and that padding is not content: trailing
      // blank rows must never become a page of their own.
      let contentHeight = canvas.height;
      while (contentHeight > 1 && blankRows[contentHeight - 1]) contentHeight -= 1;

      let start = 0;
      let pageIndex = 0;

      for (;;) {
        // The first page keeps its top edge: the coloured document header is meant to bleed.
        const topInset = pageIndex === 0 ? 0 : marginPx;
        const fullAvailable = pageHeight - topInset - marginPx;
        // Space the footer needs at the foot of the page, capped so a stray tall footer can never
        // squeeze the text area down to nothing. `marginPx` also keeps it off the last line.
        const footerReserve = footerCanvas
          ? Math.min(footerBoxHeight + marginPx, Math.floor(fullAvailable / 2))
          : 0;
        // The last page is the first one whose remaining content still leaves room for the footer.
        // A tail that only overflows by blank rows still counts: those rows carry nothing, and
        // spilling them would cost a whole extra sheet.
        const textRoom = fullAvailable - footerReserve;
        const isLastPage =
          contentHeight - start <= textRoom ||
          isBlankRange(blankRows, start + textRoom, contentHeight);
        const available = isLastPage ? fullAvailable - footerReserve : fullAvailable;
        const limit = Math.min(start + available, contentHeight);
        const end = isLastPage ? contentHeight : pickPageBreak(blankRows, start, limit, available);
        const sliceHeight = Math.max(0, Math.min(end - start, available));

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        if (sliceHeight > 0) {
          context.drawImage(
            canvas,
            0,
            start,
            canvas.width,
            sliceHeight,
            0,
            topInset,
            canvas.width,
            sliceHeight,
          );
        }

        if (isLastPage && footerCanvas) {
          // Align the footer's own box with the bottom margin; the bleed strip below it may spill
          // into that margin, which is empty paper anyway.
          context.drawImage(footerCanvas, footerLeft, pageHeight - marginPx - footerBoxHeight);
        }

        if (pageIndex > 0) pdf.addPage();
        // JPEG keeps a text-on-white page visually identical to PNG at a fraction of the size;
        // a lossless page costs ~10 MB, which makes a multi-page JD undownloadable.
        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY),
          "JPEG",
          0,
          0,
          PDF_PAGE_WIDTH_MM,
          PDF_PAGE_HEIGHT_MM,
        );

        if (isLastPage) break;

        start = end;
        pageIndex += 1;
      }

      pdf.save(`${toFileName(response.draft.title)}-JD.pdf`);
    } catch (error) {
      console.error("Export PDF error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-5" aria-label="Kết quả tạo JD từ AI">
      <style>{PRINT_STYLES}</style>

      <div className="ai-jd-no-print sticky -top-4 z-30 -mx-4 -mt-4 flex flex-col gap-3 border-y border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:-top-8 md:-mx-8 md:-mt-8 md:px-8">
        <p className="text-sm leading-5 font-normal text-slate-600">
          Đưa chuột vào từng khối để chỉnh sửa nội dung hoặc kéo sắp xếp lại thứ tự.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onExitDialogOpenChange(true)}
            className="font-medium"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Thoát
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={showAllControls}
            onClick={toggleEditMode}
            className={cn("font-medium", showAllControls && "border-emerald-500 text-emerald-700")}
          >
            {showAllControls ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <NotePencil size={17} aria-hidden="true" />
            )}
            {showAllControls ? "Xong" : "Chỉnh sửa JD"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={exportPdf}
            disabled={isExporting}
            className="font-medium"
          >
            <DownloadSimple size={18} aria-hidden="true" />
            {isExporting ? "Đang xuất..." : "Xuất PDF"}
          </Button>
          <Button
            type="button"
            onClick={onCreateJobPost}
            disabled={isCreatingJobPost}
            className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          >
            {isCreatingJobPost ? "AI đang điền form..." : "Tạo tin tuyển dụng từ JD này"}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/*
        The paper column is sized in millimetres, not in grid fractions: a fraction of the viewport
        renders the A4 sheet narrower than the export, so the preview stops matching the PDF.
        `flex-wrap` lets the aside drop underneath on its own once it no longer fits beside it.
      */}
      <div className="flex flex-wrap items-start gap-6">
        <div className="max-w-full shrink-0 grow-0 basis-[210mm] space-y-5">
          <article
            id="ai-jd-print-area"
            className={cn(
              "mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col overflow-hidden bg-white text-slate-800 shadow-sm ring-1 ring-slate-200",
              style === "value_focused" && "ring-emerald-200",
              style === "skill_focused" && "ring-sky-200",
            )}
          >
            <DocumentHeader
              title={response.draft.title}
              specializationId={response.draft.specializationIds[0] ?? ""}
              specializationName={specialization?.name}
              specializations={catalogs.specializations}
              style={style}
              language={payload.outputLanguage}
              isEditing={isEditingHeader}
              showControls={showAllControls}
              onToggleEdit={() => setIsEditingHeader((current) => !current)}
              onTitleChange={(value) => onDraftChange({ title: value })}
              onSpecializationChange={(value) =>
                onDraftChange({ specializationIds: value ? [value] : [] })
              }
            />

            <div className="ai-jd-document-body flex flex-1 flex-col gap-7 px-6 py-7 sm:px-10 sm:py-9">
              <HoverEditWrapper
                label={isEnglish ? "Job details" : "Thông tin vị trí"}
                isEditing={isEditingMeta}
                showControls={showAllControls}
                onToggleEdit={() => setIsEditingMeta((current) => !current)}
                controlsClassName="-top-5 right-0"
              >
                {isEditingMeta ? (
                  <div className="grid grid-cols-1 gap-4 border-b border-slate-200 pb-6 sm:grid-cols-3">
                    <MetaSelectField
                      label={isEnglish ? "Level" : "Cấp bậc"}
                      value={response.draft.experienceLevelId ?? ""}
                      options={catalogs.experienceLevels}
                      onChange={(value) => onDraftChange({ experienceLevelId: value || null })}
                    />
                    <MetaTextField
                      label={isEnglish ? "Experience (years)" : "Kinh nghiệm (số năm)"}
                      type="number"
                      value={payload.yearsOfExperience ?? ""}
                      onChange={(value) => onPayloadChange({ yearsOfExperience: value })}
                    />
                    <MetaSelectField
                      label={isEnglish ? "Employment" : "Loại hình"}
                      value={response.draft.employmentTypeId ?? ""}
                      options={catalogs.employmentTypes}
                      onChange={(value) => onDraftChange({ employmentTypeId: value || null })}
                    />
                    <MetaSelectField
                      label={isEnglish ? "Work mode" : "Hình thức"}
                      value={payload.workMode ?? ""}
                      options={WORK_MODE_OPTIONS[payload.outputLanguage]}
                      onChange={(value) => onPayloadChange({ workMode: value as JobPostWorkMode })}
                    />
                    <MetaTextField
                      label={isEnglish ? "Schedule" : "Thời gian"}
                      value={response.draft.workingDays ?? ""}
                      onChange={(value) => onDraftChange({ workingDays: value || null })}
                    />
                    <SalaryEditField
                      language={payload.outputLanguage}
                      salaryMin={response.draft.salaryMin}
                      salaryMax={response.draft.salaryMax}
                      isNegotiable={response.draft.salaryIsNegotiable}
                      onChange={onDraftChange}
                    />
                  </div>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-slate-200 pb-6 text-sm sm:grid-cols-3">
                    <MetaItem label={isEnglish ? "Level" : "Cấp bậc"} value={experience?.name} />
                    <MetaItem
                      label={isEnglish ? "Experience" : "Kinh nghiệm"}
                      value={formatExperience(payload.yearsOfExperience, payload.outputLanguage)}
                    />
                    <MetaItem
                      label={isEnglish ? "Employment" : "Loại hình"}
                      value={employmentType?.name}
                    />
                    <MetaItem
                      label={isEnglish ? "Work mode" : "Hình thức"}
                      value={
                        payload.workMode
                          ? WORK_MODE_LABELS[payload.outputLanguage][payload.workMode]
                          : undefined
                      }
                    />
                    <MetaItem
                      label={isEnglish ? "Schedule" : "Thời gian"}
                      value={response.draft.workingDays}
                    />
                    <MetaItem
                      label={isEnglish ? "Salary" : "Mức lương"}
                      value={formatDocumentSalary(response, payload.outputLanguage)}
                    />
                  </dl>
                )}
              </HoverEditWrapper>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={visibleSections} strategy={verticalListSortingStrategy}>
                  {visibleSections.map((key, index) => {
                    const node = renderSection(key);
                    if (!node) return null;
                    return (
                      <SortableSection
                        key={key}
                        id={key}
                        label={getSectionLabel(key)}
                        isEditing={editingSection === key}
                        showControls={showAllControls}
                        canMoveUp={index > 0}
                        canMoveDown={index < visibleSections.length - 1}
                        onMoveUp={() => moveSection(key, -1)}
                        onMoveDown={() => moveSection(key, 1)}
                        onToggleEdit={() => toggleSectionEdit(key)}
                        {...(isCustomSectionId(key)
                          ? { onDelete: () => removeCustomSection(key) }
                          : {})}
                      >
                        {node}
                      </SortableSection>
                    );
                  })}
                </SortableContext>
              </DndContext>

              <button
                type="button"
                onClick={addCustomSection}
                className="ai-jd-no-print flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-emerald-400 hover:text-emerald-700"
              >
                <Plus size={16} aria-hidden="true" />
                {isEnglish ? "Add a section" : "Thêm mục mới"}
              </button>

              <footer className="ai-jd-document-footer mt-auto flex items-center justify-between border-t border-slate-200 pt-5 text-xs font-normal text-slate-500">
                <span>{companyName}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkle
                    size={13}
                    weight="fill"
                    className="text-emerald-600"
                    aria-hidden="true"
                  />
                  Powered by UpNext AI
                </span>
              </footer>
            </div>
          </article>

          <div className="ai-jd-no-print flex justify-end">
            <Button
              type="button"
              onClick={onCreateJobPost}
              disabled={isCreatingJobPost}
              className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
            >
              <Briefcase size={18} aria-hidden="true" />
              {isCreatingJobPost ? "AI đang điền form..." : "Tạo tin tuyển dụng từ JD này"}
            </Button>
          </div>
        </div>

        {aside && <div className="min-w-70 flex-1 basis-70">{aside}</div>}
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={onExitDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thoát khỏi JD này?</DialogTitle>
            <DialogDescription>
              Bạn có thể tiếp tục chỉnh sửa JD này, hoặc thoát ra và không lưu lại — lần tạo JD tiếp
              theo sẽ bắt đầu từ một biểu mẫu trống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onExitDialogOpenChange(false)}>
              Tiếp tục chỉnh sửa
            </Button>
            <Button
              type="button"
              onClick={onExit}
              className="bg-rose-600 font-semibold text-white hover:bg-rose-700"
            >
              Thoát, không lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DocumentHeader({
  title,
  specializationId,
  specializationName,
  specializations,
  style,
  language,
  isEditing,
  showControls,
  onToggleEdit,
  onTitleChange,
  onSpecializationChange,
}: Readonly<{
  title: string;
  specializationId: string;
  specializationName: string | undefined;
  specializations: ReadonlyArray<JobOption>;
  style: JobPostPresentationStyle;
  language: "vi" | "en";
  isEditing: boolean;
  showControls: boolean;
  onToggleEdit: () => void;
  onTitleChange: (value: string) => void;
  onSpecializationChange: (value: string) => void;
}>) {
  const headerLabel = language === "en" ? "Job title" : "Tiêu đề & chuyên môn";
  const titleLabel = language === "en" ? "Job title" : "Tiêu đề JD";
  const specializationLabel = language === "en" ? "Specialization" : "Chuyên môn";

  return (
    <header
      className={cn(
        "group relative px-6 py-8 sm:px-10 sm:py-10",
        style === "traditional" && "border-t-8 border-emerald-600 bg-white",
        style === "skill_focused" && "border-t-8 border-sky-600 bg-sky-50",
        style === "value_focused" && "bg-emerald-950 text-white",
      )}
    >
      <div
        className={cn(
          CONTROL_BAR_CLASS,
          "top-3 right-3",
          isEditing || showControls
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <EditToggleButton isEditing={isEditing} label={headerLabel} onToggle={onToggleEdit} />
      </div>

      {isEditing ? (
        <input
          aria-label={titleLabel}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className={cn(
            "ai-jd-document-title w-full max-w-3xl rounded-lg border bg-transparent text-[32px] leading-tight font-bold outline-none focus:ring-2",
            style === "value_focused"
              ? "border-white/30 text-white placeholder:text-white/50 focus:ring-white/40"
              : "border-slate-200 text-slate-800 focus:ring-primary/40",
          )}
        />
      ) : (
        <h2
          className={cn(
            "ai-jd-document-title max-w-3xl text-[32px] leading-tight font-bold",
            style === "value_focused" ? "text-white" : "text-slate-800",
          )}
        >
          {title}
        </h2>
      )}

      {isEditing ? (
        <div className="mt-3 max-w-xs">
          <Select value={specializationId} onValueChange={onSpecializationChange}>
            <SelectTrigger
              aria-label={specializationLabel}
              className={cn(
                "upnext-focus h-10 w-full rounded-lg border bg-white/95 px-3 text-sm font-normal text-slate-700 shadow-none",
                style === "value_focused" ? "border-white/30" : "border-slate-200",
              )}
            >
              <SelectValue
                placeholder={language === "en" ? "Information Technology" : "Công nghệ thông tin"}
              />
            </SelectTrigger>
            <SelectContent>
              {specializations.map((option) => (
                <SelectItem key={option.id} value={option.id} className="font-normal">
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p
          className={cn(
            "mt-3 text-sm font-normal",
            style === "value_focused" ? "text-emerald-100" : "text-slate-500",
          )}
        >
          {specializationName ||
            (language === "en" ? "Information Technology" : "Công nghệ thông tin")}{" "}
          · {language === "en" ? `Position: ${title}` : `Vị trí ${title}`}
        </p>
      )}
    </header>
  );
}

function DocumentSection({
  title,
  children,
  className,
  titleClassName,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}>) {
  return (
    <section className={className}>
      <h3 className={cn("mb-3 text-lg font-bold text-slate-950", titleClassName)}>{title}</h3>
      {children}
    </section>
  );
}

function RoleContextSection({
  productOrDomain,
  teamContext,
  language,
}: Readonly<{
  productOrDomain: string | undefined;
  teamContext: string | undefined;
  language: "vi" | "en";
}>) {
  const facts = [
    {
      label: language === "en" ? "Product / domain" : "Sản phẩm / lĩnh vực",
      value: productOrDomain,
    },
    {
      label: language === "en" ? "Engineering team & delivery" : "Đội ngũ & cách triển khai",
      value: teamContext,
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value?.trim()));

  if (facts.length === 0) return null;

  return (
    <DocumentSection title={language === "en" ? "Role context" : "Bối cảnh vị trí"}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {fact.label}
            </dt>
            <dd className="mt-1.5 text-sm leading-6 font-normal text-slate-700">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </DocumentSection>
  );
}

function SkillChips({
  requiredSkills,
  preferredSkills,
  otherSkills,
  language,
  compact = false,
}: Readonly<{
  requiredSkills: string[];
  preferredSkills: string[];
  otherSkills: string[];
  language: "vi" | "en";
  compact?: boolean;
}>) {
  const groups = [
    { label: language === "en" ? "Required" : "Bắt buộc", names: requiredSkills },
    { label: language === "en" ? "Preferred" : "Ưu tiên", names: preferredSkills },
    { label: language === "en" ? "Related" : "Liên quan", names: otherSkills },
  ].filter((group) => group.names.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className={cn("space-y-4", compact && "sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0")}>
      {groups.map((group) => (
        <div key={group.label} className="ai-jd-skill-group flex flex-col gap-1.5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {group.label}
          </p>
          {/* Plain text rather than badges: a printed JD reads as a document, not as a UI. */}
          <p className="text-[15px] leading-7 font-normal text-slate-700">
            {group.names.join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function MetaItem({ label, value }: Readonly<{ label: string; value: string | null | undefined }>) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 font-medium whitespace-nowrap text-slate-900">
        {value?.trim() || "Chưa xác định"}
      </dd>
    </div>
  );
}

function findOption(options: JobOption[], id?: string | null) {
  return id ? options.find((option) => option.id === id) : undefined;
}

function resolveSkillOptions(options: JobOption[], ids?: string[]) {
  const selectedIds = new Set(ids ?? []);
  return options.filter((option) => selectedIds.has(option.id));
}

function hasRichText(value: string) {
  return (
    value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0
  );
}

function toFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLocaleLowerCase() || "job-description"
  );
}

function formatExperience(value: string | undefined, language: "vi" | "en") {
  const years = Number(value);
  if (!Number.isFinite(years) || years < 0) return undefined;
  if (years === 0) return language === "en" ? "No experience required" : "Không yêu cầu";
  return language === "en" ? `${years}+ years` : `${years}+ năm`;
}

function formatDocumentSalary(response: JobPostAiDraftResponse, language: "vi" | "en") {
  const { salaryMin, salaryMax, salaryIsNegotiable } = response.draft;
  if (salaryIsNegotiable || salaryMin === null || salaryMax === null) {
    return language === "en" ? "Negotiable" : "Thỏa thuận";
  }

  const formatter = new Intl.NumberFormat(language === "en" ? "en-US" : "vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return language === "en"
    ? `${formatter.format(salaryMin)} – ${formatter.format(salaryMax)} VND / month`
    : `${formatter.format(salaryMin)} – ${formatter.format(salaryMax)} / tháng`;
}

const PRINT_STYLES = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }

    body * {
      visibility: hidden !important;
    }

    #ai-jd-print-area,
    #ai-jd-print-area * {
      visibility: visible !important;
    }

    #ai-jd-print-area {
      position: absolute !important;
      inset: 0 auto auto 0 !important;
      display: flex !important;
      flex-direction: column !important;
      width: 210mm !important;
      min-height: 297mm !important;
      max-width: none !important;
      box-shadow: none !important;
      border: 0 !important;
    }

    #ai-jd-print-area .ai-jd-document-body {
      display: flex !important;
      flex: 1 1 auto !important;
      flex-direction: column !important;
    }

    #ai-jd-print-area h3 {
      break-after: avoid;
      page-break-after: avoid;
    }

    #ai-jd-print-area li,
    #ai-jd-print-area .ai-jd-skill-section,
    #ai-jd-print-area .ai-jd-skill-group,
    #ai-jd-print-area .ai-jd-document-footer {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    #ai-jd-print-area .ai-jd-document-footer {
      margin-top: auto !important;
    }

    .ai-jd-no-print {
      display: none !important;
    }
  }
`;
