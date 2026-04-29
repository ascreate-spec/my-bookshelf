"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { db, auth } from "../../lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "@/lib/ui";
import { isAllowedEmail } from "../../lib/authGuard";
import { signOut } from "firebase/auth";
import PageHeader from "../../components/PageHeader";
import BottomNav from "../../components/BottomNav";

type CsvBookRow = {
  title?: string;
  isbn?: string;
  publisher?: string;
  author?: string;
  shelf?: string;
  status?: string;
  finishedDate?: string;
  memo?: string;
  tags?: string;
  owned?: string | boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ImportedBookRow = {
  title: string;
  isbn: string;
  publisher: string;
  author: string;
  shelf: string;
  status: string;
  finishedDate: string;
  memo: string;
  tags: string[];
  owned: boolean;
  createdAt: string;
  updatedAt: string;
  isDuplicate?: boolean;
};

type SavedBook = {
  id: string;
  title: string;
  isbn?: string;
  publisher?: string;
  author?: string;
  shelf?: string;
  status?: string;
  finishedDate?: string;
  memo?: string;
  tags?: string[];
  owned?: boolean;
  uid?: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function DataPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [replaceMode, setReplaceMode] = useState(false);

  const [importSummary, setImportSummary] = useState<{
  imported: string[];
  skipped: string[];
  errors: string[];
} | null>(null);

  const [previewRows, setPreviewRows] = useState<ImportedBookRow[]>([]);
  const [previewFileName, setPreviewFileName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [skipDuplicatesOnly, setSkipDuplicatesOnly] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const parseBool = (value: unknown) => {
    if (typeof value === "boolean") return value;
    const text = String(value ?? "").trim().toLowerCase();
    return text === "true" || text === "1" || text === "yes" || text === "所持";
  };

  const formatDateString = (value: any) => {
    if (!value) return "";
    try {
      if (value?.toDate) {
        return value.toDate().toISOString();
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString();
    } catch {
      return "";
    }
  };

  const exportCsv = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setMessage("");

      const q = query(
        collection(db, "books"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const rows: CsvBookRow[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as SavedBook;

        return {
          title: data.title || "",
          isbn: data.isbn || "",
          publisher: data.publisher || "",
          author: data.author || "",
          shelf: data.shelf || "未分類",
          status: data.status || "未読",
          finishedDate: data.finishedDate || "",
          memo: data.memo || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          owned: data.owned ? "true" : "false",
          createdAt: formatDateString(data.createdAt),
          updatedAt: formatDateString(data.updatedAt),
        };
      });

      const csv = Papa.unparse(rows, {
        columns: [
          "title",
          "isbn",
          "publisher",
          "author",
          "shelf",
          "status",
          "finishedDate",
          "memo",
          "tags",
          "owned",
          "createdAt",
          "updatedAt",
        ],
      });

      const bom = "\uFEFF";
      const blob = new Blob([bom + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `my-bookshelf-export-${today}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage("CSVをエクスポートしました");
    } catch (error) {
      console.error(error);
      setMessage("CSVエクスポートに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplateCsv = () => {
  const templateRows = [
    {
      title: "サンプル本",
      isbn: "9781234567890",
      publisher: "サンプル出版社",
      author: "著者A, 著者B",
      shelf: "未分類",
      status: "未読",
      finishedDate: "",
      memo: "メモを書けます",
      tags: "小説, お気に入り",
      owned: "true",
      createdAt: "",
      updatedAt: "",
    },
  ];

  const csv = Papa.unparse(templateRows, {
    columns: [
      "title",
      "isbn",
      "publisher",
      "author",
      "shelf",
      "status",
      "finishedDate",
      "memo",
      "tags",
      "owned",
      "createdAt",
      "updatedAt",
    ],
  });

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "my-bookshelf-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  const ensureShelvesExist = async (uid: string, shelfNames: string[]) => {
  const normalizedShelves = Array.from(
    new Set(
      shelfNames
        .map((name) => name.trim())
        .filter((name) => name !== "")
    )
  );

  if (normalizedShelves.length === 0) return;

  const q = query(
    collection(db, "shelves"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);

  const existingShelves = snapshot.docs.map((docSnap) =>
    String(docSnap.data().name || "").trim().toLowerCase()
  );

  const missingShelves = normalizedShelves.filter(
    (name) => !existingShelves.includes(name.toLowerCase())
  );

  const currentCount = snapshot.docs.length;

  await Promise.all(
    missingShelves.map((name, index) =>
      addDoc(collection(db, "shelves"), {
        name,
        uid,
        order: currentCount + index,
        createdAt: new Date(),
      })
    )
  );
};

const ensureTagsExist = async (uid: string, tagNames: string[]) => {
  const normalizedTags = Array.from(
    new Set(
      tagNames
        .map((name) => name.trim())
        .filter((name) => name !== "")
    )
  );

  if (normalizedTags.length === 0) return;

  const q = query(
    collection(db, "tags"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);

  const existingTags = snapshot.docs.map((docSnap) =>
    String(docSnap.data().name || "").trim().toLowerCase()
  );

  const missingTags = normalizedTags.filter(
    (name) => !existingTags.includes(name.toLowerCase())
  );

  await Promise.all(
    missingTags.map((name) =>
      addDoc(collection(db, "tags"), {
        name,
        uid,
        createdAt: new Date(),
      })
    )
  );
};

  const prepareImportCsv = async (file: File) => {
  if (!user) return;

  try {
    setLoading(true);
    setMessage("");
    setImportSummary(null);
    setShowPreview(false);

    const text = await file.text();

    const parsed = Papa.parse<CsvBookRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error(parsed.errors);
      setMessage("CSVの読み込みに失敗しました");
      setLoading(false);
      return;
    }

    const existingBooksSnapshot = await getDocs(
  query(collection(db, "books"), where("uid", "==", user.uid))
);

const existingKeys = new Set(
  existingBooksSnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return `${String(data.title ?? "").trim()}__${String(data.isbn ?? "").trim()}`.toLowerCase();
  })
);

    const rows: ImportedBookRow[] = parsed.data
  .map((row: CsvBookRow) => {
    const title = String(row.title ?? "").trim();
    const isbn = String(row.isbn ?? "").trim();
    const key = `${title}__${isbn}`.toLowerCase();

    return {
      title,
      isbn,
      publisher: String(row.publisher ?? "").trim(),
      author: String(row.author ?? "").trim(),
      shelf: String(row.shelf ?? "").trim() || "未分類",
      status: String(row.status ?? "").trim() || "未読",
      finishedDate: String(row.finishedDate ?? "").trim(),
      memo: String(row.memo ?? "").trim(),
      tags: String(row.tags ?? "")
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag !== ""),
      owned: parseBool(row.owned),
      createdAt: String(row.createdAt ?? "").trim(),
      updatedAt: String(row.updatedAt ?? "").trim(),
      isDuplicate: existingKeys.has(key),
    };
  })
  .filter((row: ImportedBookRow) => row.title !== "");

    if (rows.length === 0) {
      setMessage("取り込めるデータがありませんでした");
      setLoading(false);
      return;
    }

    setPreviewRows(rows);
    setPreviewFileName(file.name);
    setShowPreview(true);
    setMessage(`プレビューを表示しています（${rows.length}件）`);
  } catch (error) {
    console.error(error);
    setMessage("CSVの読み込みに失敗しました");
  } finally {
    setLoading(false);
  }
};

const executeImportCsv = async () => {
  if (!user) return;

  try {
    setLoading(true);
    setMessage("");
    setImportSummary(null);

    const rows = skipDuplicatesOnly
  ? previewRows.filter((row) => !row.isDuplicate)
  : previewRows;

    if (rows.length === 0) {
      setMessage("取り込めるデータがありませんでした");
      setLoading(false);
      return;
    }

    const csvShelves = rows.map((row: ImportedBookRow) => row.shelf);
    const csvTags = rows.flatMap((row: ImportedBookRow) => row.tags);

    await ensureShelvesExist(user.uid, csvShelves);
    await ensureTagsExist(user.uid, csvTags);

    const existingBooksSnapshot = await getDocs(
      query(collection(db, "books"), where("uid", "==", user.uid))
    );

    const existingKeys = new Set(
      existingBooksSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return `${String(data.title ?? "").trim()}__${String(data.isbn ?? "").trim()}`.toLowerCase();
      })
    );

    let importedCount = 0;
    let skippedCount = 0;

    const importedTitles: string[] = [];
    const skippedTitles: string[] = [];
    const errorMessages: string[] = [];

    for (const row of rows) {
      const key = `${row.title}__${row.isbn}`.toLowerCase();

      if (!replaceMode && existingKeys.has(key)) {
        skippedCount += 1;
        skippedTitles.push(row.title || "(タイトルなし)");
        continue;
      }

      try {
        await addDoc(collection(db, "books"), {
          title: row.title,
          isbn: row.isbn,
          publisher: row.publisher,
          author: row.author,
          authors: row.author
            ? row.author
                .split(",")
                .map((name: string) => name.trim())
                .filter((name: string) => name !== "")
            : [],
          image: "",
          shelf: row.shelf,
          status: row.status,
          finishedDate: row.finishedDate,
          memo: row.memo,
          tags: row.tags,
          owned: row.owned,
          uid: user.uid,
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        });

        importedCount += 1;
        importedTitles.push(row.title || "(タイトルなし)");
        existingKeys.add(key);
      } catch (error) {
        console.error(error);
        errorMessages.push(`${row.title || "(タイトルなし)"} の取り込みに失敗しました`);
      }
    }

    setMessage(
      `CSVを取り込みました。追加: ${importedCount}件 / スキップ: ${skippedCount}件`
    );

    setImportSummary({
      imported: importedTitles,
      skipped: skippedTitles,
      errors: errorMessages,
    });

    setShowPreview(false);
    setPreviewRows([]);
    setPreviewFileName("");
  } catch (error) {
    console.error(error);
    setMessage("CSVインポートに失敗しました");
  } finally {
    setLoading(false);
  }
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
        <p style={ui.text.helper}>ログインしてください</p>
      </main>
    );
  }

  if (!isAllowedEmail(user.email)) {
  return (
    <main style={ui.layout.page}>
      <div style={{ maxWidth: "400px", margin: "100px auto" }}>
        <p>このアカウントでは利用できません</p>

        <button
          style={ui.button.muted}
          onClick={async () => await signOut(auth)}
        >
          ログアウト
        </button>
      </div>
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
      <style jsx>{`
        .pageWrap {
          max-width: 760px;
          margin: 0 auto;
        }

        .card {
          background: ${ui.colors.cardBg};
          border: 1px solid ${ui.colors.border};
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .sectionTitle {
          margin-top: 0;
          margin-bottom: 8px;
          color: ${ui.colors.text};
          font-size: 22px;
        }

        .helper {
          margin: 0 0 16px 0;
          color: ${ui.colors.subText};
          line-height: 1.6;
        }

        .buttonRow {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .checkRow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          color: ${ui.colors.text};
        }

        @media (max-width: 768px) {
          .buttonRow > * {
            width: 100%;
          }
        }
      `}</style>

      <div className="pageWrap">
        
        <PageHeader title="データ管理" backHref="/" />
        <p style={ui.layout.sectionDescription}>
          本データをCSVでエクスポート・インポートできます
        </p>

        <div className="buttonRow">
  <button
    type="button"
    onClick={exportCsv}
    disabled={loading}
    style={ui.button.primary}
  >
    {loading ? "処理中..." : "CSVをエクスポート"}
  </button>

  <button
    type="button"
    onClick={downloadTemplateCsv}
    disabled={loading}
    style={ui.button.secondary}
  >
    テンプレートをダウンロード
  </button>
</div>

        <div className="card">
          <h2 className="sectionTitle">CSVインポート</h2>
          <p className="helper">
            CSVファイルから本データを取り込みます。同じタイトル＋ISBNの本は通常スキップします
          </p>

          <div className="buttonRow">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
  const file = e.target.files?.[0];
  if (file) {
    prepareImportCsv(file);
    e.currentTarget.value = "";
  }
}}
              style={ui.input.base}
              disabled={loading}
            />
          </div>

          <label className="checkRow">
            <input
              type="checkbox"
              checked={replaceMode}
              onChange={(e) => setReplaceMode(e.target.checked)}
            />
            重複チェックをゆるくする
          </label>
        </div>

        {message && (
          <p style={{ ...ui.text.helper, marginTop: "12px" }}>{message}</p>
        )}

        {importSummary && (
  <div className="card" style={{ marginTop: "16px" }}>
    <h2 className="sectionTitle">インポート結果</h2>

    {importSummary.imported.length > 0 && (
      <div style={{ marginBottom: "12px" }}>
        <p style={{ ...ui.text.helper, fontWeight: "bold" }}>
          追加された本
        </p>
        <div style={{ color: ui.colors.text, lineHeight: 1.7 }}>
          {importSummary.imported.map((title, index) => (
            <div key={`${title}-${index}`}>・{title}</div>
          ))}
        </div>
      </div>
    )}

    {importSummary.skipped.length > 0 && (
      <div style={{ marginBottom: "12px" }}>
        <p style={{ ...ui.text.helper, fontWeight: "bold" }}>
          スキップされた本
        </p>
        <div style={{ color: ui.colors.text, lineHeight: 1.7 }}>
          {importSummary.skipped.map((title, index) => (
            <div key={`${title}-${index}`}>・{title}</div>
          ))}
        </div>
      </div>
    )}

    {importSummary.errors.length > 0 && (
      <div>
        <p style={{ ...ui.text.helper, fontWeight: "bold", color: "#c62828" }}>
          エラー
        </p>
        <div style={{ color: "#c62828", lineHeight: 1.7 }}>
          {importSummary.errors.map((text, index) => (
            <div key={`${text}-${index}`}>・{text}</div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

{importSummary && (
  <div className="card" style={{ marginTop: "16px" }}>
    <h2 className="sectionTitle">インポート結果</h2>

    {importSummary.imported.length > 0 && (
      <div style={{ marginBottom: "12px" }}>
        <p style={{ ...ui.text.helper, fontWeight: "bold" }}>
          追加された本
        </p>
        <div style={{ color: ui.colors.text, lineHeight: 1.7 }}>
          {importSummary.imported.map((title, index) => (
            <div key={`${title}-${index}`}>・{title}</div>
          ))}
        </div>
      </div>
    )}

    {importSummary.skipped.length > 0 && (
      <div style={{ marginBottom: "12px" }}>
        <p style={{ ...ui.text.helper, fontWeight: "bold" }}>
          スキップされた本
        </p>
        <div style={{ color: ui.colors.text, lineHeight: 1.7 }}>
          {importSummary.skipped.map((title, index) => (
            <div key={`${title}-${index}`}>・{title}</div>
          ))}
        </div>
      </div>
    )}

    {importSummary.errors.length > 0 && (
      <div>
        <p style={{ ...ui.text.helper, fontWeight: "bold", color: "#c62828" }}>
          エラー
        </p>
        <div style={{ color: "#c62828", lineHeight: 1.7 }}>
          {importSummary.errors.map((text, index) => (
            <div key={`${text}-${index}`}>・{text}</div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

{showPreview && (
  <div className="card">
    <h2 className="sectionTitle">インポート前プレビュー</h2>
    <p className="helper">
  ファイル名: {previewFileName} / {previewRows.length}件
  <br />
  取り込み対象: {
    skipDuplicatesOnly
      ? previewRows.filter((row) => !row.isDuplicate).length
      : previewRows.length
  }件
</p>

<label
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    color: ui.colors.text,
  }}
>
  <input
    type="checkbox"
    checked={skipDuplicatesOnly}
    onChange={(e) => setSkipDuplicatesOnly(e.target.checked)}
  />
  重複を除外して取り込む
</label>

    <div
      style={{
        border: `1px solid ${ui.colors.border}`,
        borderRadius: "10px",
        overflow: "hidden",
        maxHeight: "360px",
        overflowY: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
  <tr style={{ background: ui.colors.cardBg }}>
    <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${ui.colors.border}` }}>タイトル</th>
    <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${ui.colors.border}` }}>棚</th>
    <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${ui.colors.border}` }}>所持</th>
    <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${ui.colors.border}` }}>状態</th>
  </tr>
</thead>
        <tbody>
  {previewRows.map((row, index) => (
    <tr
      key={`${row.title}-${index}`}
      style={{
        background: row.isDuplicate ? "#FFF8E1" : "transparent",
      }}
    >
      <td style={{ padding: "10px", borderBottom: `1px solid ${ui.colors.borderSoft}` }}>
        {row.title}
      </td>
      <td style={{ padding: "10px", borderBottom: `1px solid ${ui.colors.borderSoft}` }}>
        {row.shelf}
      </td>
      <td style={{ padding: "10px", borderBottom: `1px solid ${ui.colors.borderSoft}` }}>
        {row.owned ? "所持" : "未所持"}
      </td>
      <td style={{ padding: "10px", borderBottom: `1px solid ${ui.colors.borderSoft}` }}>
        {row.isDuplicate ? "重複" : "新規"}
      </td>
    </tr>
  ))}
</tbody>
      </table>
    </div>

    <div className="buttonRow" style={{ marginTop: "16px" }}>
      <button
        type="button"
        onClick={executeImportCsv}
        disabled={loading}
        style={ui.button.primary}
      >
        {loading
  ? "取り込み中..."
  : skipDuplicatesOnly
  ? "重複を除外して取り込む"
  : "この内容で取り込む"}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowPreview(false);
          setPreviewRows([]);
          setPreviewFileName("");
          setMessage("インポートをキャンセルしました");
        }}
        disabled={loading}
        style={ui.button.secondary}
      >
        キャンセル
      </button>
    </div>
  </div>
)}

      </div>
      <BottomNav />
    </main>
  );
}