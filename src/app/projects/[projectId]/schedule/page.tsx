import { requireProjectPage } from "@/lib/auth";
import { ComingSoon, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await requireProjectPage(projectId, "schedule:view");
  return (
    <>
      <PageHeader title="Schedule" />
      <ComingSoon feature="Schedule" />
    </>
  );
}
