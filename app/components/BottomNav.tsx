"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui } from "@/lib/ui";

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
        bottom: 0,
        left: 0,
        right: 0,
        background: ui.colors.cardBg,
        borderTop: `1px solid ${ui.colors.border}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
        zIndex: 100,
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              color: active ? ui.colors.text : ui.colors.subText,
              fontWeight: active ? 700 : 500,
              fontSize: "12px",
              padding: "6px 0",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "2px" }}>
              {item.icon}
            </div>
            <div>{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );
}