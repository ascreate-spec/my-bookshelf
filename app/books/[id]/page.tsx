"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../lib/firebase";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "../../../lib/ui";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

type SavedBook = {
  id: string;
  title: string;
  isbn: string;
  publisher?: string;
  author?: string;
  authors?: string[];
  image?: string;
  shelf?: string;
  status?: string;
  finishedDate?: string;
  memo?: string;
  tags?: string[];
  owned?: boolean;
};

type Shelf = {
  id: string;
  name: string;
  order?: number;
};

type EditForm = {
  title: string;
  isbn: string;
  publisher: string;
  author: string;
  shelf: string;
  status: string;
  finishedDate: string;
  memo: string;
  tagsText: string;
  owned: boolean;
};

export default function BookEditPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const defaultShelves = [
    "未分類",
    "絵本",
    "図鑑",
    "実用",
    "子育て",
    "学習 / 参考書",
    "資格",
    "アプリ / 言語 / ツール",
    "ビジネス",
    "自己啓発",
    "小説",
    "世界情勢 / 国際",
  ];

  const normalizeShelfName = (shelf: string | undefined | null) => {
    const trimmed = (shelf || "").trim();
    return trimmed ? trimmed : "未分類";
  };

  const getShelfSortOrder = (name: string, order?: number) => {
    if (name === "未分類") return -1;
    if (typeof order === "number") return order;

    const defaultIndex = defaultShelves.indexOf(name);
    if (defaultIndex >= 0) return defaultIndex;

    return 9999;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const [book, setBook] = useState<SavedBook | null>(null);
  const [shelfList, setShelfList] = useState<string[]>(defaultShelves);

  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    isbn: "",
    publisher: "",
    author: "",
    shelf: "未分類",
    status: "未読",
    finishedDate: "",
    memo: "",
    tagsText: "",
    owned: false,
  });

  useEffect(() => {
    const fetchBook = async () => {
      const bookRef = doc(db, "books", bookId);
      const snapshot = await getDoc(bookRef);

      if (!snapshot.exists()) {
        alert("本が見つかりませんでした");
        router.push("/");
        return null;
      }

      const data = snapshot.data();

      const fetchedBook: SavedBook = {
        id: snapshot.id,
        title: data.title || "タイトルなし",
        isbn: data.isbn || "",
        publisher: data.publisher || "",
        author: data.author || "",
        authors: Array.isArray(data.authors) ? data.authors : [],
        image: data.image || "",
        shelf: normalizeShelfName(data.shelf),
        status: data.status || "未読",
        finishedDate: data.finishedDate || "",
        memo: data.memo || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        owned: data.owned ?? false,
      };

      setBook(fetchedBook);

      setEditForm({
        title: fetchedBook.title || "",
        isbn: fetchedBook.isbn || "",
        publisher: fetchedBook.publisher || "",
        author: fetchedBook.author || "",
        shelf: normalizeShelfName(fetchedBook.shelf),
        owned: fetchedBook.owned ?? false,
        status: fetchedBook.status || "未読",
        finishedDate: fetchedBook.finishedDate || "",
        memo: fetchedBook.memo || "",
        tagsText: Array.isArray(fetchedBook.tags)
          ? fetchedBook.tags.join(", ")
          : "",
      });

      return fetchedBook;
    };

    const fetchShelves = async (fetchedBook?: SavedBook | null) => {
      const querySnapshot = await getDocs(collection(db, "shelves"));
      const fetchedShelves: Shelf[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: (doc.data().name || "").trim(),
        order:
          typeof doc.data().order === "number" ? doc.data().order : undefined,
      }));

      const dbShelves = fetchedShelves.filter((shelf) => shelf.name !== "");

      const mergedShelfNames = Array.from(
        new Set([
          ...defaultShelves,
          ...dbShelves.map((shelf) => shelf.name),
          fetchedBook ? normalizeShelfName(fetchedBook.shelf) : "未分類",
        ])
      );

      const normalizedShelves = mergedShelfNames.map((name, index) => {
        const existing = dbShelves.find((shelf) => shelf.name === name);

        return {
          name,
          order: existing?.order ?? index,
        };
      });

      const sortedShelves = normalizedShelves
        .sort((a, b) => {
          const aOrder = getShelfSortOrder(a.name, a.order);
          const bOrder = getShelfSortOrder(b.name, b.order);

          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }

          return a.name.localeCompare(b.name, "ja");
        })
        .map((shelf) => shelf.name);

      const finalShelfList = [
        "未分類",
        ...sortedShelves.filter((name) => name !== "未分類"),
      ];

      setShelfList(finalShelfList);
    };

    const fetchAll = async () => {
      try {
        const fetchedBook = await fetchBook();
        await fetchShelves(fetchedBook);
      } catch (error) {
        console.error(error);
        alert("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [bookId, router]);

  const handleEditChange = (field: keyof EditForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusChange = (value: string) => {
    setEditForm((prev) => ({
      ...prev,
      status: value,
      finishedDate: value === "読了" ? prev.finishedDate : "",
    }));
  };

  const allTags = useMemo(() => {
    if (!book?.tags) return [];
    return Array.from(new Set(book.tags)).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [book]);

  const getCurrentTagKeyword = (tagsText: string) => {
    const parts = tagsText.split(",");
    return parts[parts.length - 1].trim().toLowerCase();
  };

  const getAlreadySelectedTags = (tagsText: string) => {
    return tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "")
      .map((tag) => tag.toLowerCase());
  };

  const tagSuggestions = (() => {
    const currentKeyword = getCurrentTagKeyword(editForm.tagsText);
    const selectedTags = getAlreadySelectedTags(editForm.tagsText);

    return allTags.filter((tag) => {
      const lowerTag = tag.toLowerCase();

      if (selectedTags.includes(lowerTag)) return false;
      if (!currentKeyword) return true;

      return lowerTag.includes(currentKeyword);
    });
  })();

  const handleTagSuggestionClick = (tag: string) => {
    const parts = editForm.tagsText.split(",");
    parts[parts.length - 1] = ` ${tag}`;

    const nextValue = parts
      .join(",")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .join(", ");

    setEditForm((prev) => ({
      ...prev,
      tagsText: `${nextValue}, `,
    }));

    setShowTagSuggestions(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const tagsArray = editForm.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      const normalizedShelf = normalizeShelfName(editForm.shelf);

      await updateDoc(doc(db, "books", bookId), {
        title: editForm.title.trim() || "タイトルなし",
        isbn: editForm.isbn.trim(),
        publisher: editForm.publisher.trim(),
        author: editForm.author.trim(),
        authors: editForm.author.trim()
          ? editForm.author
              .split(",")
              .map((name) => name.trim())
              .filter((name) => name !== "")
          : [],
        shelf: normalizedShelf,
        owned: editForm.owned,
        status: editForm.status,
        finishedDate: editForm.finishedDate || "",
        memo: editForm.memo,
        tags: tagsArray,
      });

      alert("更新しました");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("この本を削除しますか？");
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "books", bookId));
      alert("削除しました");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main style={ui.layout.page}>
        <div style={ui.layout.pageWrap}>
          <p style={ui.text.helper}>読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={ui.layout.page}>
      <style jsx>{`
        .pageWrap {
          max-width: 760px;
          margin: 0 auto;
        }

        .formCard {
          background: ${ui.colors.cardBg};
          border: 1px solid ${ui.colors.border};
          border-radius: 14px;
          padding: 20px;
        }

        .topArea {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 20px;
          align-items: start;
          margin-bottom: 24px;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 16px;
        }

        .fieldFull {
          grid-column: 1 / -1;
        }

        .actionRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .formCard {
            padding: 16px;
          }

          .topArea {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .fieldGrid {
            grid-template-columns: 1fr;
          }

          .actionRow button {
            flex: 1;
          }
        }
      `}</style>

      <div className="pageWrap">
        <Link
          href="/"
          style={{ ...ui.button.secondary, display: "inline-block", marginBottom: "20px" }}
        >
          ← 戻る
        </Link>

        <h1 style={ui.layout.sectionTitle}>本を編集</h1>
        <p style={ui.layout.sectionDescription}>
          この画面で本の編集と削除ができます
        </p>

        <div className="formCard">
          <div className="topArea">
            <div>
              {book?.image ? (
                <img
                  src={book.image}
                  alt="表紙"
                  style={{
                    width: "100%",
                    maxWidth: "120px",
                    borderRadius: "8px",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "120px",
                    aspectRatio: "2 / 3",
                    background: ui.colors.inputDisabledBg,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: ui.colors.placeholder,
                    fontSize: "13px",
                  }}
                >
                  画像なし
                </div>
              )}
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  fontSize: "22px",
                  lineHeight: 1.5,
                  color: ui.colors.text,
                  wordBreak: "break-word",
                }}
              >
                {editForm.title || "タイトルなし"}
              </p>

              {editForm.author && (
                <p
                  style={{
                    margin: "8px 0 0 0",
                    color: ui.colors.subText,
                    fontSize: "14px",
                    wordBreak: "break-word",
                  }}
                >
                  {editForm.author}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                <span style={ui.badge.shelf}>
                  {normalizeShelfName(editForm.shelf)}
                </span>

                <span style={editForm.owned ? ui.badge.owned : ui.badge.notOwned}>
                  {editForm.owned ? "所持" : "未所持"}
                </span>

                {editForm.tagsText
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag !== "")
                  .map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      style={{
                        background: ui.colors.tagBg,
                        color: ui.colors.tagText,
                        padding: "4px 8px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        display: "inline-block",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="fieldGrid">
            <div className="fieldFull">
              <p style={ui.input.label}>タイトル</p>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => handleEditChange("title", e.target.value)}
                style={ui.input.base}
              />
            </div>

            <div className="fieldFull">
              <p style={ui.input.label}>著者</p>
              <input
                type="text"
                value={editForm.author}
                onChange={(e) => handleEditChange("author", e.target.value)}
                style={ui.input.base}
              />
            </div>

            <div>
              <p style={ui.input.label}>ISBN</p>
              <input
                type="text"
                value={editForm.isbn}
                onChange={(e) => handleEditChange("isbn", e.target.value)}
                style={ui.input.base}
              />
            </div>

            <div>
              <p style={ui.input.label}>出版社</p>
              <input
                type="text"
                value={editForm.publisher}
                onChange={(e) => handleEditChange("publisher", e.target.value)}
                style={ui.input.base}
              />
            </div>

            <div>
              <p style={ui.input.label}>棚</p>
              <select
                value={editForm.shelf}
                onChange={(e) => handleEditChange("shelf", e.target.value)}
                style={ui.input.base}
              >
                {shelfList.map((shelf) => (
                  <option key={shelf} value={shelf}>
                    {shelf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p style={ui.input.label}>所持</p>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  border: `1px solid ${ui.colors.inputBorder}`,
                  borderRadius: "8px",
                  background: ui.colors.cardBg,
                  fontSize: "16px",
                  color: ui.colors.text,
                  boxSizing: "border-box",
                }}
              >
                <input
                  type="checkbox"
                  checked={editForm.owned}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      owned: e.target.checked,
                    }))
                  }
                />
                所持
              </label>
            </div>

            <div>
              <p style={ui.input.label}>ステータス</p>
              <select
                value={editForm.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={ui.input.base}
              >
                <option value="未読">未読</option>
                <option value="読書中">読書中</option>
                <option value="読了">読了</option>
              </select>
            </div>

            <div className="fieldFull">
              <p style={ui.input.label}>読了日</p>
              <input
                type="date"
                value={editForm.finishedDate}
                onChange={(e) => handleEditChange("finishedDate", e.target.value)}
                disabled={editForm.status !== "読了"}
                style={{
                  ...ui.input.base,
                  background:
                    editForm.status !== "読了"
                      ? ui.colors.inputDisabledBg
                      : ui.colors.cardBg,
                }}
              />

              <div style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleEditChange("finishedDate", "")}
                  style={ui.button.smallMuted}
                >
                  読了日を未指定にする
                </button>
              </div>
            </div>

            <div className="fieldFull" style={{ position: "relative" }}>
              <p style={ui.input.label}>タグ</p>

              <input
                type="text"
                value={editForm.tagsText}
                onChange={(e) => {
                  handleEditChange("tagsText", e.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowTagSuggestions(false);
                  }, 150);
                }}
                placeholder="小説, ミステリー, お気に入り"
                style={ui.input.base}
              />

              <p
                style={{
                  margin: "6px 0 0 0",
                  color: ui.colors.subText,
                  fontSize: "12px",
                }}
              >
                カンマ区切りで入力
              </p>

              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "74px",
                    left: 0,
                    right: 0,
                    background: ui.colors.cardBg,
                    border: `1px solid ${ui.colors.border}`,
                    borderRadius: "8px",
                    boxShadow: `0 4px 12px ${ui.colors.shadow}`,
                    maxHeight: "180px",
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  {tagSuggestions.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleTagSuggestionClick(tag)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: ui.colors.cardBg,
                        border: "none",
                        borderBottom: `1px solid ${ui.colors.borderSoft}`,
                        cursor: "pointer",
                        fontSize: "14px",
                        color: ui.colors.text,
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="fieldFull">
              <p style={ui.input.label}>メモ</p>
              <textarea
                value={editForm.memo}
                onChange={(e) => handleEditChange("memo", e.target.value)}
                rows={5}
                style={ui.input.textarea}
              />
            </div>
          </div>

          <div className="actionRow">
            <button
              onClick={handleSave}
              disabled={saving}
              style={ui.button.primary}
            >
              {saving ? "保存中..." : "保存"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              style={ui.button.muted}
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}