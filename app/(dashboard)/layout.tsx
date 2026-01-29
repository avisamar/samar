import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SkipLink } from "@/components/ui/skip-link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <AppSidebar />
      <SidebarInset>
        {/* <header className="flex h-12 shrink-0 items-center border-b px-4">
          <SidebarTrigger className="-ml-2" />
        </header> */}
        <main id="main-content" className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
