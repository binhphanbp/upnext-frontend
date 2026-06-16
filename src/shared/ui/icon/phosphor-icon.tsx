"use client";

import {
  ArrowRight,
  BookmarkSimple,
  Briefcase,
  Buildings,
  Clock,
  CurrencyCircleDollar,
  EnvelopeSimple,
  MapPin,
  Phone,
  SealCheck,
  Sparkle,
  TrendUp,
  UsersThree,
  type IconProps,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

export type PhosphorIconName =
  | "arrow-right"
  | "bookmark"
  | "briefcase"
  | "buildings"
  | "clock"
  | "currency"
  | "envelope"
  | "map-pin"
  | "phone"
  | "seal-check"
  | "sparkle"
  | "trend-up"
  | "users";

type PhosphorIconProps = Omit<IconProps, "ref"> & {
  name: PhosphorIconName;
};

const icons = {
  "arrow-right": ArrowRight,
  bookmark: BookmarkSimple,
  briefcase: Briefcase,
  buildings: Buildings,
  clock: Clock,
  currency: CurrencyCircleDollar,
  envelope: EnvelopeSimple,
  "map-pin": MapPin,
  phone: Phone,
  "seal-check": SealCheck,
  sparkle: Sparkle,
  "trend-up": TrendUp,
  users: UsersThree,
} satisfies Record<PhosphorIconName, ComponentType<IconProps>>;

export function PhosphorIcon({ name, ...props }: PhosphorIconProps) {
  const Icon = icons[name];

  return <Icon {...props} />;
}
