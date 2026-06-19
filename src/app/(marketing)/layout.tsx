import { SiteNav } from "@/components/marketing/site-nav";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteNav />
      <main className="pt-14">{children}</main>
    </>
  );
}
