"use client";

import Link from "next/link";
import { ui } from "../lib/ui";

type PageHeaderProps = {
  title: string;
  backHref?: string;
};

export default function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <div
      style={{
        background: ui.colors.primary,
        color: ui.colors.primaryText,
        padding: "26px 16px",
        margin: "-24px -16px 24px -16px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(38, 51, 34, 0.08)",
        position: "relative",
      }}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label="戻る"
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: ui.colors.primaryText,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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

      <h1
        style={{
          margin: 0,
          fontSize: "20px",
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </h1>
    </div>
  );
}