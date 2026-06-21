export default function MesaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)", color: "var(--fg)" }}>
      {children}
    </div>
  );
}
