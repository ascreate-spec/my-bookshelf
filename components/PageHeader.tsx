"use client";

import Link from "next/link";
import { ui } from "../lib/ui";

type PageHeaderProps = {
  title: string;
  backHref?: string;
};

export default function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header style={ui.header.fixed}>
      <div style={ui.header.inner}>
        {backHref && (
          <Link href={backHref} aria-label="戻る" style={ui.header.backLink}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 6L9 12L15 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}

        <h1 style={ui.header.title}>{title}</h1>
      </div>
    </header>
  );
}