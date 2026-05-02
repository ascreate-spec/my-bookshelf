"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ui } from "../../lib/ui";
import BottomNav from "../../components/BottomNav";
import PageHeader from "../../components/PageHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { isAllowedEmail } from "../../lib/authGuard";

export default function ManagePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (authLoading) {
    return (
      <main style={ui.layout.page}>
        <p style={ui.text.helper}>認証確認中...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={ui.layout.page}>
        <div style={ui.managePage.authBox}>
          <p style={ui.text.helper}>ログインしてください</p>
        </div>
      </main>
    );
  }

  if (!isAllowedEmail(user.email)) {
    return (
      <main
        style={{
          ...ui.layout.page,
          paddingBottom: "96px",
        }}
      >
        <div style={ui.managePage.authBox}>
          <p>このアカウントでは利用できません</p>

          <button
  onClick={handleLogout}
  style={{
    ...ui.button.muted,
    ...ui.managePage.menuItem,
  }}
  className="manageMenuButton"
>
            ログアウト
          </button>
        </div>

        <style jsx>{`
          .manageMenuButton {
            transition: filter 0.15s ease, transform 0.15s ease;
          }

          .manageMenuButton:hover {
            filter: brightness(0.97);
            transform: translateY(-1px);
          }
        `}</style>
      </main>
    );
  }

  return (
    <main
      style={{
        ...ui.layout.page,
        paddingBottom: "96px",
      }}
    >
      <div style={ui.managePage.pageWrap}>
        <PageHeader title="管理" />

        <p style={{ ...ui.text.helper, ...ui.managePage.description }}>
          各種設定・データ管理はこちら
        </p>

        <div style={ui.managePage.menuGrid}>

          <Link
  href="/tags"
  style={{
    ...ui.button.secondary,
    ...ui.managePage.menuItem,
  }}
  className="manageMenuLink"
>
            タグ設定
          </Link>

          <Link
            href="/shelves"
            style={{
    ...ui.button.secondary,
    ...ui.managePage.menuItem,
  }}
  className="manageMenuLink"
>
            棚設定
          </Link>

          <Link
            href="/data"
            style={{
    ...ui.button.secondary,
    ...ui.managePage.menuItem,
  }}
  className="manageMenuLink"
>
            データ管理
          </Link>

          <button
  onClick={handleLogout}
  style={{
    ...ui.button.muted,
    ...ui.managePage.menuItem,
  }}
  className="manageMenuButton"
>
            ログアウト
          </button>
        </div>
      </div>

      <BottomNav />

      <style jsx>{`
  .manageMenuLink:hover,
  .manageMenuButton:hover {
    filter: brightness(0.97);
    transform: translateY(-1px);
  }
`}</style>
    </main>
  );
}