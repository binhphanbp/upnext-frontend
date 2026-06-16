import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PhosphorIcon, type PhosphorIconName } from "@/shared/ui/icon";

export type JobCardProps = Readonly<{
  title: string;
  company: string;
  salary: string;
  location: string;
  mode: string;
  experience: string;
  tags: string[];
  href: string;
  logo?: string;
  logoColor?: string;
  badge?: string;
  verified?: boolean;
  className?: string;
}>;

export function JobCard({
  title,
  company,
  salary,
  location,
  mode,
  experience,
  tags,
  href,
  logo,
  logoColor = "#10a778",
  badge,
  verified = false,
  className,
}: JobCardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_22px_52px_rgba(16,167,120,0.14)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <CompanyMark color={logoColor} logo={logo} name={company} />
        <button
          aria-label="Lưu tin tuyển dụng"
          className="upnext-focus hover:border-brand hover:text-brand inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition"
          type="button"
        >
          <PhosphorIcon name="bookmark" size={18} />
        </button>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        {badge ? <Badge className="mb-3 w-fit">{badge}</Badge> : null}
        <h3 className="text-lg leading-snug font-extrabold text-slate-950">
          <Link className="upnext-focus group-hover:text-brand rounded-md transition" href={href}>
            {title}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          {company}
          {verified ? (
            <span className="text-brand inline-flex" title="Nhà tuyển dụng đã xác thực">
              <PhosphorIcon name="seal-check" size={16} weight="fill" />
            </span>
          ) : null}
        </p>

        <dl className="mt-4 grid gap-2 text-sm text-slate-600">
          <Meta icon="currency" label={salary} />
          <Meta icon="map-pin" label={location} />
          <Meta icon="briefcase" label={`${mode} · ${experience}`} />
          <Meta icon="clock" label="Cập nhật gần đây" />
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <span
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        <Button className="mt-5 w-full" size="sm" variant="outline">
          Xem chi tiết
        </Button>
      </div>
    </article>
  );
}

function CompanyMark({
  logo,
  name,
  color,
}: Readonly<{
  logo: string | undefined;
  name: string;
  color: string;
}>) {
  if (logo) {
    return (
      <span className="grid size-14 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Image
          alt={`Logo ${name}`}
          className="h-auto w-10 object-contain"
          height={40}
          src={logo}
          width={40}
        />
      </span>
    );
  }

  return (
    <span
      className="grid size-14 place-items-center rounded-2xl text-lg font-black text-white"
      style={{ background: color }}
    >
      {name.charAt(0)}
    </span>
  );
}

function Meta({ icon, label }: Readonly<{ icon: PhosphorIconName; label: string }>) {
  return (
    <div className="flex items-center gap-2">
      <dt className="sr-only">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className="text-brand">
          <PhosphorIcon name={icon} size={17} />
        </span>
        <span className="truncate">{label}</span>
      </dd>
    </div>
  );
}
