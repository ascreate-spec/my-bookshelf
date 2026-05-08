"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../../lib/firebase";
import { ui } from "../../lib/ui";
import PageHeader from "../../components/PageHeader";
import Link from "next/link";

type ReadingLog = {
  id: string;
  bookId: string;
  title: string;
  image: string;
  status: string;
  date: string;
  uid: string;
};

function getStatusBadgeStyle(status: string) {
  if (status === "未読") {
    return {
      ...ui.logs.statusBadgeBase,
      ...ui.logs.statusBadgeUnread,
    };
  }

  if (status === "読書中") {
    return {
      ...ui.logs.statusBadgeBase,
      ...ui.logs.statusBadgeReading,
    };
  }

  if (status === "読了") {
    return {
      ...ui.logs.statusBadgeBase,
      ...ui.logs.statusBadgeFinished,
    };
  }

  if (status === "中断") {
    return {
      ...ui.logs.statusBadgeBase,
      ...ui.logs.statusBadgePaused,
    };
  }

  return {
    ...ui.logs.statusBadgeBase,
    ...ui.logs.statusBadgeUnread,
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
  if (startDate && log.date < startDate) {
    return false;
  }

  if (endDate && log.date > endDate) {
    return false;
  }

  return true;
});

  async function loadLogs() {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "readingLogs"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ReadingLog, "id">),
    }));

    setLogs(items);
    setLoading(false);
  }

  async function handleDeleteLog(logId: string) {
  const ok = window.confirm("このログを削除しますか？");

  if (!ok) return;

  try {
    await deleteDoc(doc(db, "readingLogs", logId));

    setLogs((currentLogs) =>
      currentLogs.filter((log) => log.id !== logId)
    );
  } catch (error) {
    console.error("読書ログの削除に失敗しました", error);
    alert("読書ログの削除に失敗しました");
  }
}

function clearDateFilter() {
  setStartDate("");
  setEndDate("");
}

  return (
  <main
    style={{
      ...ui.layout.page,
      paddingBottom: "96px",
    }}
  >
    <div style={ui.logs.pageWrap}>
      <PageHeader title="読書ログ" backHref="/" />

      <div style={ui.logs.filterWrap}>
  <div style={ui.logs.filterRow}>
    <label style={ui.logs.filterLabel}>
      開始日
      <input
        type="date"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        style={ui.logs.dateInput}
      />
    </label>

    <label style={ui.logs.filterLabel}>
      終了日
      <input
        type="date"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        style={ui.logs.dateInput}
      />
    </label>

    <button
      type="button"
      onClick={clearDateFilter}
      style={ui.logs.clearButton}
    >
      クリア
    </button>
  </div>
</div>

      {loading ? (
        <p>読み込み中...</p>
      ) : logs.length === 0 ? (
  <p>ログがありません</p>
) : filteredLogs.length === 0 ? (
  <p>条件に一致するログがありません</p>
) : (
  <div style={ui.logs.list}>
    {filteredLogs.map((log) => (

  <div key={log.id} style={ui.logs.item}>
    <Link
      href={`/books/${log.bookId}`}
      style={ui.logs.itemLink}
    >
      <img
        src={log.image || "/no-image.png"}
        alt={log.title}
        style={ui.logs.image}
      />

      <div style={ui.logs.content}>
        <div style={ui.logs.title}>{log.title}</div>

        <div style={ui.logs.meta}>{log.date}</div>

        <div style={getStatusBadgeStyle(log.status)}>{log.status}</div>
      </div>
    </Link>

    <button
      type="button"
      onClick={() => handleDeleteLog(log.id)}
      style={ui.logs.deleteButton}
      aria-label="ログを削除"
      title="ログを削除"
    >
      削除
    </button>
  </div>
))}
        </div>
      )}
      </div>
    </main>
  );
}