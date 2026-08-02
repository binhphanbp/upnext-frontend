import { redirect } from "next/navigation";

type LegacyCandidateOAuthCallbackProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function LegacyCandidateOAuthCallback({
  searchParams,
}: LegacyCandidateOAuthCallbackProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const destination = new URLSearchParams();

  if (token) destination.set("token", token);

  const query = destination.toString();
  redirect(`/vi/candidate/auth/callback${query ? `?${query}` : ""}`);
}
