"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui } from "../lib/ui";

function BookshelfIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 5V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 7V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13.5 5V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 8V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3.5 19.5H20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5V19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ManageIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 17H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 7V7.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M15.5 12V12.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10 17V17.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
  { href: "/", label: "本棚", icon: <BookshelfIcon />, isCenter: false },
  { href: "/add", label: "追加", icon: <AddIcon />, isCenter: true },
  { href: "/manage", label: "管理", icon: <ManageIcon />, isCenter: false },
];

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: ui.colors.cardBg,
        borderTop: `1px solid ${ui.colors.border}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
        zIndex: 1000,
        boxShadow: "0 -4px 12px rgba(38, 51, 34, 0.06)",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textDecoration: "none",
                color: ui.colors.primary,
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: ui.colors.secondary, // 黄色の丸ボタン
                  boxShadow: "0 6px 16px rgba(38, 51, 34, 0.16)",
                  transform: "translateY(-30px)",
                }}
              >
                {item.icon}
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              color: isActive ? ui.colors.primary : ui.colors.subText,
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.icon}
          </Link>
        );
      })}
    </nav>
  );
}