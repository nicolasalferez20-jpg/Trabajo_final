"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@ui/aside";
import { TooltipProvider } from "@ui/tooltip-bar";

import { cn } from "@lib/utils";
import { UseIcon } from "@hooks/use-icons";

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("/api/logout error", err);
    } finally {
      try {
        window.localStorage.removeItem("usuario");
      } catch {}

      router.replace("/");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <SidebarMenuButton
      tooltip="Cerrar sesión"
      className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/80 hover:text-blue-500 group-data-[collapsible=icon]:justify-center cursor-pointer"
      onClick={onLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
    >
      <Image src="/default.webp" alt="" width={20} height={20} />
      <span className="group-data-[collapsible=icon]:hidden">
        {loading ? "Cerrando..." : "Cerrar sesión"}
      </span>
    </SidebarMenuButton>
  );
}

function MinimalSidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        collapsible="icon"
        className="relative flex h-full flex-col border-border border-r text-foreground transition-all duration-300 ease-in-out bg-sidebar"
      >
        <SidebarHeader className="flex w-full flex-row justify-between group-data-[collapsible=icon]:flex-col">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2",
                "group-data-[collapsible=icon]:flex-col",
              )}
              aria-label="Inicio"
            >
              <div className="flex items-center justify-center rounded-lg bg-ring p-2 transition-colors duration-150 hover:bg-ring/80">
                <Image
                  src="/favicon-light.svg"
                  alt="Logo mark"
                  width={30}
                  height={30}
                  className={cn(
                    "h-4 w-4",
                    "group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4",
                  )}
                />
              </div>
              <span className="group-data-[collapsible=icon]:hidden">
                <h2 className="text-xl font-semibold text-black">
                  COLSOF S.A.S
                </h2>
              </span>
            </Link>
          </div>
          <SidebarMenuButton
            tooltip="Abrir panel lateral"
            className="flex size-8 items-center hover:bg-accent/80 justify-center"
            asChild
          >
            <SidebarTrigger>
              <UseIcon name="arrow-left" className="size-4 fill-black" />
            </SidebarTrigger>
          </SidebarMenuButton>
        </SidebarHeader>
        {/*Navegacion principal | Dashboard*/}
        <SidebarContent className="flex-1 gap-0">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Navegar al inicio"
                  className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-blue-500 group-data-[collapsible=icon]:justify-center"
                >
                  <Link
                    aria-label="Ir al inicio"
                    href="/dashboard"
                    data-active={pathname === "/dashboard"}
                    className="flex w-full items-center gap-2 text-muted-foreground group-data-[collapsible=icon]:justify-center"
                  >
                    <UseIcon
                      name="home"
                      className="size-4 shrink-0 fill-black"
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Inicio
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/*Nuevo documento*/}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Acceder a Estadisticas"
                  className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-blue-500 group-data-[collapsible=icon]:justify-center"
                >
                  <Link
                    aria-label="Acceder a Estadisticas"
                    href="/statistics"
                    data-active={pathname === "/statistics"}
                    className="flex w-full items-center gap-2 text-muted-foreground group-data-[collapsible=icon]:justify-center"
                  >
                    <UseIcon
                      name="charts"
                      className="size-4 shrink-0 fill-black"
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Estadisticas
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Ver documentos */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Acceder a herramientas BD"
                  className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/80 hover:text-blue-500 group-data-[collapsible=icon]:justify-center"
                >
                  <Link
                    aria-label="Acceder a herramientas BD"
                    href="/data"
                    data-active={pathname === "/data"}
                    className="flex w-full items-center gap-2 text-muted-foreground group-data-[collapsible=icon]:justify-center"
                  >
                    <UseIcon name="db" className="size-4 shrink-0 fill-black" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Herramientas BD
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Notificaciones"
                  className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/80 hover:text-blue-500 group-data-[collapsible=icon]:justify-center"
                >
                  <Link
                    aria-label="Notificaciones"
                    href="/notification"
                    data-active={pathname === "/notification"}
                    className="flex w-full items-center gap-2 text-muted-foreground group-data-[collapsible=icon]:justify-center"
                  >
                    <UseIcon
                      name="bell"
                      className="size-4 shrink-0 fill-current"
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Notificaciones
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <LogoutButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}

export default MinimalSidebar;
