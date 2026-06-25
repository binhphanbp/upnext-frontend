import { CandidateShell } from "@/features/candidate/candidate-shell";

type CandidateLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  return <CandidateShell>{children}</CandidateShell>;
}
