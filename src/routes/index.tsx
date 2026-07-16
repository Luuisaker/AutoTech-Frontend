import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Wrench,
  CreditCard,
  CheckCircle2,
  FileText,
  Store,
  Users,
  BarChart3,
  Lock,
  Layers,
  Wallet,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useLocale } from "../lib/locale-context";


const TRUST_ICONS = [ShieldCheck, Lock, CreditCard, FileText] as const;
const TRUST_KEYS = ["landing.trustVerified", "landing.trustProtected", "landing.trustClear", "landing.trustApproval"] as const;

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

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
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header t={t} />
      <main>
        <Hero t={t} />
        <TrustStrip t={t} />
        <Marketplace t={t} />
        <HowItWorks t={t} />
        <Network t={t} />
        <CreditTiers t={t} />
        <Features t={t} />
        <FinalCTA t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

/* ---------------- Header ---------------- */

function Header({ t }: { t: (key: string) => string }) {
  const { locale, setLocale } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-edge flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo size={28} withText />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <button
            onClick={() => scrollToSection("marketplace")}
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
          >
            {t("landing.headerMarketplace")}
          </button>
          <button
            onClick={() => scrollToSection("talleres")}
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
          >
            {t("landing.headerWorkshops")}
          </button>
          <button
            onClick={() => scrollToSection("servicios")}
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
          >
            {t("landing.headerServices")}
          </button>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setLocale(locale === "es" ? "en" : "es")}
            className="inline-flex h-9 items-center rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {locale === "es" ? "EN" : "ES"}
          </button>
          <Link
            to="/auth"
            className="hidden h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            {t("landing.headerLogin")}
          </Link>
          <Link
            to="/auth"
            search={{ mode: "register" }}
            className="hidden h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            {t("landing.headerSignup")}
          </Link>
          <Link
            to="/auth"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:hidden"
          >
            {t("landing.headerAccess")}
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="container-edge grid gap-6 py-8 sm:gap-12 sm:py-20 lg:gap-16 lg:py-28">
        <div className="relative flex flex-col justify-center text-center sm:text-left">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-pretty sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle1")}
            <br />
            <span className="text-primary">{t("landing.heroTitle2")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {t("landing.heroDesc")}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <button
              onClick={() => scrollToSection("marketplace")}
              className="ml-btn ml-btn-primary min-h-12 px-5 text-sm sm:px-6"
            >
              {t("landing.heroCTA")}
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="ml-btn ml-btn-outline h-12 px-5 text-sm sm:px-6 border-border-strong"
            >
              {t("landing.heroCTAStart")}
            </Link>
          </div>

          <dl className="mt-7 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-6">
            <div className="ml-stat-card">
              <dt className="ml-stat-label">{t("landing.statCreditLine")}</dt>
              <dd className="ml-stat-value">{t("landing.statCreditValue")}</dd>
            </div>
            <div className="ml-stat-card">
              <dt className="ml-stat-label">{t("landing.statPayments")}</dt>
              <dd className="ml-stat-value">{t("landing.statPaymentsValue")}</dd>
            </div>
            <div className="ml-stat-card">
              <dt className="ml-stat-label">{t("landing.statServices")}</dt>
              <dd className="ml-stat-value">{t("landing.statServicesValue")}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust strip ---------------- */

function TrustStrip({ t }: { t: (key: string) => string }) {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="container-edge flex items-center gap-2 overflow-x-auto py-4 sm:flex-wrap sm:justify-center sm:gap-3 sm:py-5">
        {TRUST_ICONS.map((Icon, i) => (
          <span
            key={TRUST_KEYS[i]}
            className="ml-badge shrink-0 border border-border-strong bg-surface text-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {t(TRUST_KEYS[i])}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Marketplace ---------------- */

function Marketplace({ t }: { t: (key: string) => string }) {
  return (
    <section id="marketplace" className="border-b border-border">
      <div className="container-edge py-12 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("landing.marketplaceTitle")}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-pretty sm:text-4xl">
            {t("landing.marketplaceHeading")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
            {t("landing.marketplaceDesc")}
          </p>

          <ul className="mt-8 space-y-4 text-left sm:mt-10 sm:space-y-5">
            <Bullet title={t("landing.bullet1Title")}>
              {t("landing.bullet1Desc")}
            </Bullet>
            <Bullet title={t("landing.bullet2Title")}>
              {t("landing.bullet2Desc")}
            </Bullet>
            <Bullet title={t("landing.bullet3Title")}>
              {t("landing.bullet3Desc")}
            </Bullet>
          </ul>
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
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{children}</p>
      </div>
    </li>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="ml-card flex gap-5 p-5">
      <span className="font-mono text-sm text-primary">{n}</span>
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorks({ t }: { t: (key: string) => string }) {
  const steps = [
    { n: "01", title: t("landing.step1Title"), text: t("landing.step1Desc") },
    { n: "02", title: t("landing.step2Title"), text: t("landing.step2Desc") },
    { n: "03", title: t("landing.step3Title"), text: t("landing.step3Desc") },
    { n: "04", title: t("landing.step4Title"), text: t("landing.step4Desc") },
  ];
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="container-edge py-12 sm:py-24 lg:py-32">
        <div className="max-w-2xl">
          <span className="eyebrow">{t("landing.howItWorksTitle")}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-pretty sm:text-4xl">
            {t("landing.howItWorksHeading")}
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="ml-card p-4 sm:p-6">
              <span className="font-mono text-sm text-primary">{s.n}</span>
              <h3 className="mt-3 text-base font-semibold tracking-tight sm:mt-4 sm:text-lg">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Network of workshops ---------------- */

function Network({ t }: { t: (key: string) => string }) {
  return (
    <section id="talleres" className="border-b border-border">
      <div className="container-edge py-12 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("landing.networkTitle")}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-pretty sm:text-4xl">
            {t("landing.networkHeading")}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:mt-5 sm:text-base">
            {t("landing.networkDesc")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-16 sm:gap-6 lg:grid-cols-2">
          <Panel
            tag={t("landing.networkOwnersTag")}
            icon={Users}
            title={t("landing.networkOwnersTitle")}
            features={[
              t("landing.networkOwner1"),
              t("landing.networkOwner2"),
              t("landing.networkOwner3"),
              t("landing.networkOwner4"),
            ]}
          />
          <Panel
            tag={t("landing.networkWorkshopsTag")}
            icon={Store}
            title={t("landing.networkWorkshopsTitle")}
            features={[
              t("landing.networkWorkshop1"),
              t("landing.networkWorkshop2"),
              t("landing.networkWorkshop3"),
              t("landing.networkWorkshop4"),
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
    <div className="ml-card p-5 sm:p-8">
      <div className="flex items-center justify-between border-b border-border pb-4 sm:pb-5">
        <span className="eyebrow">{tag}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight sm:mt-6 sm:text-2xl">{title}</h3>
      <ul className="mt-5 space-y-3 sm:mt-6">
        {features.map((f) => (
          <li key={f} className="flex gap-3 text-xs text-muted-foreground sm:text-sm">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Credit tiers ---------------- */

function CreditTiers({ t }: { t: (key: string) => string }) {
  const tiers = [
    { name: t("landing.tierInitial"), min: "60%", desc: t("landing.tierInitialDesc"), key: "tierInitial" },
    { name: t("landing.tierSilver"), min: "50%", desc: t("landing.tierSilverDesc"), key: "tierSilver" },
    { name: t("landing.tierSilverPlus"), min: "40%", desc: t("landing.tierSilverPlusDesc"), key: "tierSilverPlus" },
    { name: t("landing.tierGold"), min: "30%", desc: t("landing.tierGoldDesc"), key: "tierGold" },
  ];
  return (
    <section id="servicios" className="border-b border-border bg-surface/40">
      <div className="container-edge py-12 sm:py-24 lg:py-32">
        <div className="max-w-2xl">
          <span className="eyebrow">{t("landing.creditTiersTitle")}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-pretty sm:text-4xl">
            {t("landing.creditTiersHeading")}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:mt-5 sm:text-base">
            {t("landing.creditTiersDesc")}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <div
              key={tier.key}
              className={`ml-card p-4 sm:p-6 ${i === tiers.length - 1 ? "border-primary/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow">{t("landing.tierLevel")} {i + 1}</span>
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight sm:mt-4 sm:text-xl">{tier.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:text-sm">{tier.desc}</p>
              <div className="mt-4 border-t border-border pt-3 sm:mt-5 sm:pt-4">
                <p className="text-xs text-muted-foreground">{t("landing.tierDownPayment")}</p>
                <p className="mt-1 text-base font-semibold text-primary sm:text-lg">{t("landing.tierFrom")} {tier.min}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */

function Features({ t }: { t: (key: string) => string }) {
  const features = [
    { icon: FileText, title: t("landing.feature1Title"), text: t("landing.feature1Desc") },
    { icon: Layers, title: t("landing.feature2Title"), text: t("landing.feature2Desc") },
    { icon: Wallet, title: t("landing.feature3Title"), text: t("landing.feature3Desc") },
    { icon: Wrench, title: t("landing.feature4Title"), text: t("landing.feature4Desc") },
  ];
  return (
    <section className="border-b border-border">
      <div className="container-edge py-12 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">{t("landing.featuresTitle")}</span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.featuresHeading")}
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("landing.featuresDesc")}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="ml-card flex gap-4 p-5 sm:gap-5 sm:p-6">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border-strong sm:h-10 sm:w-10">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground sm:text-base">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-sm">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA({ t }: { t: (key: string) => string }) {
  return (
    <section id="registro" className="border-b border-border bg-surface/40">
      <div className="container-edge py-12 sm:py-24">
        <div className="ml-card bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-10 md:p-14">
          <div className="grid gap-8 sm:gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-pretty sm:text-4xl">
                {t("landing.ctaTitle")}
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground sm:mt-4">
                {t("landing.ctaDesc")}
              </p>
            </div>

            <div className="grid content-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "register", type: "client" }}
                className="group flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 transition-all hover:border-primary/50 hover:shadow-sm sm:px-5 sm:py-4"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("landing.ctaOwner")}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/auth"
                search={{ mode: "register", type: "workshop" }}
                className="group flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-primary-foreground shadow-sm transition-all hover:brightness-110 sm:px-5 sm:py-4"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("landing.ctaRegisterWorkshop")}</span>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer({ t }: { t: (key: string) => string }) {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="container-edge flex flex-col items-center justify-between gap-3 py-5 sm:py-8 sm:flex-row">
        <div className="flex items-center">
          <Logo size={24} withText />
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-6">
          <a href="#marketplace" className="hover:text-foreground">
            {t("landing.footerMarketplace")}
          </a>
          <a href="#talleres" className="hover:text-foreground">
            {t("landing.footerWorkshops")}
          </a>
          <a href="#servicios" className="hover:text-foreground">
            {t("landing.footerServices")}
          </a>
          <a href="#registro" className="hover:text-foreground">
            {t("landing.footerSignup")}
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoTech. {t("landing.footerRights")}
        </p>
      </div>
    </footer>
  );
}
