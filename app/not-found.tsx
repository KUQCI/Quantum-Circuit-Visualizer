import { QuantaEmptyState } from "@/components/mascot/QuantaEmptyState";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[50vh] items-center justify-center">
      <h1 className="sr-only">Page not found</h1>
      <QuantaEmptyState
        title="Quanta looked everywhere…"
        description="This page isn't in any register. Head home, open Build, or keep learning."
        variant="thinking"
        actions={[
          { label: "Home", href: "/", primary: true },
          { label: "Open Build", href: "/editor" },
          { label: "Learn", href: "/learn" },
        ]}
      />
    </div>
  );
}
