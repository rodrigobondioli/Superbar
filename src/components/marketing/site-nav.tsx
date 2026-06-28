import Link from "next/link";
import Image from "next/image";

export function SiteNav() {
  return (
    <nav className="relative md:fixed md:left-0 md:right-0 md:top-0 md:z-50">
      <div className="flex items-start justify-between px-4 md:px-8 lg:px-14" style={{ paddingTop: 32, paddingBottom: 20 }}>
        <Link href="/">
          <Image
            src="/img-lp/logo-superbar.svg"
            alt="Superbar"
            width={58}
            height={58}
            className="opacity-90"
          />
        </Link>
        <span
          className="text-white"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14 }}
        >
          Superbar Intelligence
        </span>
      </div>
    </nav>
  );
}
