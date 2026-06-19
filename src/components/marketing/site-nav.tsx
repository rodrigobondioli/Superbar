import Link from "next/link";
import { NavPill } from "@/components/ui/nav-pill";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#produto", label: "Produto" },
  { href: "#precos", label: "Preços" },
  { href: "#sobre", label: "Sobre" },
];

export function SiteNav() {
  return (
    <NavPill className="flex w-[min(640px,calc(100vw-2rem))] items-center justify-between gap-6">
      <Link href="/" className="text-sm font-semibold tracking-tight text-fg">
        Superbar
      </Link>

      <ul className="hidden items-center gap-6 sm:flex">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <Button variant="primary" className="px-5 py-2 text-sm">
        Começar agora
      </Button>
    </NavPill>
  );
}
