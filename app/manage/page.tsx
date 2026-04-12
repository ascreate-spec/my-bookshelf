"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "../../lib/ui";
import BottomNav from "../../components/BottomNav";
import { useRouter } from "next/navigation";

export default function ManagePage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <main
      style={{
        ...ui.layout.page,
        paddingBottom: "96px", // ← 下ナビの分
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={ui.layout.sectionTitle}>⚙️ 管理</h1>

        <p style={{ ...ui.text.helper, marginBottom: "20px" }}>
          各種設定・データ管理はこちら
        </p>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <Link
            href="/tags"
            style={ui.button.secondary}
            onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonSecondary)}
            onMouseLeave={clearHoverStyle}
          >
            タグを編集
          </Link>

          <Link
            href="/shelves"
            style={ui.button.secondary}
            onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonSecondary)}
            onMouseLeave={clearHoverStyle}
          >
            棚を編集
          </Link>

          <Link
            href="/data"
            style={ui.button.secondary}
            onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonSecondary)}
            onMouseLeave={clearHoverStyle}
          >
            データ管理
          </Link>

          <button
            onClick={handleLogout}
            style={ui.button.muted}
            onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
            onMouseLeave={clearHoverStyle}
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 下部ナビ */}
      <BottomNav />
    </main>
  );
}