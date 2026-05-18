"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../lib/firebase";
import { ui } from "../../lib/ui";
import PageHeader from "../../components/PageHeader";
import Link from "next/link";
import BottomNav from "../../components/BottomNav";

import { AddLogIcon } from "../../components/icons";

type ReadingLog = {
  id: string;
  bookId: string;
  title: string;
  image: string;
  status: string;
  date: string;
  uid: string;
};

type BookOption = {
  id: string;
  title: string;
  image: string;
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

  return {
    ...ui.logs.statusBadgeBase,
    ...ui.logs.statusBadgeUnread,
  };
}
function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStartOfThisWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;

  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);

  return monday;
}

function getStartOfThisMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [books, setBooks] = useState<BookOption[]>([]);
  const [manualBookId, setManualBookId] = useState("");
  const [bookSearchText, setBookSearchText] = useState("");
  const [manualDate, setManualDate] = useState(formatDateInputValue(new Date()));
  const [manualStatus, setManualStatus] = useState("読書中");
  const [addingLog, setAddingLog] = useState(false);

  const [editingLogId, setEditingLogId] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingStatus, setEditingStatus] = useState("読書中");

  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    loadLogs();
    loadBooks();
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

const sortedLogs = [...filteredLogs].sort((a, b) => {
  const dateA = a.date || "";
  const dateB = b.date || "";

  return dateB.localeCompare(dateA);
});

const groupedLogs = sortedLogs.reduce<Record<string, ReadingLog[]>>(
  (groups, log) => {
    if (!groups[log.date]) {
      groups[log.date] = [];
    }

    groups[log.date].push(log);
    return groups;
  },
  {}
);

const groupedLogEntries = Object.entries(groupedLogs);

const filteredBooks = books.filter((book) =>
  book.title
    .toLowerCase()
    .includes(bookSearchText.toLowerCase())
);

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

  async function loadBooks() {
  const user = auth.currentUser;

  if (!user) {
    setBooks([]);
    return;
  }

  const q = query(collection(db, "books"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  const items = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        title: data.title || "タイトルなし",
        image: data.image || "",
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "ja"));

  setBooks(items);
}

  function startEditLog(log: ReadingLog) {
    setEditingLogId(log.id);
    setEditingDate(log.date);
    setEditingStatus(log.status);
  }

  function cancelEditLog() {
    setEditingLogId("");
    setEditingDate("");
    setEditingStatus("読書中");
  }

  async function handleUpdateLog(logId: string) {
    if (!editingDate) {
      alert("日付を選択してください");
      return;
    }

    try {
      await updateDoc(doc(db, "readingLogs", logId), {
        date: editingDate,
        status: editingStatus,
        updatedAt: new Date(),
      });

      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                date: editingDate,
                status: editingStatus,
              }
            : log
        )
      );

      cancelEditLog();
    } catch (error) {
      console.error("読書ログの更新に失敗しました", error);
      alert("読書ログの更新に失敗しました");
    }
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

async function handleAddManualLog() {
  const user = auth.currentUser;

  if (!user) return;

  const selectedBook = books.find((book) => book.id === manualBookId);

  if (!selectedBook) {
    alert("本を選択してください");
    return;
  }

  if (!manualDate) {
    alert("日付を選択してください");
    return;
  }

  try {
    setAddingLog(true);

    const payload = {
      bookId: selectedBook.id,
      title: selectedBook.title,
      image: selectedBook.image,
      status: manualStatus,
      date: manualDate,
      uid: user.uid,
      createdAt: new Date(),
    };

    const logRef = await addDoc(collection(db, "readingLogs"), payload);

    setLogs((currentLogs) => [
      {
        id: logRef.id,
        ...payload,
      },
      ...currentLogs,
    ]);

    setManualBookId("");
    setManualDate(formatDateInputValue(new Date()));
    setManualStatus("読書中");
    setShowManualForm(false);
  } catch (error) {
    console.error("読書ログの追加に失敗しました", error);
    alert("読書ログの追加に失敗しました");
  } finally {
    setAddingLog(false);
  }
}

function clearDateFilter() {
  setStartDate("");
  setEndDate("");
}

function applyTodayFilter() {
  const today = formatDateInputValue(new Date());

  setStartDate(today);
  setEndDate(today);
}

function applyThisWeekFilter() {
  setStartDate(formatDateInputValue(getStartOfThisWeek()));
  setEndDate(formatDateInputValue(new Date()));
}

function applyThisMonthFilter() {
  setStartDate(formatDateInputValue(getStartOfThisMonth()));
  setEndDate(formatDateInputValue(new Date()));
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

      <div style={ui.logs.headerActions}>
  <button
    type="button"
    onClick={() => setShowManualForm((current) => !current)}
    style={ui.logs.iconButton}
    aria-label="ログを追加"
    title="ログを追加"
  >
    <AddLogIcon />
  </button>
</div>

    {showManualForm && (
      <div style={ui.logs.manualForm}>
  <p style={ui.logs.manualTitle}>ログを追加</p>

  <input
  type="text"
  value={bookSearchText}
  onChange={(event) =>
    setBookSearchText(event.target.value)
  }
  placeholder="本を検索"
  style={ui.input.base}
/>

<div style={ui.logs.bookSearchList}>
  {filteredBooks.slice(0, 8).map((book) => (
    <button
      key={book.id}
      type="button"
      onClick={() => {
        setManualBookId(book.id);
        setBookSearchText(book.title);
      }}
      style={{
        ...ui.logs.bookSearchItem,
        ...(manualBookId === book.id
          ? ui.logs.bookSearchItemActive
          : {}),
      }}
    >
      {book.title}
    </button>
  ))}
</div>

  <div style={ui.logs.manualGrid}>
    <input
      type="date"
      value={manualDate}
      onChange={(event) => setManualDate(event.target.value)}
      style={ui.input.base}
    />

    <select
      value={manualStatus}
      onChange={(event) => setManualStatus(event.target.value)}
      style={ui.input.base}
    >
      <option value="未読">未読</option>
      <option value="読書中">読書中</option>
      <option value="読了">読了</option>
    </select>
  </div>

  <button
    type="button"
    onClick={handleAddManualLog}
    disabled={addingLog}
    style={ui.button.primary}
  >
    {addingLog ? "追加中..." : "ログを追加"}
  </button>
</div>
)}

      <div style={ui.logs.filterWrap}>
  <div style={ui.logs.quickFilterRow}>
    <button
      type="button"
      onClick={applyTodayFilter}
      style={ui.logs.quickFilterButton}
    >
      今日
    </button>

    <button
      type="button"
      onClick={applyThisWeekFilter}
      style={ui.logs.quickFilterButton}
    >
      今週
    </button>

    <button
      type="button"
      onClick={applyThisMonthFilter}
      style={ui.logs.quickFilterButton}
    >
      今月
    </button>

    <button
      type="button"
      onClick={clearDateFilter}
      style={ui.logs.quickFilterButton}
    >
      すべて
    </button>
  </div>

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

      {!loading && logs.length > 0 && (
        <div style={ui.logs.countText}>
          {logs.length === filteredLogs.length
            ? `${logs.length}件のログ`
            : `${filteredLogs.length}件 / 全${logs.length}件`}
        </div>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : logs.length === 0 ? (
        <p>ログがありません</p>
      ) : filteredLogs.length === 0 ? (
        <p>条件に一致するログがありません</p>
      ) : (
        <div style={ui.logs.list}>
          {groupedLogEntries.map(([date, dateLogs]) => (
            <section key={date} style={ui.logs.dateGroup}>
              <div style={ui.logs.dateHeading}>{date}</div>

              <div style={ui.logs.dateGroupList}>
                {dateLogs.map((log) => (
                  <div key={log.id} style={ui.logs.item}>
  <Link href={`/books/${log.bookId}`} style={ui.logs.itemLink}>
    <img
      src={log.image || "/no-image.png"}
      alt={log.title}
      style={ui.logs.image}
    />

    <div style={ui.logs.content}>
      <div style={ui.logs.title}>{log.title}</div>

      {editingLogId !== log.id && (
        <div style={getStatusBadgeStyle(log.status)}>
          {log.status}
        </div>
      )}
    </div>
  </Link>

  {editingLogId === log.id ? (
    <div style={ui.logs.editPanel}>
      <div style={ui.logs.editFields}>
        <input
          type="date"
          value={editingDate}
          onChange={(event) => setEditingDate(event.target.value)}
          style={ui.logs.editInput}
        />

        <select
          value={editingStatus}
          onChange={(event) => setEditingStatus(event.target.value)}
          style={ui.logs.editInput}
        >
          <option value="未読">未読</option>
          <option value="読書中">読書中</option>
          <option value="読了">読了</option>
        </select>
      </div>

      <div style={ui.logs.actionButtons}>
        <button
          type="button"
          onClick={() => handleUpdateLog(log.id)}
          style={ui.logs.smallActionButton}
        >
          保存
        </button>

        <button
          type="button"
          onClick={cancelEditLog}
          style={ui.logs.smallMutedButton}
        >
          やめる
        </button>
      </div>
    </div>
  ) : (
    <div style={ui.logs.actionButtons}>
      <button
        type="button"
        onClick={() => startEditLog(log)}
        style={ui.logs.smallActionButton}
      >
        編集
      </button>

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
  )}
</div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>

    <BottomNav />
  </main>
);
}