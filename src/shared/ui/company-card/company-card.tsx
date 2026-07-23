import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { PhosphorIcon } from "@/shared/ui/icon";

export type CompanyCardProps = Readonly<{
  name: string;
  category: string;
  jobs: number;
  followers: string;
  href: string;
  logo?: string;
  cover?: string;
  logoColor?: string;
  description: string;
  tags: string[];
  className?: string;
}>;

export function CompanyCard({
  name,
  category,
  jobs,
  followers,
  href,
  logo,
  cover,
  logoColor = "#10a778",
  description,
  tags,
  className,
}: CompanyCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="from-brand-muted to-premium-muted relative h-32 bg-gradient-to-br via-white">
        {cover ? (
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 384px, 100vw"
            src={cover}
          />
        ) : null}
      </div>
      <div className="relative p-5 pt-0">
        <CompanyLogo color={logoColor} logo={logo} name={name} />
        <div className="pt-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950">
                <Link className="upnext-focus hover:text-brand rounded-md transition" href={href}>
                  {name}
                </Link>
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <PhosphorIcon className="text-brand" name="seal-check" size={16} weight="fill" />
                {category}
              </p>
            </div>
            <Badge tone="premium">{jobs} jobs</Badge>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <PhosphorIcon className="text-brand" name="briefcase" size={17} />
              {jobs} tin
            </span>
            <span className="flex items-center gap-2">
              <PhosphorIcon className="text-brand" name="users" size={17} />
              {followers}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompanyLogo({
  logo,
  name,
  color,
}: Readonly<{
  logo: string | undefined;
  name: string;
  color: string;
}>) {
  return (
    <span className="absolute -top-8 grid size-16 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      {logo ? (
        <Image
          alt={`Logo ${name}`}
          className="size-full object-contain"
          height={44}
          src={logo}
          width={44}
        />
      ) : (
        <span
          className="grid size-full place-items-center font-black text-white"
          style={{ background: color }}
        >
          {name.charAt(0)}
        </span>
      )}
    </span>
  );
}
