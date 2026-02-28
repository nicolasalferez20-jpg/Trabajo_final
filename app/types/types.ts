export type LoginUserProps = {
  id: string | number;
  nombre?: string;
  apellido?: string;
  email: string;
  rol?: Role;
};

export type Role = "Administrador" | "Gestor" | "Tecnico" | (string & {});

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "grid"
  | "github"
  | "escape"
  | "linkedin"
  | "panel-left"
  | "panel-right"
  | "plus"
  | "spinner"
  | "archive-box"
  | "trash"
  | "donut"
  | "arrow-up-left"
  | "alert-circle"
  | "eye-rounded"
  | "home"
  | "charts"
  | "db"
  | "user"
  | "camera"
  | "bell"
  | "terminal"
  | "spinner"
  | "download";

export type DashboardStats = {
  solucionados: number;
  creados: number;
  enPausa: number;
  cerrados: number;
};