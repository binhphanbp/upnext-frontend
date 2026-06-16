import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

type LogoProps = Readonly<{
  href?: string;
  className?: string;
  markOnly?: boolean;
}>;

export function Logo({ href = "/", className, markOnly = false }: LogoProps) {
  const image = (
    <Image
      alt="UpNext"
      className="block"
      height={markOnly ? 36 : 38}
      priority
      src={markOnly ? "/upnext-logo/icon-cropped.png" : "/upnext-logo/wordmark-cropped.png"}
      width={markOnly ? 39 : 158}
    />
  );

  return (
    <Link
      aria-label="UpNext home"
      className={cn("upnext-focus inline-flex rounded-md", className)}
      href={href}
    >
      {image}
    </Link>
  );
}
