"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui } from "../lib/ui";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "ホーム", icon: "🏠" },
    { href: "/add", label: "追加", icon: "➕" },
    { href: "/manage", label: "管理", icon: "⚙️" },
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
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
        zIndex: 1000,
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.06)",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              color: isActive ? ui.colors.text : ui.colors.subText,
              padding: "6px 0",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                lineHeight: 1,
                marginBottom: "4px",
              }}
            >
              {item.icon}
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}