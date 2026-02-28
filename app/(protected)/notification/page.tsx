import { Button } from "@/app/components/ui/button";
import { UseIcon } from "@/app/hooks/use-icons";
import { cn } from "@/app/lib/utils";
import { IconName } from "@/app/types/types";

export interface statsProps {
  label: string;
  value: number;
  subtext?: string;
  icon: IconName;
  variant: string;
}

const stats: statsProps[] = [
  {
    label: "Críticas",
    value: 2,
    icon: "alert-circle",
    variant: "critical",
  },
  {
    label: "Sistema",
    value: 4,
    subtext: "3 nuevas",
    icon: "alert-circle",
    variant: "system",
  },
  {
    label: "Usuarios",
    value: 3,
    subtext: "2 nuevas",
    icon: "grid",
    variant: "users",
  },
  {
    label: "Seguridad",
    value: 1,
    icon: "trash",
    variant: "security",
  },
  {
    label: "Base de Datos",
    value: 1,
    icon: "db",
    variant: "database",
  },
];

export default function NotificationPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div>
        <div className="w-full">
          <header
            className={cn(
              "relative w-full",
              "flex flex-col sm:flex-row",
              "sm:items-center sm:justify-between",
              "rounded-sm",
              "px-4 py-4 sm:py-3",
              "mb-5",
              "gap-4 sm:gap-2",
              "text-primary-foreground",
              "bg-[linear-gradient(135deg,var(--primary)_0%,var(--accent)_100%)]",
              "shadow-lg shadow-foreground/10",
              "before:absolute before:inset-x-0 before:top-0 before:h-1.5",
              "before:rounded-t-xl",
              "before:bg-[linear-gradient(90deg,var(--accent),var(--success),var(--primary))]",
              "before:content-['']",
            )}
          >
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium">
                🔔 Centro de Notificaciones
              </h1>
              <p className="text-xs sm:text-sm opacity-90">
                Monitoreo y gestión de alertas del sistema
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                <UseIcon name="plus" className="size-4" />
                Enviar Notificación
              </Button>
            </div>
          </header>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 mb-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`
            bg-white
            border border-slate-200
            rounded-sm
            px-3 py-2.5
            relative overflow-hidden
            flex items-center gap-2.5
            shadow-[0_4px_12px_rgba(0,0,0,0.06)]
            transition-all duration-300 ease-in-out
            hover:-translate-y-0.5
            hover:border-slate-300
            hover:shadow-[0_8px_18px_rgba(25,118,210,0.12)]
            before:content-['']
            before:absolute
            before:top-0
            before:left-0
            before:w-0.75
            before:h-full
            before:rounded-l-sm
            ${stat.variant}
            `}
            >
              <div className="w-8 h-8 rounded-sm grid place-items-center bg-slate-50 text-slate-600 text-sm shrink-0">
                <UseIcon name={stat.icon} className="size-5" />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600 mb-0.5">
                  {stat.label}
                </span>

                <span className="text-2xl font-bold text-primary mb-0.5">
                  {stat.value}
                </span>

                {stat.subtext && (
                  <span className="text-xs text-slate-500">{stat.subtext}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
