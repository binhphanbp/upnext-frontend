import { AdminSupportCaseDetail } from "@/features/chat/components/admin-support-case-detail";

export default async function AdminSupportCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminSupportCaseDetail caseId={id} />;
}
