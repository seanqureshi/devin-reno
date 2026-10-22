import { EmptyState, PageHeader } from "@/components/ui";

export default function Forbidden() {
  return (
    <>
      <PageHeader title="Not available" />
      <EmptyState>Your role doesn&apos;t have access to this page.</EmptyState>
    </>
  );
}
