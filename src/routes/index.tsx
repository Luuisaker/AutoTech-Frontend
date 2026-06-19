import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Wrench,
  CreditCard,
  CheckCircle2,
  FileText,
  LifeBuoy,
  Store,
  Users,
  BarChart3,
  Lock,
} from "lucide-react";
import heroMockup from "@/assets/hero-mockup.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoTech" },
      {
        name: "description",
        content:
          "Marketplace automotriz con financiamiento a cuotas y red de talleres verificados. Repara hoy, paga después.",
      },
      { property: "og:title", content: "AutoTech — Repuestos a cuotas y talleres certificados" },
      {
        property: "og:description",
        content: "Financia tus repuestos y encuentra talleres de confianza en un solo lugar.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Marketplace />
        <Network />
        <ExtraValue />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- Header ---------------- */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-edge flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <LogoMark />
          <span className="text-base font-semibold tracking-tight">AutoTech</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#marketplace" className="text-sm text-muted-foreground hover:text-foreground">
            Marketplace
          </a>
          <a href="#talleres" className="text-sm text-muted-foreground hover:text-foreground">
            Talleres
          </a>
          <a href="#servicios" className="text-sm text-muted-foreground hover:text-foreground">
            Servicios
          </a>
          <a href="#empresa" className="text-sm text-muted-foreground hover:text-foreground">
            Empresa
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Ingresar
          </Link>
          <Link
            to="/auth"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="grid h-7 w-7 place-items-center rounded-md border border-border-strong bg-surface">
      <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="container-edge grid gap-12 py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-28">
        <div className="flex flex-col justify-center">
          <span className="eyebrow">Plataforma automotriz · Financiamiento</span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Repara hoy.
            <br />
            <span className="text-muted-foreground">Paga a cuotas.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            AutoTech conecta a dueños de vehículos con talleres certificados y financia tus
            repuestos directamente en la plataforma. Una sola decisión, transparencia total.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#marketplace"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explorar repuestos a cuotas
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#talleres"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
            >
              Registra tu taller
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            <Stat value="+12k" label="Conductores activos" />
            <Stat value="850" label="Talleres certificados" />
            <Stat value="0%" label="Cuota inicial" />
          </dl>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-border-strong bg-surface">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="ml-3 text-xs text-muted-foreground">app.autotech.com</span>
            </div>
            <img
              src={heroMockup}
              alt="Panel de AutoTech mostrando repuestos a cuotas"
              width={1280}
              height={960}
              className="block w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-2xl font-semibold tracking-tight">{value}</dt>
      <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

/* ---------------- Trust strip ---------------- */

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, label: "Talleres verificados" },
    { icon: Lock, label: "Pagos protegidos" },
    { icon: CreditCard, label: "Cuotas sin papeleo" },
    { icon: FileText, label: "Historial inmutable" },
  ];
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="container-edge grid grid-cols-2 divide-x divide-border border-x border-border md:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 px-6 py-5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Marketplace ---------------- */

function Marketplace() {
  return (
    <section id="marketplace" className="border-b border-border">
      <div className="container-edge py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <span className="eyebrow">Prioridad 01 · Marketplace</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Repuestos financiados, sin sorpresas en tu bolsillo.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Selecciona el repuesto, elige tu plan de cuotas y recíbelo en el taller de tu
              elección. Aprobación en minutos, sin trámites bancarios ni cuota inicial.
            </p>

            <ul className="mt-10 space-y-5">
              <Bullet title="Aprobación inmediata">
                Evaluación crediticia digital con respuesta en menos de 5 minutos.
              </Bullet>
              <Bullet title="Cuotas claras y fijas">
                Conoces el monto total antes de comprar. Cero costos ocultos.
              </Bullet>
              <Bullet title="Entrega coordinada con el taller">
                El repuesto llega directamente al taller certificado que elegiste.
              </Bullet>
            </ul>
          </div>

          <div className="space-y-4">
            <Step
              n="01"
              title="Cotiza tu repuesto"
              text="Busca por marca, modelo y año. Compara precios de proveedores verificados."
            />
            <Step
              n="02"
              title="Elige tu plan de cuotas"
              text="De 3 a 24 meses. Tasa y total visibles antes de confirmar."
            />
            <Step
              n="03"
              title="Confirma con tu taller"
              text="Asigna el taller certificado que realizará la instalación."
            />
            <Step
              n="04"
              title="Paga mientras tu auto trabaja"
              text="Cuotas mensuales automáticas. Recibos disponibles en tu historial."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex gap-5 rounded-md border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <span className="text-sm font-mono text-muted-foreground">{n}</span>
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/* ---------------- Network of workshops ---------------- */

function Network() {
  return (
    <section id="talleres" className="border-b border-border bg-surface/40">
      <div className="container-edge py-24 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Prioridad 02 · Red de talleres</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Una red certificada. Dos formas de ganar.
          </h2>
          <p className="mt-5 text-base text-muted-foreground">
            Construimos confianza entre conductores y talleres con un proceso de auditoría
            profesional y una plataforma digital compartida.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Panel
            tag="Para conductores"
            icon={Users}
            title="Talleres auditados y trazables"
            features={[
              "Verificación de identidad y permisos operativos",
              "Reseñas con orden de servicio confirmada",
              "Cotización transparente antes de iniciar trabajos",
              "Resolución de disputas mediada por AutoTech",
            ]}
          />
          <Panel
            tag="Para talleres"
            icon={Store}
            title="Más clientes. Menos fricción."
            features={[
              "Acceso a conductores verificados con financiamiento aprobado",
              "Gestión integrada de órdenes, repuestos y pagos",
              "Sello 'Taller Certificado AutoTech' con autoridad institucional",
              "Liquidaciones semanales sin retención de capital",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Panel({
  tag,
  icon: Icon,
  title,
  features,
}: {
  tag: string;
  icon: typeof Users;
  title: string;
  features: string[];
}) {
  return (
    <div className="rounded-lg border border-border-strong bg-background p-8">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <span className="eyebrow">{tag}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex gap-3 text-sm text-muted-foreground">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Extras: secondary block ---------------- */

function ExtraValue() {
  return (
    <section id="servicios" className="border-b border-border">
      <div className="container-edge py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">Servicios incluidos</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Valor agregado para tu tranquilidad.
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Funciones complementarias diseñadas para acompañarte más allá de la transacción.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Extra
            icon={FileText}
            title="Historial Vehicular Inmutable"
            text="Cada reparación, repuesto y mantenimiento queda registrado en un historial digital trazable. Aumenta el valor de reventa de tu vehículo."
          />
          <Extra
            icon={LifeBuoy}
            title="Asistencia Vial 24/7"
            text="Cobertura de emergencia con tiempo de respuesta promedio de 35 minutos. Activable desde la app con un solo toque."
          />
        </div>
      </div>
    </section>
  );
}

function Extra({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileText;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-5 rounded-md border border-border bg-surface p-6">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border-strong">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA() {
  return (
    <section id="registro" className="border-b border-border bg-surface/40">
      <div className="container-edge py-24">
        <div className="grid gap-10 rounded-lg border border-border-strong bg-background p-10 md:grid-cols-2 md:p-14">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Comienza con AutoTech hoy.
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Únete a la plataforma que está formalizando el ecosistema automotriz con
              financiamiento responsable y talleres de confianza.
            </p>
          </div>

          <div className="grid content-center gap-3">
            <a
              href="#conductor"
              className="group flex items-center justify-between rounded-md border border-border bg-surface px-5 py-4 transition-colors hover:border-foreground/40"
            >
              <div className="flex items-center gap-4">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Soy conductor</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#taller"
              className="group flex items-center justify-between rounded-md bg-primary px-5 py-4 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <div className="flex items-center gap-4">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Registrar mi taller</span>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer id="empresa" className="bg-background">
      <div className="container-edge grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-base font-semibold tracking-tight">AutoTech</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Infraestructura financiera y operativa para la industria automotriz.
          </p>
        </div>
        <FooterCol
          title="Producto"
          links={["Marketplace", "Financiamiento", "Talleres", "Asistencia 24/7"]}
        />
        <FooterCol title="Empresa" links={["Sobre nosotros", "Prensa", "Carreras", "Contacto"]} />
        <FooterCol
          title="Legal"
          links={["Términos", "Privacidad", "Política de crédito", "Cumplimiento"]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-edge flex flex-col items-start justify-between gap-3 py-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AutoTech. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Regulado y auditado por entidades financieras locales.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
