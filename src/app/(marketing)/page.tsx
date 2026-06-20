import { ClipboardList, Boxes, Wallet, Check, Activity, Calculator, Package, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";

// Estilos de link que imitam os variantes do Button (mesmas classes Tailwind)
const linkPrimary =
  "inline-flex items-center justify-center transition duration-150 active:scale-[0.97] rounded-md bg-accent px-[18px] py-[10px] font-medium text-accent-fg hover:brightness-110 no-underline";
const linkSecondary =
  "inline-flex items-center justify-center transition duration-150 active:scale-[0.97] rounded-md border border-border-strong bg-transparent px-[18px] py-[10px] text-fg hover:border-fg-muted no-underline";

const features = [
  {
    icon: ClipboardList,
    title: "Comandas em tempo real",
    description:
      "Cada comanda é por mesa, com itens sincronizados ao vivo entre bartender e caixa. Sem grito, sem papel.",
  },
  {
    icon: Boxes,
    title: "Controle de estoque",
    description:
      "Acompanhe o nível de cada insumo e receba alertas antes de acabar no meio do turno. Movimentações e histórico completo.",
  },
  {
    icon: Wallet,
    title: "Caixa sem rasura",
    description:
      "Pagamentos, turnos e fechamento de caixa auditados — sem planilha, sem divergência no final da noite.",
  },
];

const diferenciais = [
  {
    icon: Activity,
    label: "Faturamento em tempo real",
    desc: "Veja o número do dia no celular, de qualquer lugar, enquanto o bar está cheio.",
  },
  {
    icon: Calculator,
    label: "CMV de cada drink",
    desc: "Cadastre o custo de produção e descubra exatamente qual drink dá mais lucro.",
  },
  {
    icon: Package,
    label: "Um plano, tudo incluído",
    desc: "Sem módulo extra, sem surpresa na fatura. Operação e inteligência no mesmo preço.",
  },
  {
    icon: Shield,
    label: "Sem multa para cancelar",
    desc: "Nenhum contrato amarrado. A gente prende pelo valor que o sistema entrega, não pelo papel.",
  },
];

const planFeatures = [
  "Operação completa (bartender, caixa, mesas)",
  "Faturamento e CMV em tempo real",
  "Relatórios por turno e por período",
  "Importação de cardápio via planilha",
  "Suporte e atualizações incluídos",
  "Implantação acompanhada neste período",
  "Sem multa para cancelar",
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-4 mt-4 overflow-hidden rounded-lg border border-border bg-bg-elevated px-8 py-24 sm:px-16 sm:py-32">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-caption font-medium uppercase tracking-[0.15em] text-fg-subtle">
            Sistema operacional para bares premium
          </p>
          <h1 className="text-display-lg sm:text-display-2xl font-bold text-fg">
            Seu bar, sob <span className="text-accent-bright">controle total.</span>
          </h1>
          <p className="text-body-lg max-w-xl text-fg-muted">
            Comandas, estoque, caixa e turno em um único sistema. Sem planilha,
            sem surpresa no fechamento.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <a href="/cadastro" className={linkPrimary}>
              Criar minha conta
            </a>
            <a href="mailto:rodrigobondioli@gmail.com" className={linkSecondary}>
              Falar com a equipe
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="px-8 py-24 sm:px-16">
        <SectionHeading
          align="center"
          overline="O que o SUPERBAR faz"
          title={
            <>
              Tudo que seu bar precisa{" "}
              <span className="text-accent-bright">em um lugar.</span>
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

      {/* Diferenciais */}
      <section className="mx-4 overflow-hidden rounded-lg border border-border bg-bg-elevated px-8 py-20 sm:px-16">
        <SectionHeading
          align="center"
          overline="Por que o SUPERBAR"
          title={
            <>
              Feito pra bar,{" "}
              <span className="text-accent-bright">não adaptado de restaurante.</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.map((d) => (
            <div key={d.label} className="flex flex-col gap-3">
              <d.icon className="h-5 w-5 text-accent-bright" strokeWidth={1.5} />
              <p className="text-body-base font-semibold text-fg">{d.label}</p>
              <p className="text-body-sm text-fg-muted">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-8 py-24 sm:px-16">
        <SectionHeading
          align="center"
          overline="Plano único"
          title={
            <>
              Um preço,{" "}
              <span className="text-accent-bright">tudo dentro.</span>
            </>
          }
          className="mx-auto max-w-2xl"
        />

        <div className="mx-auto mt-16 max-w-md">
          <Card className="flex flex-col gap-6 border-accent-bright">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-accent-bright">
                Plano Fundador
              </p>
              <p className="text-body-sm mt-1 text-fg-muted">
                Para os 10 primeiros bares. Vagas limitadas.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[2.5rem] font-bold leading-none text-fg">
                R$ 697
              </span>
              <span className="text-body-sm text-fg-subtle">/mês</span>
            </div>

            <ul className="flex flex-col gap-3">
              {planFeatures.map((feat) => (
                <li key={feat} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-bright"
                    strokeWidth={2.5}
                  />
                  <span className="text-body-sm text-fg-muted">{feat}</span>
                </li>
              ))}
            </ul>

            <a href="mailto:rodrigobondioli@gmail.com" className={linkPrimary}>
              Quero ser fundador →
            </a>

            <p className="text-caption text-center text-fg-subtle">
              A partir do 11º bar: R$&nbsp;997/mês. Sem módulo extra em ambos.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-4 mb-4 overflow-hidden rounded-lg border border-border bg-bg-elevated px-8 py-20 text-center sm:px-16">
        <h2 className="text-display-lg font-bold text-fg">
          Pronto para <span className="text-accent-bright">profissionalizar</span> seu bar?
        </h2>
        <p className="text-body-lg mx-auto mt-4 max-w-xl text-fg-muted">
          Fale com a gente. Implantação acompanhada, sem burocracia.
        </p>
        <div className="mt-8 flex justify-center">
          <a href="mailto:rodrigobondioli@gmail.com" className={linkPrimary}>
            Entrar em contato
          </a>
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
