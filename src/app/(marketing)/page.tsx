import { ClipboardList, Boxes, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: ClipboardList,
    title: "Comandas em tempo real",
    description:
      "Cada comanda é por pessoa, com itens sincronizados ao vivo entre bartenders e caixa.",
  },
  {
    icon: Boxes,
    title: "Estoque automático",
    description:
      "Toda venda baixa o estoque na hora. Alertas de reposição antes de faltar.",
  },
  {
    icon: Wallet,
    title: "Caixa sem rasura",
    description:
      "Pagamentos, turnos e fechamento de caixa auditados — sem planilha, sem divergência.",
  },
];

const plans = [
  {
    slug: "starter",
    name: "Starter",
    price: "199",
    features: ["3 usuários", "10 mesas", "Suporte por e-mail"],
    highlighted: false,
  },
  {
    slug: "pro",
    name: "Pro",
    price: "399",
    features: ["10 usuários", "50 mesas", "Relatórios", "Estoque avançado"],
    highlighted: true,
  },
  {
    slug: "premium",
    name: "Premium",
    price: "699",
    features: ["Usuários ilimitados", "Mesas ilimitadas", "Relatórios", "IA"],
    highlighted: false,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-4 mt-4 overflow-hidden rounded-lg border border-border bg-bg-elevated px-8 py-24 sm:px-16 sm:py-32">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-caption font-medium uppercase tracking-[0.15em] text-fg-subtle">
            OS unificado para bares premium
          </p>
          <h1 className="text-display-lg sm:text-display-2xl font-bold text-fg">
            Seu bar, sob <span className="text-accent-bright">controle total.</span>
          </h1>
          <p className="text-body-lg max-w-xl text-fg-muted">
            Comandas, estoque, caixa e turno em um único sistema. Sem planilha,
            sem surpresa no fechamento.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <Button variant="primary">Começar agora</Button>
            <Button variant="secondary">Ver demonstração</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-24 sm:px-16">
        <SectionHeading
          align="center"
          overline="Plataforma completa"
          title={
            <>
              Tudo que seu bar precisa <span className="text-accent-bright">em um lugar.</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} variant="hero">
              <feature.icon className="h-6 w-6 text-accent-bright" strokeWidth={1.5} />
              <h3 className="text-h3 mt-4 font-semibold text-fg">{feature.title}</h3>
              <p className="text-body-sm mt-2 text-fg-muted">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-4 overflow-hidden rounded-lg border border-border bg-bg-elevated px-8 py-20 sm:px-16">
        <SectionHeading
          align="center"
          overline="Operação em números"
          title={
            <>
              Bares que rodam <span className="text-accent-bright">com o Superbar.</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />
        <div className="mt-16 grid grid-cols-2 gap-10 sm:grid-cols-4">
          <Stat value="120+" label="Bares ativos" />
          <Stat value="98%" label="Uptime" />
          <Stat value="R$2M+" label="Processado/mês" />
          <Stat value="<3s" label="Por comanda" />
        </div>
      </section>

      {/* Pricing */}
      <section className="px-8 py-24 sm:px-16">
        <SectionHeading
          align="center"
          overline="Planos"
          title={
            <>
              Escolha o plano <span className="text-accent-bright">do seu bar.</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.slug}
              className={cn(
                "flex flex-col gap-4",
                plan.highlighted && "border-accent-bright"
              )}
            >
              {plan.highlighted && (
                <Badge variant="indigo" className="self-start">
                  Mais popular
                </Badge>
              )}
              <h3 className="text-h3 font-semibold text-fg">{plan.name}</h3>
              <p className="text-data-lg font-mono font-bold text-fg">
                R$ {plan.price}
                <span className="text-body-sm font-sans font-normal text-fg-subtle">
                  /mês
                </span>
              </p>
              <ul className="text-body-sm flex flex-col gap-2 text-fg-muted">
                {plan.features.map((feat) => (
                  <li key={feat}>{feat}</li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-auto"
              >
                Assinar
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-4 mb-4 overflow-hidden rounded-lg border border-border bg-bg-elevated px-8 py-20 text-center sm:px-16">
        <h2 className="text-display-lg font-bold text-fg">
          Pronto para <span className="text-accent-bright">profissionalizar</span> seu bar?
        </h2>
        <p className="text-body-lg mx-auto mt-4 max-w-xl text-fg-muted">
          14 dias de trial grátis. Sem cartão de crédito.
        </p>
        <div className="mt-8 flex justify-center">
          <Button variant="primary">Começar trial gratuito</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-body-sm flex flex-col items-center gap-2 px-8 py-12 text-center text-fg-subtle">
        <span className="font-semibold text-fg">Superbar</span>
        <span>© {new Date().getFullYear()} Superbar. Todos os direitos reservados.</span>
      </footer>
    </>
  );
}
