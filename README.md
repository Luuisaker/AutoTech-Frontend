# AutoTech Frontend

Marketplace de repuestos y servicios automotrices para Venezuela. Interfaz con crédito en línea, pagos a cuotas, verificación de talleres, y gestión completa de órdenes de compra y servicio. Incluye panel de administración, dashboard de taller, y experiencia de cliente con carrito multi-taller, checkout con financiamiento, y seguimiento de órdenes de servicio.

## Stack tecnológico

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-FF4154?logo=reactrouter&logoColor=white)](https://tanstack.com/start)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-FF4154?logo=reactrouter&logoColor=white)](https://tanstack.com/router)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white)](https://axios-http.com)
[![Zod](https://img.shields.io/badge/Zod-3E6F9F?logo=zod&logoColor=white)](https://zod.dev)
[![Recharts](https://img.shields.io/badge/Recharts-22B5BF?logo=recharts&logoColor=white)](https://recharts.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)

## Arquitectura

**File-based routing** con TanStack Router, **SSR** con TanStack Start, estado server con **TanStack Query**, y UI componentizada con **shadcn/ui** (dark theme).

```
src/
├── routes/                        # Rutas file-based (TanStack Router)
│   ├── __root.tsx                 # Layout raíz con providers
│   ├── index.tsx                  # Landing page (público)
│   ├── auth.tsx                   # Login / registro (público)
│   └── _authenticated/            # Rutas protegidas
│       ├── _authenticated.tsx     # Auth guard + sidebar layout
│       └── dashboard/             # Páginas del dashboard
├── components/                    # Componentes reutilizables
│   ├── ui/                        # shadcn/ui primitives
│   ├── purchases/                 # Componentes de compras
│   └── credit-line.tsx            # Componente de línea de crédito
├── lib/                           # Utilidades y configuración
│   ├── api.ts                     # Funciones API tipadas
│   ├── axios.ts                   # Instancia Axios con interceptores
│   ├── auth.ts                    # Funciones de autenticación
│   ├── auth-context.tsx           # Context provider de auth
│   ├── locale-context.tsx         # Context provider de i18n
│   ├── locales/                   # Traducciones (es.ts, en.ts)
│   ├── bcv.ts                     # Tasa BCV
│   └── token.ts                   # Gestión de JWT
└── styles.css                     # Tailwind v4 + tema oscuro
```

- **Routing**: `_authenticated.tsx` actúa como guard + layout. `$param` para segmentos dinámicos.
- **Estado server**: TanStack Query con invalidación por `queryKey`.
- **i18n**: Sistema de traducción propio con `useLocale()` y `t()`, soporte ES/EN.
- **Auth**: JWT en `localStorage`, interceptor Axios auto-atacha Bearer token, redirect a `/auth` en 401.
- **Roles**: `CLIENT`, `WORKSHOP_OWNER`, `ADMIN` — sidebar y rutas condicionales por rol.
- **Styling**: Tailwind v4 con `@theme inline`, dark theme only, colores OKLCH, `cn()` utility.

## Guía de inicio rápido

### Prerrequisitos

- **Node.js 20+** o **Bun**
- **npm** (incluido con Node.js)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Luuisaker/AutoTech.git
cd AutoTech/AutoTech-Frontend

# Instalar dependencias
npm install
```

### Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`. El dev server regenera automáticamente `routeTree.gen.ts` en cada inicio.

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (regenera routeTree.gen.ts) |
| `npm run build` | Build de producción |
| `npm run build:dev` | Build en modo desarrollo |
| `npm run preview` | Previsualizar build de producción |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Licencia

© 2026 Luis Ayala (@Luuisaker). Todos los derechos reservados.

Este software y su código fuente son propiedad exclusiva de Luis Ayala (@Luuisaker).

* No está permitido copiar, modificar, distribuir, sublicenciar ni usar este código, total o parcialmente, sin autorización expresa y por escrito del autor.
* No está permitido usar este código con fines comerciales ni privados sin una licencia válida.
* Cualquier uso no autorizado constituye una violación de los derechos de autor y será perseguido conforme a la ley.

Este es un software propietario. No es código abierto (open source) ni software libre. Ver [LICENSE](LICENSE) para más detalles.
