<a id="readme-top"></a>

<div align="center">
 
<strong><h1>Web Oficial de COLSOF</h1></strong>
<a href="https://colsof-app.vercel.app/" target="_blank" rel="noopener noreferrer">
 
![texto](/public/capture.webp)
 
</a>
</div>
 
<br>
<br>
<br>

## 📎 Descripción:

**_COLSOF_** _es un sistema de gestión de tickets orientado al desarrollo y seguimiento de solicitudes por roles. Integra autenticación de usuarios que garantiza el acceso seguro a la plataforma y cuenta con un sistema de notificaciones que mantiene informados a los usuarios sobre el estado y las actualizaciones de sus tickets._

## 🚀 Tech Stack:

- ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)  
  Framework de React para aplicaciones web con renderizado híbrido (SSR, SSG).

- ![TypeScript](https://img.shields.io/badge/typescript-%23235A97.svg?style=for-the-badge&logo=typescript&logoColor=white)  
  JavaScript que añade tipado para mejorar escalabilidad y mantenibilidad.

- ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%233EBFF8.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)  
  Framework CSS para construir interfaces modernas y responsivas rápidamente.

- ![Supabase](https://img.shields.io/badge/Supabase-%231B653A?style=for-the-badge&logo=supabase&logoColor=white)  
  Backend as a Service basado en PostgreSQL con autenticación, base de datos y APIs en tiempo real.

- ![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)  
  Editor de código ligero y potente con gran ecosistema de extensiones.

- ![Zod](https://img.shields.io/badge/zod-%234658BD.svg?style=for-the-badge&logo=zod&logoColor=white)  
  Librería de validación y tipado para esquemas en TypeScript.

- ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)  
  Plataforma de despliegue para aplicaciones frontend y proyectos con Next.js.

<p align="right">
    (<a href="#readme-top">regresar</a>)
    (<a href="#readme-index">índice</a>)
</p>

<a id="readme-index"></a>

## 🧭 Índice:

1. [Desarrollo Local](#%EF%B8%8F-desarrollo-local)

## 🗂️ Estructura del Proyecto

El proyecto está estructurado siguiendo el patrón por capas:

- **Presentación (UI)**: Componentes reutilizables y vistas.
- **Ruteo (App Router)**: Páginas y layouts organizados por segmentos.
- **Lógica de negocio / utilidades**: Funciones de apoyo, helpers, hooks.
- **Datos / Integraciones**: Endpoints en `app/api` (cuando aplica).

### 🧱 Estructura principal

```text
Trabajo_final/
  app/
    (auth)/
    (protected)/
      data/
        page.tsx
      notification/
        page.tsx
      statistics/
        page.tsx
    api/
    components/
      common/
      dashboard/
      ui/
    hooks/
    lib/
    schemas/
    types/
    globals.css
    layout.tsx
    page.tsx
    not-found.tsx
  public/
    fonts/
    bg.webp
    bghero.webp
    default-user.webp
    favicon.svg
  postcss.config.mjs
  next.config.ts
  tsconfig.json
  package.json
  README.md
```

### 🗺️ Diagrama (visión general)

```mermaid
flowchart TB
  A[Next.js - App Router] --> B[app/]
  B --> R[Rutas y Layouts\npage.tsx, layout.tsx]
  B --> Seg[Segmentos\n(auth), (protected)]
  B --> API[API Routes\napp/api]
  B --> C[Componentes\napp/components]
  B --> H[Hooks\napp/hooks]
  B --> L[Lib / Utils\napp/lib]
  B --> S[Schemas\napp/schemas]
  B --> T[Types\napp/types]
  B --> G[Estilos globales\napp/globals.css]

  P[public/] --> Assets[Assets\nimagenes, svg, fuentes]
```

## 🔐 Modelo de Roles

| Rol           | Permisos principales               |
| ------------- | ---------------------------------- |
| Administrador | Gestión de usuarios, control total |
| Gestor        | Creación y seguimiento de tickets  |

---

## 🖥️ Desarrollo Local:

> [!IMPORTANT]
> Necesita tener instalado [**npm**](https://nodejs.org/)

1. Clone el repositorio:

```bash
git clone https://github.com/nicolasalferez20-jpg/Trabajo_final.git
```

2. Entre en el repositorio:

```bash
cd Trabajo_final
```

3. Instale las dependencias:

```bash
npm install
```

4. Configure el archivo .env:

```bash
# Linux/MacOS:
cp .env.example .env

# Windows:
copy .env.example .env
```

> [!NOTE]
> Recuerde establecer correctamente las credenciales correspondientes en el archivo **.env** si requiere un buen funcionamiento del _backend_, de lo contrario solamente renderizará el _frontend_.

5. Inicie el servidor en modo desarrollo:

```bash
npm run dev
```

6. Abra el navegador en la siguiente URL:

→ [http://localhost:3000](http://localhost:3000)

<p align="right">
    (<a href="#readme-top">regresar</a>)
    (<a href="#readme-index">índice</a>)
</p>
