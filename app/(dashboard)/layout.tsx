import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* <header className="flex h-12 shrink-0 items-center border-b px-4">
          <SidebarTrigger className="-ml-2" />
        </header> */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
