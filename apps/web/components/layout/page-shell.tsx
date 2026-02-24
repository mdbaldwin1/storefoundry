import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidthClassName?: string;
};

export function PageShell({ children, maxWidthClassName = "max-w-5xl" }: PageShellProps) {
  return <main className={`mx-auto w-full px-6 py-12 md:px-10 ${maxWidthClassName}`}>{children}</main>;
}
