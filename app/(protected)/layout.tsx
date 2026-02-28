import type { Metadata } from "next";
import { SidebarProvider } from "@ui/aside";
import MinimalSidebar from "@common/integration-sidebar";
import { StatusBar } from "@common/status-bar";
import { getSessionUser } from "@lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "COLSOF - Dashboard",
  description: "Dashboard interactivo solo para usuarios registrados",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      className="grid h-dvh grid-rows-[auto_1fr]"
    >
      <div className="row-span-2 flex">
        <MinimalSidebar />
        <main className="relative flex flex-1 overflow-auto">
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-background text-foreground p-4 sm:p-6 lg:p-10">
              {children}
            </div>
            <div className="shrink-0">
              <StatusBar userName={user.nombre || "visitante"} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
