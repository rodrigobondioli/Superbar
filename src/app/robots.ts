import type { MetadataRoute } from "next";

// Só a landing pública é indexável. As rotas do app (cadastro, login, dashboard,
// operacional, admin, menu do cliente) ficam fora das buscas.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cadastro",
        "/login",
        "/recuperar-senha",
        "/nova-senha",
        "/aceitar-convite",
        "/onboarding",
        "/dashboard",
        "/admin",
        "/caixa",
        "/garcom",
        "/bartender",
        "/producao",
        "/operacao",
        "/contagem",
        "/mesa",
        "/menu",
        "/api",
      ],
    },
  };
}
