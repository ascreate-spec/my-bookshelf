"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui } from "../lib/ui";
import {
  AddIcon,
  BookshelfIcon,
  DashboardIcon,
  LogIcon,
  SettingsIcon,
} from "./icons";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "本棚", icon: <BookshelfIcon size={28} />, isCenter: false },
    { href: "/logs", label: "ログ", icon: <LogIcon size={25} />, isCenter: false },
    { href: "/add", label: "追加", icon: <AddIcon />, isCenter: true },
    { href: "/dashboard", label: "統計", icon: <DashboardIcon size={25} />, isCenter: false },
    { href: "/manage", label: "管理", icon: <SettingsIcon size={25} />, isCenter: false },
  ];

  return (
    <nav style={ui.bottomNav.nav}>
      {items.map((item) => {
        const isActive = pathname === item.href;

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              style={ui.bottomNav.centerLink}
            >
              <div style={ui.bottomNav.centerButton}>{item.icon}</div>
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
              ...ui.bottomNav.link,
              color: isActive
                ? ui.bottomNav.activeColor
                : ui.bottomNav.inactiveColor,
            }}
          >
            {item.icon}
          </Link>
        );
      })}
    </nav>
  );
}