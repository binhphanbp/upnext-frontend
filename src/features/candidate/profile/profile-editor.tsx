"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, MagnifyingGlass, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  type CandidateCertificationApi,
  type CandidateEducationApi,
  type CandidateExperienceApi,
  type CandidateLanguageApi,
  type CandidateLinkApi,
  type CandidateProfileApi,
  type CandidateProjectApi,
  type CandidateSkillApi,
  type SkillOptionApi,
  createCandidateCertification,
  createCandidateEducation,
  createCandidateExperience,
  createCandidateLanguage,
  createCandidateLink,
  createCandidateProject,
  createCandidateSkill,
  searchSkills,
  updateCandidateCertification,
  updateCandidateEducation,
  updateCandidateExperience,
  updateCandidateJobPreference,
  updateCandidateLanguage,
  updateCandidateLink,
  updateCandidateProject,
  updateCandidateSkill,
  updateMyCandidateProfile,
} from "@/features/candidate/api/profile";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

import {
  createCertificationSchema,
  createEducationSchema,
  createExperienceSchema,
  createLanguageSchema,
  createLinkSchema,
  createPreferencesSchema,
  createProfileBasicsSchema,
  createProjectSchema,
  createSkillSchema,
  type ProfileValidationMessages,
} from "./profile-schemas";

export type ProfileEditorState =
  | Readonly<{ kind: "profile" }>
  | Readonly<{ item?: CandidateExperienceApi; kind: "experience" }>
  | Readonly<{ item?: CandidateProjectApi; kind: "project" }>
  | Readonly<{ item?: CandidateEducationApi; kind: "education" }>
  | Readonly<{ item?: CandidateCertificationApi; kind: "certification" }>
  | Readonly<{ item?: CandidateSkillApi; kind: "skill" }>
  | Readonly<{ item?: CandidateLanguageApi; kind: "language" }>
  | Readonly<{ item?: CandidateLinkApi; kind: "link" }>
  | Readonly<{ kind: "preferences" }>;

type RunProfileMutation = <TResult>(
  action: (accessToken: string) => Promise<TResult>,
) => Promise<TResult>;

type ProfileEditorProps = Readonly<{
  editor: ProfileEditorState | null;
  mutateProfile: RunProfileMutation;
  onClose: () => void;
  profile: CandidateProfileApi;
}>;

export function ProfileEditor({ editor, mutateProfile, onClose, profile }: ProfileEditorProps) {
  const t = useTranslations("CandidateProfile.content");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(false);
  }, [editor]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const closeAfterSave = async <TResult,>(action: () => Promise<TResult>) => {
    await action();
    setIsDirty(false);
    onClose();
  };

  const requestClose = () => {
    if (isDirty && !window.confirm(t("feedback.unsavedDescription"))) return;
    setIsDirty(false);
    onClose();
  };

  return (
    <Sheet
      open={editor !== null}
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <SheetContent
        side="right"
        closeLabel={t("actions.close")}
        className="flex h-dvh w-full flex-col overflow-hidden overscroll-contain bg-white p-0 sm:max-w-xl md:max-w-2xl"
      >
        {editor?.kind === "profile" && (
          <ProfileBasicsForm
            profile={profile}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) => updateMyCandidateProfile(token, payload)),
              )
            }
          />
        )}
        {editor?.kind === "experience" && (
          <ExperienceForm
            {...(editor.item ? { item: editor.item } : {})}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateExperience(token, editor.item.id, payload)
                    : createCandidateExperience(token, {
                        ...payload,
                        sortOrder: profile.experiences.length,
                      }),
                ),
              )
            }
          />
        )}
        {editor?.kind === "project" && (
          <ProjectForm
            {...(editor.item ? { item: editor.item } : {})}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateProject(token, editor.item.id, payload)
                    : createCandidateProject(token, {
                        ...payload,
                        sortOrder: profile.projects.length,
                      }),
                ),
              )
            }
          />
        )}
        {editor?.kind === "education" && (
          <EducationForm
            {...(editor.item ? { item: editor.item } : {})}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateEducation(token, editor.item.id, payload)
                    : createCandidateEducation(token, {
                        ...payload,
                        sortOrder: profile.educations.length,
                      }),
                ),
              )
            }
          />
        )}
        {editor?.kind === "certification" && (
          <CertificationForm
            {...(editor.item ? { item: editor.item } : {})}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateCertification(token, editor.item.id, payload)
                    : createCandidateCertification(token, {
                        ...payload,
                        sortOrder: profile.certifications.length,
                      }),
                ),
              )
            }
          />
        )}
        {editor?.kind === "skill" && (
          <SkillForm
            {...(editor.item ? { item: editor.item } : {})}
            existingSkillIds={profile.skills
              .filter((skill) => skill.id !== editor.item?.id)
              .map((skill) => skill.skillId)}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateSkill(token, editor.item.id, payload)
                    : createCandidateSkill(token, {
                        ...payload,
                        sortOrder: profile.skills.length,
                      }),
                ),
              )
            }
          />
        )}
        {editor?.kind === "language" && (
          <LanguageForm
            {...(editor.item ? { item: editor.item } : {})}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateLanguage(token, editor.item.id, payload)
                    : createCandidateLanguage(token, payload),
                ),
              )
            }
          />
        )}
        {editor?.kind === "link" && (
          <LinkForm
            {...(editor.item ? { item: editor.item } : {})}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) =>
                  editor.item
                    ? updateCandidateLink(token, editor.item.id, payload)
                    : createCandidateLink(token, payload),
                ),
              )
            }
          />
        )}
        {editor?.kind === "preferences" && (
          <PreferencesForm
            preference={profile.jobPreference}
            onDirtyChange={setIsDirty}
            onCancel={requestClose}
            onSave={(payload) =>
              closeAfterSave(() =>
                mutateProfile((token) => updateCandidateJobPreference(token, payload)),
              )
            }
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

type BaseFormProps = Readonly<{
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
}>;

type ProfileBasicsValues = z.infer<ReturnType<typeof createProfileBasicsSchema>>;

function ProfileBasicsForm({
  onCancel,
  onDirtyChange,
  onSave,
  profile,
}: BaseFormProps & {
  onSave: (payload: Parameters<typeof updateMyCandidateProfile>[1]) => Promise<unknown>;
  profile: CandidateProfileApi;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createProfileBasicsSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ProfileBasicsValues>({
    defaultValues: {
      address: profile.address ?? "",
      birthdate: toDateInput(profile.birthdate),
      description: profile.description ?? "",
      gender: profile.gender ?? "",
      phoneNumber: profile.phoneNumber ?? "",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);

  return (
    <EditorForm
      description={t("forms.profile.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t("forms.profile.title")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            address: values.address,
            description: values.description,
            phoneNumber: values.phoneNumber,
            ...(values.birthdate ? { birthdate: values.birthdate } : {}),
            ...(values.gender ? { gender: values.gender } : {}),
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <FormSection title={t("forms.profile.personalSection")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            help={t("forms.profile.fields.fullName.help")}
            label={t("forms.profile.fields.fullName.label")}
          >
            <Input
              value={profile.account.fullName}
              readOnly
              className="bg-slate-50 text-slate-600"
            />
          </Field>
          <Field
            help={t("forms.profile.fields.email.help")}
            label={t("forms.profile.fields.email.label")}
          >
            <Input value={profile.account.email} readOnly className="bg-slate-50 text-slate-600" />
          </Field>
          <Field error={errors.gender?.message} label={t("forms.profile.fields.gender.label")}>
            <NativeSelect {...register("gender")}>
              <option value="">{t("forms.profile.fields.gender.placeholder")}</option>
              <option value="MALE">{t("options.gender.MALE")}</option>
              <option value="FEMALE">{t("options.gender.FEMALE")}</option>
            </NativeSelect>
          </Field>
          <Field
            error={errors.birthdate?.message}
            help={t("forms.profile.fields.birthdate.help")}
            label={t("forms.profile.fields.birthdate.label")}
          >
            <Input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              {...register("birthdate")}
            />
          </Field>
        </div>
      </FormSection>
      <FormSection title={t("forms.profile.contactSection")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.phoneNumber?.message}
            help={t("forms.profile.fields.phoneNumber.help")}
            label={t("forms.profile.fields.phoneNumber.label")}
          >
            <Input
              type="tel"
              autoComplete="tel"
              placeholder={t("forms.profile.fields.phoneNumber.placeholder")}
              {...register("phoneNumber")}
            />
          </Field>
          <Field
            error={errors.address?.message}
            help={t("forms.profile.fields.address.help")}
            label={t("forms.profile.fields.address.label")}
          >
            <Input
              autoComplete="address-level2"
              placeholder={t("forms.profile.fields.address.placeholder")}
              {...register("address")}
            />
          </Field>
        </div>
      </FormSection>
      <FormSection title={t("forms.profile.summarySection")}>
        <Field
          error={errors.description?.message}
          help={t("forms.profile.fields.description.help")}
          label={t("forms.profile.fields.description.label")}
        >
          <Textarea
            rows={7}
            placeholder={t("forms.profile.fields.description.placeholder")}
            {...register("description")}
          />
        </Field>
      </FormSection>
    </EditorForm>
  );
}

type ExperienceValues = z.infer<ReturnType<typeof createExperienceSchema>>;

function ExperienceForm({
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  item?: CandidateExperienceApi;
  onSave: (payload: Parameters<typeof createCandidateExperience>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createExperienceSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<ExperienceValues>({
    defaultValues: {
      companyName: item?.companyName ?? "",
      description: item?.description ?? "",
      employmentType: item?.employmentType ?? "",
      endDate: toDateInput(item?.endDate),
      isCurrent: item?.isCurrent ?? false,
      positionTitle: item?.positionTitle ?? "",
      startDate: toDateInput(item?.startDate),
      technologies: item?.technologies ?? "",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);
  const isCurrent = watch("isCurrent");

  return (
    <EditorForm
      description={t("forms.experience.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.experience.editTitle" : "forms.experience.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            companyName: values.companyName,
            description: values.description,
            employmentType: values.employmentType,
            isCurrent: values.isCurrent,
            positionTitle: values.positionTitle,
            ...optionalValue("startDate", values.startDate),
            ...(!values.isCurrent ? optionalValue("endDate", values.endDate) : {}),
            technologies: values.technologies,
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          required
          error={errors.positionTitle?.message}
          label={t("forms.experience.fields.positionTitle.label")}
        >
          <Input
            placeholder={t("forms.experience.fields.positionTitle.placeholder")}
            {...register("positionTitle")}
          />
        </Field>
        <Field
          required
          error={errors.companyName?.message}
          label={t("forms.experience.fields.companyName.label")}
        >
          <Input
            autoComplete="organization"
            placeholder={t("forms.experience.fields.companyName.placeholder")}
            {...register("companyName")}
          />
        </Field>
        <Field
          error={errors.employmentType?.message}
          label={t("forms.experience.fields.employmentType.label")}
        >
          <NativeSelect {...register("employmentType")}>
            <option value="">{t("forms.experience.fields.employmentType.placeholder")}</option>
            {employmentTypeOptions.map(({ labelKey, value }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="hidden sm:block" />
        <Field
          error={errors.startDate?.message}
          label={t("forms.experience.fields.startDate.label")}
        >
          <Input type="date" {...register("startDate")} />
        </Field>
        <Field error={errors.endDate?.message} label={t("forms.experience.fields.endDate.label")}>
          <Input type="date" disabled={isCurrent} {...register("endDate")} />
        </Field>
      </div>
      <CheckboxField
        label={t("forms.experience.fields.isCurrent.label")}
        {...register("isCurrent")}
      />
      <Field
        error={errors.description?.message}
        help={t("forms.experience.fields.description.help")}
        label={t("forms.experience.fields.description.label")}
      >
        <Textarea
          rows={6}
          placeholder={t("forms.experience.fields.description.placeholder")}
          {...register("description")}
        />
      </Field>
      <Field
        error={errors.technologies?.message}
        help={t("forms.experience.fields.technologies.help")}
        label={t("forms.experience.fields.technologies.label")}
      >
        <Input
          placeholder={t("forms.experience.fields.technologies.placeholder")}
          {...register("technologies")}
        />
      </Field>
    </EditorForm>
  );
}

type ProjectValues = z.infer<ReturnType<typeof createProjectSchema>>;

function ProjectForm({
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  item?: CandidateProjectApi;
  onSave: (payload: Parameters<typeof createCandidateProject>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createProjectSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ProjectValues>({
    defaultValues: {
      deployUrl: item?.deployUrl ?? "",
      description: item?.description ?? "",
      endDate: toDateInput(item?.endDate),
      name: item?.name ?? "",
      projectUrl: item?.projectUrl ?? "",
      role: item?.role ?? "",
      startDate: toDateInput(item?.startDate),
      technologies: item?.technologies ?? "",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);

  return (
    <EditorForm
      description={t("forms.project.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.project.editTitle" : "forms.project.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            description: values.description,
            name: values.name,
            role: values.role,
            ...optionalValue("projectUrl", values.projectUrl),
            ...optionalValue("deployUrl", values.deployUrl),
            technologies: values.technologies,
            ...optionalValue("startDate", values.startDate),
            ...optionalValue("endDate", values.endDate),
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field required error={errors.name?.message} label={t("forms.project.fields.name.label")}>
          <Input placeholder={t("forms.project.fields.name.placeholder")} {...register("name")} />
        </Field>
        <Field error={errors.role?.message} label={t("forms.project.fields.role.label")}>
          <Input placeholder={t("forms.project.fields.role.placeholder")} {...register("role")} />
        </Field>
        <Field error={errors.startDate?.message} label={t("forms.project.fields.startDate.label")}>
          <Input type="date" {...register("startDate")} />
        </Field>
        <Field error={errors.endDate?.message} label={t("forms.project.fields.endDate.label")}>
          <Input type="date" {...register("endDate")} />
        </Field>
      </div>
      <Field
        error={errors.description?.message}
        label={t("forms.project.fields.description.label")}
      >
        <Textarea
          rows={6}
          placeholder={t("forms.project.fields.description.placeholder")}
          {...register("description")}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={errors.projectUrl?.message}
          label={t("forms.project.fields.projectUrl.label")}
        >
          <Input
            type="url"
            inputMode="url"
            placeholder={t("forms.project.fields.projectUrl.placeholder")}
            {...register("projectUrl")}
          />
        </Field>
        <Field error={errors.deployUrl?.message} label={t("forms.project.fields.deployUrl.label")}>
          <Input
            type="url"
            inputMode="url"
            placeholder={t("forms.project.fields.deployUrl.placeholder")}
            {...register("deployUrl")}
          />
        </Field>
      </div>
      <Field
        error={errors.technologies?.message}
        help={t("forms.project.fields.technologies.help")}
        label={t("forms.project.fields.technologies.label")}
      >
        <Input
          placeholder={t("forms.project.fields.technologies.placeholder")}
          {...register("technologies")}
        />
      </Field>
    </EditorForm>
  );
}

type EducationValues = z.infer<ReturnType<typeof createEducationSchema>>;

function EducationForm({
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  item?: CandidateEducationApi;
  onSave: (payload: Parameters<typeof createCandidateEducation>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createEducationSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<EducationValues>({
    defaultValues: {
      degree: item?.degree ?? "",
      description: item?.description ?? "",
      endDate: toDateInput(item?.endDate),
      gpa: item?.gpa === null || item?.gpa === undefined ? "" : String(item.gpa),
      isCurrent: item?.isCurrent ?? false,
      major: item?.major ?? "",
      schoolName: item?.schoolName ?? "",
      startDate: toDateInput(item?.startDate),
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);
  const isCurrent = watch("isCurrent");

  return (
    <EditorForm
      description={t("forms.education.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.education.editTitle" : "forms.education.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            degree: values.degree,
            description: values.description,
            isCurrent: values.isCurrent,
            major: values.major,
            schoolName: values.schoolName,
            ...optionalValue("startDate", values.startDate),
            ...(!values.isCurrent ? optionalValue("endDate", values.endDate) : {}),
            ...(values.gpa ? { gpa: Number(values.gpa) } : {}),
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          required
          error={errors.schoolName?.message}
          label={t("forms.education.fields.schoolName.label")}
        >
          <Input
            autoComplete="organization"
            placeholder={t("forms.education.fields.schoolName.placeholder")}
            {...register("schoolName")}
          />
        </Field>
        <Field error={errors.degree?.message} label={t("forms.education.fields.degree.label")}>
          <Input
            placeholder={t("forms.education.fields.degree.placeholder")}
            {...register("degree")}
          />
        </Field>
        <Field error={errors.major?.message} label={t("forms.education.fields.major.label")}>
          <Input
            placeholder={t("forms.education.fields.major.placeholder")}
            {...register("major")}
          />
        </Field>
        <Field
          error={errors.gpa?.message}
          help={t("forms.education.fields.gpa.help")}
          label={t("forms.education.fields.gpa.label")}
        >
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            max="10"
            step="0.01"
            placeholder={t("forms.education.fields.gpa.placeholder")}
            {...register("gpa")}
          />
        </Field>
        <Field
          error={errors.startDate?.message}
          label={t("forms.education.fields.startDate.label")}
        >
          <Input type="date" {...register("startDate")} />
        </Field>
        <Field error={errors.endDate?.message} label={t("forms.education.fields.endDate.label")}>
          <Input type="date" disabled={isCurrent} {...register("endDate")} />
        </Field>
      </div>
      <CheckboxField
        label={t("forms.education.fields.isCurrent.label")}
        {...register("isCurrent")}
      />
      <Field
        error={errors.description?.message}
        label={t("forms.education.fields.description.label")}
      >
        <Textarea
          rows={5}
          placeholder={t("forms.education.fields.description.placeholder")}
          {...register("description")}
        />
      </Field>
    </EditorForm>
  );
}

type CertificationValues = z.infer<ReturnType<typeof createCertificationSchema>>;

function CertificationForm({
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  item?: CandidateCertificationApi;
  onSave: (payload: Parameters<typeof createCandidateCertification>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createCertificationSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CertificationValues>({
    defaultValues: {
      credentialUrl: item?.credentialUrl ?? "",
      expiredDate: toDateInput(item?.expiredDate),
      issuedDate: toDateInput(item?.issuedDate),
      name: item?.name ?? "",
      organization: item?.organization ?? "",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);

  return (
    <EditorForm
      description={t("forms.certification.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.certification.editTitle" : "forms.certification.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            name: values.name,
            organization: values.organization,
            ...optionalValue("issuedDate", values.issuedDate),
            ...optionalValue("expiredDate", values.expiredDate),
            ...optionalValue("credentialUrl", values.credentialUrl),
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          required
          error={errors.name?.message}
          label={t("forms.certification.fields.name.label")}
        >
          <Input
            placeholder={t("forms.certification.fields.name.placeholder")}
            {...register("name")}
          />
        </Field>
        <Field
          error={errors.organization?.message}
          label={t("forms.certification.fields.organization.label")}
        >
          <Input
            placeholder={t("forms.certification.fields.organization.placeholder")}
            {...register("organization")}
          />
        </Field>
        <Field
          error={errors.issuedDate?.message}
          label={t("forms.certification.fields.issuedDate.label")}
        >
          <Input type="date" {...register("issuedDate")} />
        </Field>
        <Field
          error={errors.expiredDate?.message}
          label={t("forms.certification.fields.expiredDate.label")}
        >
          <Input type="date" {...register("expiredDate")} />
        </Field>
      </div>
      <Field
        error={errors.credentialUrl?.message}
        label={t("forms.certification.fields.credentialUrl.label")}
      >
        <Input
          type="url"
          inputMode="url"
          placeholder={t("forms.certification.fields.credentialUrl.placeholder")}
          {...register("credentialUrl")}
        />
      </Field>
    </EditorForm>
  );
}

type SkillValues = z.infer<ReturnType<typeof createSkillSchema>>;

function SkillForm({
  existingSkillIds,
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  existingSkillIds: readonly string[];
  item?: CandidateSkillApi;
  onSave: (payload: Parameters<typeof createCandidateSkill>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createSkillSchema(getValidationMessages(t)), [t]);
  const [searchTerm, setSearchTerm] = useState(item?.skill.name ?? "");
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());
  const [submitError, setSubmitError] = useState(false);
  const [activeSkillIndex, setActiveSkillIndex] = useState(-1);
  const [isListboxDismissed, setIsListboxDismissed] = useState(false);
  const skillSearchId = useId();
  const skillListboxId = `${skillSearchId}-listbox`;
  const skillErrorId = `${skillSearchId}-error`;
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<SkillValues>({
    defaultValues: {
      proficiencyLevel: item?.proficiencyLevel ?? "INTERMEDIATE",
      skillId: item?.skillId ?? "",
      skillName: item?.skill.name ?? "",
      yearsOfExperience:
        item?.yearsOfExperience === null || item?.yearsOfExperience === undefined
          ? ""
          : String(item.yearsOfExperience),
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);
  const selectedSkillId = watch("skillId");
  const selectedSkillName = watch("skillName");
  const skillSearch = useQuery({
    enabled: deferredSearchTerm.length >= 2 && deferredSearchTerm !== selectedSkillName,
    queryFn: () => searchSkills(deferredSearchTerm),
    queryKey: ["candidate-skill-search", deferredSearchTerm],
    staleTime: 5 * 60_000,
  });
  const selectableSkills = useMemo(
    () => skillSearch.data?.filter((skill) => !existingSkillIds.includes(skill.id)) ?? [],
    [existingSkillIds, skillSearch.data],
  );
  const activeSkill = selectableSkills[activeSkillIndex];
  const hasSearchResponse =
    skillSearch.data !== undefined && deferredSearchTerm !== selectedSkillName;
  const isListboxOpen = hasSearchResponse && !isListboxDismissed;

  useEffect(() => {
    if (!isListboxOpen || !activeSkill) return;
    document
      .getElementById(`${skillListboxId}-option-${activeSkill.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeSkill, isListboxOpen, skillListboxId]);

  const selectSkill = (skill: SkillOptionApi) => {
    setSearchTerm(skill.name);
    setValue("skillId", skill.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("skillName", skill.name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setActiveSkillIndex(-1);
    setIsListboxDismissed(true);
  };

  /* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role -- The editable skill picker follows the WAI-ARIA combobox/listbox pattern; native datalist/select cannot provide the required disabled and rich option states. */
  return (
    <EditorForm
      description={t("forms.skill.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.skill.editTitle" : "forms.skill.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            proficiencyLevel: values.proficiencyLevel,
            skillId: values.skillId,
            ...(values.yearsOfExperience
              ? { yearsOfExperience: Number(values.yearsOfExperience) }
              : {}),
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <input type="hidden" {...register("skillId")} />
      <input type="hidden" {...register("skillName")} />
      <FieldGroup
        required
        controlId={skillSearchId}
        error={errors.skillId?.message ?? errors.skillName?.message}
        errorId={skillErrorId}
        label={t("forms.skill.fields.skill.label")}
      >
        <div className="relative">
          <MagnifyingGlass
            aria-hidden="true"
            className="pointer-events-none absolute top-3.5 left-3 text-slate-400"
            size={17}
          />
          <Input
            id={skillSearchId}
            value={searchTerm}
            className="pl-10"
            aria-activedescendant={
              isListboxOpen && activeSkill
                ? `${skillListboxId}-option-${activeSkill.id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={skillListboxId}
            aria-describedby={(errors.skillId ?? errors.skillName) ? skillErrorId : undefined}
            aria-expanded={isListboxOpen}
            aria-invalid={Boolean(errors.skillId ?? errors.skillName)}
            aria-required="true"
            aria-busy={skillSearch.isFetching}
            autoComplete="off"
            placeholder={t("forms.skill.fields.skill.placeholder")}
            role="combobox"
            tabIndex={0}
            onChange={(event) => {
              const value = event.target.value;
              setSearchTerm(value);
              setActiveSkillIndex(-1);
              setIsListboxDismissed(false);
              if (value !== selectedSkillName) {
                setValue("skillId", "", { shouldDirty: true, shouldValidate: true });
                setValue("skillName", "", { shouldDirty: true, shouldValidate: true });
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && isListboxOpen) {
                event.preventDefault();
                event.stopPropagation();
                setActiveSkillIndex(-1);
                setIsListboxDismissed(true);
                return;
              }

              if (selectableSkills.length === 0) return;

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsListboxDismissed(false);
                setActiveSkillIndex((currentIndex) =>
                  currentIndex >= selectableSkills.length - 1 ? 0 : currentIndex + 1,
                );
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setIsListboxDismissed(false);
                setActiveSkillIndex((currentIndex) =>
                  currentIndex <= 0 ? selectableSkills.length - 1 : currentIndex - 1,
                );
                return;
              }

              if (event.key === "Enter" && isListboxOpen && activeSkill) {
                event.preventDefault();
                selectSkill(activeSkill);
              }
            }}
          />
          {skillSearch.isFetching && (
            <>
              <SpinnerGap
                aria-hidden="true"
                className="text-brand absolute top-3.5 right-3 animate-spin"
                size={17}
              />
              <output className="sr-only">{t("forms.skill.searching")}</output>
            </>
          )}
        </div>
        {selectedSkillId && selectedSkillName && searchTerm === selectedSkillName && (
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle aria-hidden="true" size={17} weight="fill" />
            {selectedSkillName}
          </div>
        )}
        {isListboxOpen && skillSearch.data && (
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {skillSearch.data.length > 0 ? (
              <ul
                id={skillListboxId}
                role="listbox"
                className="max-h-56 overflow-y-auto p-1"
                aria-label={t("forms.skill.fields.skill.label")}
              >
                {skillSearch.data.map((skill) => {
                  const isAlreadyAdded = existingSkillIds.includes(skill.id);
                  const selectableIndex = selectableSkills.findIndex(
                    (selectableSkill) => selectableSkill.id === skill.id,
                  );
                  const isActive = selectableIndex >= 0 && selectableIndex === activeSkillIndex;
                  return (
                    <li key={skill.id} role="presentation">
                      <button
                        id={`${skillListboxId}-option-${skill.id}`}
                        type="button"
                        role="option"
                        aria-disabled={isAlreadyAdded}
                        aria-selected={selectedSkillId === skill.id}
                        disabled={isAlreadyAdded}
                        tabIndex={-1}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent",
                          isActive && "bg-emerald-50 text-emerald-800",
                        )}
                        onClick={() => selectSkill(skill)}
                        onMouseEnter={() => {
                          if (!isAlreadyAdded) setActiveSkillIndex(selectableIndex);
                        }}
                      >
                        <span>{skill.name}</span>
                        {isAlreadyAdded && (
                          <span className="text-xs font-semibold">
                            {t("forms.skill.alreadyAdded")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <output id={skillListboxId} className="block px-3 py-3 text-sm text-slate-500">
                {t("forms.skill.noResults")}
              </output>
            )}
          </div>
        )}
      </FieldGroup>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          required
          error={errors.proficiencyLevel?.message}
          label={t("forms.skill.fields.proficiencyLevel.label")}
        >
          <NativeSelect {...register("proficiencyLevel")}>
            {skillProficiencyOptions.map((value) => (
              <option key={value} value={value}>
                {t(`options.skillProficiency.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          error={errors.yearsOfExperience?.message}
          label={t("forms.skill.fields.yearsOfExperience.label")}
        >
          <Input
            type="number"
            min="0"
            max="50"
            step="0.5"
            inputMode="decimal"
            placeholder={t("forms.skill.fields.yearsOfExperience.placeholder")}
            {...register("yearsOfExperience")}
          />
        </Field>
      </div>
    </EditorForm>
  );
  /* oxlint-enable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role */
}

type LanguageValues = z.infer<ReturnType<typeof createLanguageSchema>>;

function LanguageForm({
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  item?: CandidateLanguageApi;
  onSave: (payload: Parameters<typeof createCandidateLanguage>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createLanguageSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const normalizedProficiency = item?.proficiency.toUpperCase();
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LanguageValues>({
    defaultValues: {
      language: item?.language ?? "",
      proficiency: languageProficiencyOptions.includes(
        normalizedProficiency as (typeof languageProficiencyOptions)[number],
      )
        ? normalizedProficiency!
        : "INTERMEDIATE",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);

  return (
    <EditorForm
      description={t("forms.language.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.language.editTitle" : "forms.language.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave(values);
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <Field
        required
        error={errors.language?.message}
        label={t("forms.language.fields.language.label")}
      >
        <Input
          placeholder={t("forms.language.fields.language.placeholder")}
          {...register("language")}
        />
      </Field>
      <Field
        required
        error={errors.proficiency?.message}
        label={t("forms.language.fields.proficiency.label")}
      >
        <NativeSelect {...register("proficiency")}>
          {languageProficiencyOptions.map((value) => (
            <option key={value} value={value}>
              {t(`options.languageProficiency.${value}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
    </EditorForm>
  );
}

type LinkValues = z.infer<ReturnType<typeof createLinkSchema>>;

function LinkForm({
  item,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  item?: CandidateLinkApi;
  onSave: (payload: Parameters<typeof createCandidateLink>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createLinkSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const normalizedType = item?.type.toUpperCase();
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LinkValues>({
    defaultValues: {
      type: linkTypeOptions.includes(normalizedType as (typeof linkTypeOptions)[number])
        ? normalizedType!
        : "OTHER",
      url: item?.url ?? "",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);

  return (
    <EditorForm
      description={t("forms.link.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t(item ? "forms.link.editTitle" : "forms.link.addTitle")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave(values);
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <Field required error={errors.type?.message} label={t("forms.link.fields.type.label")}>
        <NativeSelect {...register("type")}>
          {linkTypeOptions.map((value) => (
            <option key={value} value={value}>
              {t(`options.linkType.${value}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field required error={errors.url?.message} label={t("forms.link.fields.url.label")}>
        <Input
          type="url"
          inputMode="url"
          placeholder={t("forms.link.fields.url.placeholder")}
          {...register("url")}
        />
      </Field>
    </EditorForm>
  );
}

type PreferencesValues = z.infer<ReturnType<typeof createPreferencesSchema>>;

function PreferencesForm({
  preference,
  onCancel,
  onDirtyChange,
  onSave,
}: BaseFormProps & {
  preference: CandidateProfileApi["jobPreference"];
  onSave: (payload: Parameters<typeof updateCandidateJobPreference>[1]) => Promise<unknown>;
}) {
  const t = useTranslations("CandidateProfile.content");
  const schema = useMemo(() => createPreferencesSchema(getValidationMessages(t)), [t]);
  const [submitError, setSubmitError] = useState(false);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
  } = useForm<PreferencesValues>({
    defaultValues: {
      desiredPosition: preference?.desiredPosition ?? "",
      desiredSalaryMax:
        preference?.desiredSalaryMax === null || preference?.desiredSalaryMax === undefined
          ? ""
          : String(preference.desiredSalaryMax),
      desiredSalaryMin:
        preference?.desiredSalaryMin === null || preference?.desiredSalaryMin === undefined
          ? ""
          : String(preference.desiredSalaryMin),
      isRelocate: preference?.isRelocate ?? false,
      noticePeriodDays:
        preference?.noticePeriodDays === null || preference?.noticePeriodDays === undefined
          ? ""
          : String(preference.noticePeriodDays),
      salaryCurrency: preference?.salaryCurrency || "VND",
      workingModel: preference?.workingModel ?? "",
    },
    resolver: zodResolver(schema),
  });
  useReportDirty(isDirty, onDirtyChange);

  return (
    <EditorForm
      description={t("forms.preferences.description")}
      error={submitError ? t("feedback.failed") : null}
      isSubmitting={isSubmitting}
      title={t("forms.preferences.title")}
      onCancel={onCancel}
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(false);
        try {
          await onSave({
            desiredPosition: values.desiredPosition,
            salaryCurrency: values.salaryCurrency,
            isRelocate: values.isRelocate,
            ...(values.desiredSalaryMin
              ? { desiredSalaryMin: Number(values.desiredSalaryMin) }
              : {}),
            ...(values.desiredSalaryMax
              ? { desiredSalaryMax: Number(values.desiredSalaryMax) }
              : {}),
            ...(values.workingModel ? { workingModel: values.workingModel } : {}),
            ...(values.noticePeriodDays
              ? { noticePeriodDays: Number(values.noticePeriodDays) }
              : {}),
          });
        } catch {
          setSubmitError(true);
        }
      })}
    >
      <FormSection title={t("forms.preferences.workSection")}>
        <Field
          error={errors.desiredPosition?.message}
          label={t("forms.preferences.fields.desiredPosition.label")}
        >
          <Input
            placeholder={t("forms.preferences.fields.desiredPosition.placeholder")}
            {...register("desiredPosition")}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.workingModel?.message}
            label={t("forms.preferences.fields.workingModel.label")}
          >
            <NativeSelect {...register("workingModel")}>
              <option value="">{t("forms.preferences.fields.workingModel.placeholder")}</option>
              {workingModelOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`options.workingModel.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            error={errors.noticePeriodDays?.message}
            help={t("forms.preferences.fields.noticePeriodDays.help")}
            label={t("forms.preferences.fields.noticePeriodDays.label")}
          >
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              max="365"
              step="1"
              placeholder={t("forms.preferences.fields.noticePeriodDays.placeholder")}
              {...register("noticePeriodDays")}
            />
          </Field>
        </div>
        <CheckboxField
          label={t("forms.preferences.fields.isRelocate.label")}
          {...register("isRelocate")}
        />
      </FormSection>
      <FormSection title={t("forms.preferences.salarySection")}>
        <div className="grid gap-5 sm:grid-cols-[1fr_1fr_120px]">
          <Field
            error={errors.desiredSalaryMin?.message}
            label={t("forms.preferences.fields.desiredSalaryMin.label")}
          >
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder={t("forms.preferences.fields.desiredSalaryMin.placeholder")}
              {...register("desiredSalaryMin")}
            />
          </Field>
          <Field
            error={errors.desiredSalaryMax?.message}
            label={t("forms.preferences.fields.desiredSalaryMax.label")}
          >
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder={t("forms.preferences.fields.desiredSalaryMax.placeholder")}
              {...register("desiredSalaryMax")}
            />
          </Field>
          <Field
            error={errors.salaryCurrency?.message}
            label={t("forms.preferences.fields.salaryCurrency.label")}
          >
            <NativeSelect {...register("salaryCurrency")}>
              {currencyOptions.map((value) => (
                <option key={value} value={value}>
                  {t(`options.currency.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </FormSection>
    </EditorForm>
  );
}

function EditorForm({
  children,
  description,
  error,
  isSubmitting,
  onCancel,
  onSubmit,
  title,
}: Readonly<{
  children: ReactNode;
  description: string;
  error: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  title: string;
}>) {
  const t = useTranslations("CandidateProfile.content");

  return (
    <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={onSubmit}>
      <SheetHeader className="border-b border-slate-200 px-5 py-5 pr-14 sm:px-7 sm:py-6 sm:pr-16">
        <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-slate-950">
          {title}
        </SheetTitle>
        <SheetDescription className="max-w-xl leading-6 text-slate-600">
          {description}
        </SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
        <p className="text-xs font-medium text-slate-500">{t("forms.common.requiredHint")}</p>
        {children}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
            {error}
          </div>
        )}
      </div>
      <div
        className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 pt-4 sm:flex-row sm:justify-end sm:px-7"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onCancel}
          className="focus-visible:ring-brand/30 focus-visible:ring-2"
        >
          {t("actions.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="focus-visible:ring-brand/30 focus-visible:ring-2"
        >
          {isSubmitting && <SpinnerGap aria-hidden="true" className="animate-spin" />}
          {isSubmitting ? t("actions.saving") : t("actions.saveChanges")}
        </Button>
      </div>
    </form>
  );
}

function FormSection({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="space-y-5 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-bold tracking-wide text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  children,
  error,
  help,
  label,
  required = false,
}: Readonly<{
  children: ReactNode;
  error?: string | undefined;
  help?: string | undefined;
  label: string;
  required?: boolean;
}>) {
  const generatedId = useId();
  const helpId = `${generatedId}-help`;
  const errorId = `${generatedId}-error`;
  const control = isValidElement<FieldControlProps>(children) ? children : null;
  const controlId = control?.props.id ?? `${generatedId}-control`;
  const describedBy = [
    control?.props["aria-describedby"],
    help && !error ? helpId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  const controlRequired = required ? true : control?.props.required;
  const controlAriaRequired = required ? true : control?.props["aria-required"];
  const controlAriaInvalid = error ? true : control?.props["aria-invalid"];
  const accessibleControl = control
    ? cloneElement(control, {
        id: controlId,
        ...(controlRequired === undefined ? {} : { required: controlRequired }),
        ...(controlAriaRequired === undefined ? {} : { "aria-required": controlAriaRequired }),
        ...(controlAriaInvalid === undefined ? {} : { "aria-invalid": controlAriaInvalid }),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      })
    : children;

  return (
    <div className="block space-y-2 text-sm font-semibold text-slate-800">
      <label htmlFor={controlId}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      {accessibleControl}
      {help && !error && (
        <span id={helpId} className="block text-xs leading-5 font-normal text-slate-500">
          {help}
        </span>
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="block text-xs leading-5 font-semibold text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}

type FieldControlProps = Readonly<{
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "false" | "true";
  "aria-required"?: boolean | "false" | "true";
}>;

function FieldGroup({
  children,
  controlId,
  error,
  errorId,
  label,
  required = false,
}: Readonly<{
  children: ReactNode;
  controlId: string;
  error?: string | undefined;
  errorId: string;
  label: string;
  required?: boolean;
}>) {
  return (
    <div className="space-y-2 text-sm font-semibold text-slate-800">
      <label htmlFor={controlId}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="block text-xs leading-5 font-semibold text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  ),
);
NativeSelect.displayName = "NativeSelect";

const CheckboxField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ className, label, ...props }, ref) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "mt-0.5 size-4 accent-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
      {...props}
    />
    <span>{label}</span>
  </label>
));
CheckboxField.displayName = "CheckboxField";

function useReportDirty(isDirty: boolean, onDirtyChange: (isDirty: boolean) => void) {
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
}

function getValidationMessages(t: ReturnType<typeof useTranslations>): ProfileValidationMessages {
  return {
    dateRange: t("validation.startBeforeEnd"),
    gpaRange: t("validation.gpaRange"),
    invalidDate: t("validation.invalidDate"),
    invalidNumber: t("validation.positiveNumber"),
    invalidPhone: t("validation.invalidPhone"),
    invalidUrl: t("validation.invalidUrl"),
    maxLength: (maximum) => t("validation.maxLength", { max: maximum }),
    noticePeriodRange: t("validation.noticePeriodRange"),
    required: t("validation.required"),
    salaryRange: t("validation.salaryRange"),
  };
}

function optionalValue<TKey extends string>(key: TKey, value: string) {
  const normalizedValue = value.trim();
  return normalizedValue ? ({ [key]: normalizedValue } as Record<TKey, string>) : {};
}

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

const employmentTypeOptions = [
  { labelKey: "options.employmentType.FULL_TIME", value: "Full-time" },
  { labelKey: "options.employmentType.PART_TIME", value: "Part-time" },
  { labelKey: "options.employmentType.CONTRACT", value: "Contract" },
  { labelKey: "options.employmentType.INTERNSHIP", value: "Internship" },
  { labelKey: "options.employmentType.FREELANCE", value: "Freelance" },
  { labelKey: "options.employmentType.OTHER", value: "Other" },
] as const;

const skillProficiencyOptions = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
const languageProficiencyOptions = [
  "BASIC",
  "INTERMEDIATE",
  "PROFESSIONAL",
  "FLUENT",
  "NATIVE",
] as const;
const linkTypeOptions = ["WEBSITE", "PORTFOLIO", "LINKEDIN", "GITHUB", "OTHER"] as const;
const workingModelOptions = ["ONSITE", "REMOTE", "HYBRID"] as const;
const currencyOptions = ["VND", "USD"] as const;
