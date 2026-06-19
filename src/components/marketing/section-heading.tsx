import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  overline: string;
  title: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  overline,
  title,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <p className="text-caption font-medium uppercase tracking-[0.15em] text-fg-subtle">
        {overline}
      </p>
      <h2 className="text-h1 font-semibold text-fg">{title}</h2>
    </div>
  );
}
