"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ui } from "../../lib/ui";
import PageHeader from "../../components/PageHeader";
import BottomNav from "../../components/BottomNav";

type Book = {
  id: string;
  status: string;
  shelf?: string;
};

type ReadingLog = {
  id: string;
  status: string;
  date: string;
};

function getThisMonthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

function getThisYearPrefix() {
  return new Date().toISOString().slice(0, 4);
}

function getLastMonthPrefix() {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  return lastMonth.toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const booksQuery = query(
      collection(db, "books"),
      where("uid", "==", user.uid)
    );

    const logsQuery = query(
      collection(db, "readingLogs"),
      where("uid", "==", user.uid)
    );

    const [booksSnapshot, logsSnapshot] = await Promise.all([
      getDocs(booksQuery),
      getDocs(logsQuery),
    ]);

    setBooks(
      booksSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Book, "id">),
      }))
    );

    setLogs(
      logsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ReadingLog, "id">),
      }))
    );

    setLoading(false);
  }

  const totalBooks = books.length;
  const finishedBooks = books.filter((book) => book.status === "読了").length;
  const readingBooks = books.filter((book) => book.status === "読書中").length;
  const unreadBooks = books.filter((book) => book.status === "未読").length;
  const pausedBooks = books.filter((book) => book.status === "中断").length;

  const thisMonth = getThisMonthPrefix();
  const currentYear = getThisYearPrefix();
  const selectedYearText = String(selectedYear);
  const lastMonth = getLastMonthPrefix();

  const thisMonthFinishedLogs = logs.filter(
    (log) => log.status === "読了" && log.date.startsWith(thisMonth)
  ).length;

  const thisYearFinishedLogs = logs.filter(
    (log) => log.status === "読了" && log.date.startsWith(currentYear)
  ).length;

  const lastMonthFinishedLogs = logs.filter(
    (log) => log.status === "読了" && log.date.startsWith(lastMonth)
  ).length;

  const monthlyFinishedCounts = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const monthKey = `${selectedYearText}-${month}`;

    const count = logs.filter(
      (log) => log.status === "読了" && log.date.startsWith(monthKey)
    ).length;

    return {
      month: `${index + 1}月`,
      count,
    };
  });

  const actualMaxMonthlyFinishedCount = Math.max(
    ...monthlyFinishedCounts.map((item) => item.count),
    0
  );

  const maxMonthlyFinishedCount =
    actualMaxMonthlyFinishedCount <= 20
      ? 20
      : Math.ceil((actualMaxMonthlyFinishedCount + 1) / 5) * 5;

  const yearOptions = Array.from({ length: 5 }, (_, index) => {
    return new Date().getFullYear() - index;
  });

  const shelfCounts = Object.entries(
    books.reduce<Record<string, number>>((counts, book) => {
      const shelfName = book.shelf?.trim() || "未設定";
      counts[shelfName] = (counts[shelfName] || 0) + 1;
      return counts;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <main
      style={{
        ...ui.layout.page,
        paddingBottom: "96px",
      }}
    >
      <div style={ui.dashboard.pageWrap}>
        <PageHeader title="ダッシュボード" backHref="/" />

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            <div style={ui.dashboard.grid}>
              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>本棚総数</div>
                <div style={ui.dashboard.value}>{totalBooks}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>読了冊数</div>
                <div style={ui.dashboard.value}>{finishedBooks}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>読書中</div>
                <div style={ui.dashboard.value}>{readingBooks}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>今月の読了ログ</div>
                <div style={ui.dashboard.value}>{thisMonthFinishedLogs}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>今年の読了ログ</div>
                <div style={ui.dashboard.value}>{thisYearFinishedLogs}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>先月の読了ログ</div>
                <div style={ui.dashboard.value}>{lastMonthFinishedLogs}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>未読冊数</div>
                <div style={ui.dashboard.value}>{unreadBooks}</div>
              </div>

              <div style={ui.dashboard.card}>
                <div style={ui.dashboard.label}>中断冊数</div>
                <div style={ui.dashboard.value}>{pausedBooks}</div>
              </div>
            </div>

            <div style={ui.dashboard.sectionCard}>
              <div style={ui.dashboard.sectionHeader}>
                <div style={ui.dashboard.sectionTitle}>
                  {selectedYear}年 月別読了ログ
                </div>

                <select
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(Number(event.target.value))
                  }
                  style={ui.dashboard.yearSelect}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>

              <div style={ui.dashboard.monthlyChart}>
                {monthlyFinishedCounts.map((item) => (
                  <div key={item.month} style={ui.dashboard.monthlyRow}>
                    <div style={ui.dashboard.monthLabel}>{item.month}</div>

                    <div style={ui.dashboard.barTrack}>
                      <div
                        style={{
                          ...ui.dashboard.barFill,
                          width: `${
                            (item.count / maxMonthlyFinishedCount) * 100
                          }%`,
                        }}
                      />
                    </div>

                    <div style={ui.dashboard.monthCount}>{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={ui.dashboard.sectionCard}>
              <div style={ui.dashboard.sectionTitle}>棚ごとの冊数</div>

              {shelfCounts.length === 0 ? (
                <p style={ui.dashboard.emptyText}>登録された本がありません</p>
              ) : (
                <div style={ui.dashboard.rankList}>
                  {shelfCounts.map(([shelfName, count]) => (
                    <div key={shelfName} style={ui.dashboard.rankItem}>
                      <div style={ui.dashboard.rankName}>{shelfName}</div>
                      <div style={ui.dashboard.rankCount}>{count}冊</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}