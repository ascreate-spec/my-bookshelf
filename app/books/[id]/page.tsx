"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db, auth } from "../../../lib/firebase";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "@/lib/ui";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { isAllowedEmail } from "../../../lib/authGuard";
import BottomNav from "../../../components/BottomNav";

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
  uid?: string;
  createdAt?: any;
  updatedAt?: any;
  subTitle?: string;
  seriesName?: string;
  isEbook?: boolean;
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
  tags: string[];
  owned: boolean;
  subTitle: string;
  seriesName: string;
  isEbook: boolean;
};

export default function BookEditPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const normalizeShelfName = (shelf: string | undefined | null) => {
    const trimmed = (shelf || "").trim();
    return trimmed ? trimmed : "未分類";
  };

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"settings" | "basic">("settings");

  const [book, setBook] = useState<SavedBook | null>(null);
  const [shelfList, setShelfList] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    subTitle: "",
    seriesName: "",
    isEbook: false,
    isbn: "",
    publisher: "",
    author: "",
    shelf: "未分類",
    status: "未読",
    finishedDate: "",
    memo: "",
    tags: [],
    owned: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        uid: data.uid || "",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        subTitle: data.subTitle || "",
        seriesName: data.seriesName || "",
        isEbook: data.isEbook ?? false,
      };

      if (user && fetchedBook.uid && fetchedBook.uid !== user.uid) {
        alert("この本は編集できません");
        router.push("/");
        return null;
      }

      setBook(fetchedBook);

      setEditForm({
        title: fetchedBook.title || "",
        subTitle: fetchedBook.subTitle || "",
        seriesName: fetchedBook.seriesName || "",
        isEbook: fetchedBook.isEbook ?? false,
        isbn: fetchedBook.isbn || "",
        publisher: fetchedBook.publisher || "",
        author: fetchedBook.author || "",
        shelf: normalizeShelfName(fetchedBook.shelf),
        owned: fetchedBook.owned ?? false,
        status: fetchedBook.status || "未読",
        finishedDate: fetchedBook.finishedDate || "",
        memo: fetchedBook.memo || "",
        tags: Array.isArray(fetchedBook.tags) ? fetchedBook.tags : [],
      });

      return fetchedBook;
    };

    const fetchShelves = async () => {
      if (!user) {
        setShelfList([]);
        return;
      }

      const q = query(collection(db, "shelves"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const fetchedShelves: Shelf[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: (docSnap.data().name || "").trim(),
        order:
          typeof docSnap.data().order === "number"
            ? docSnap.data().order
            : 9999,
      }));

      const sortedShelves = fetchedShelves
        .filter((shelf) => shelf.name !== "")
        .sort((a, b) => {
          const aOrder = typeof a.order === "number" ? a.order : 9999;
          const bOrder = typeof b.order === "number" ? b.order : 9999;

          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name, "ja");
        })
        .map((shelf) => shelf.name);

      setShelfList(sortedShelves);
    };

    const fetchTags = async () => {
      if (!user) {
        setAllTags([]);
        return;
      }

      const q = query(collection(db, "books"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);

      const tags = Array.from(
        new Set(
          snapshot.docs.flatMap((docSnap) => {
            const data = docSnap.data();
            return Array.isArray(data.tags) ? data.tags : [];
          })
        )
      ).sort((a, b) => a.localeCompare(b, "ja"));

      setAllTags(tags);
    };

    const fetchAll = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await fetchBook();
        await fetchShelves();
        await fetchTags();
      } catch (error) {
        console.error(error);
        alert("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) return;
    fetchAll();
  }, [bookId, router, user, authLoading]);

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

  const normalizedTagInput = tagInput.trim().toLowerCase();

  const tagSuggestions = allTags.filter((tag) => {
    const alreadySelected = editForm.tags.some(
      (selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()
    );

    if (alreadySelected) return false;
    if (!normalizedTagInput) return true;

    return tag.toLowerCase().includes(normalizedTagInput);
  });

  const handleAddTag = (rawTag: string) => {
    const tag = rawTag.trim();
    if (!tag) return;

    const exists = editForm.tags.some(
      (item) => item.toLowerCase() === tag.toLowerCase()
    );

    if (exists) {
      setTagInput("");
      setShowTagSuggestions(false);
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));

    setTagInput("");
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    }

    if (e.key === "Backspace" && !tagInput.trim() && editForm.tags.length > 0) {
      e.preventDefault();
      handleRemoveTag(editForm.tags[editForm.tags.length - 1]);
    }
  };

  const handleTagSuggestionClick = (tag: string) => {
    handleAddTag(tag);
  };

  const ensureTagsExist = async (uid: string, tags: string[]) => {
    const normalizedTags = Array.from(
      new Set(tags.map((tag) => tag.trim()).filter((tag) => tag !== ""))
    );

    if (normalizedTags.length === 0) return;

    const q = query(collection(db, "tags"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    const existingTagNames = snapshot.docs.map((docSnap) =>
      String(docSnap.data().name || "")
        .trim()
        .toLowerCase()
    );

    const missingTags = normalizedTags.filter(
      (tag) => !existingTagNames.includes(tag.toLowerCase())
    );

    await Promise.all(
      missingTags.map((tag) =>
        addDoc(collection(db, "tags"), {
          name: tag,
          uid,
          createdAt: new Date(),
        })
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const normalizedShelf = normalizeShelfName(editForm.shelf);

      await ensureTagsExist(user.uid, editForm.tags);

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
        tags: editForm.tags,
        updatedAt: new Date(),
        subTitle: editForm.subTitle.trim(),
        seriesName: editForm.seriesName.trim(),
        isEbook: editForm.isEbook,
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

  if (authLoading || loading) {
    return (
      <main style={ui.layout.page}>
        <div style={ui.layout.pageWrap}>
          <p style={ui.text.helper}>読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={ui.layout.page}>
        <div style={ui.layout.pageWrap}>
          <p style={ui.text.helper}>ログインしてください</p>
        </div>
      </main>
    );
  }

  if (!isAllowedEmail(user.email)) {
    return (
      <main style={ui.layout.page}>
        <div style={ui.layout.pageWrap}>
          <p>このアカウントでは利用できません</p>

          <button
            style={ui.button.muted}
            onClick={async () => {
              await signOut(auth);
              router.push("/");
            }}
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

        .tabRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .tabButton {
          border: 1px solid ${ui.colors.border};
          background: ${ui.colors.cardBg};
          color: ${ui.colors.text};
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
        }

        .tabButtonActive {
          background: ${ui.colors.text};
          color: ${ui.colors.cardBg};
          border-color: ${ui.colors.text};
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
          style={{
            ...ui.button.back,
            marginBottom: "20px",
          }}
          onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonBack)}
          onMouseLeave={clearHoverStyle}
          aria-label="戻る"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 6L9 12L15 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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

                {editForm.owned && <span style={ui.badge.owned}>所持</span>}

                {editForm.isEbook && (
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background: ui.colors.hoverBg,
                      color: ui.colors.text,
                      border: `1px solid ${ui.colors.border}`,
                    }}
                  >
                    電子書籍
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="tabRow">
  <button
    type="button"
    className={`tabButton ${
      activeTab === "basic" ? "tabButtonActive" : ""
    }`}
    onClick={() => setActiveTab("basic")}
  >
    基本情報
  </button>

  <button
    type="button"
    className={`tabButton ${
      activeTab === "settings" ? "tabButtonActive" : ""
    }`}
    onClick={() => setActiveTab("settings")}
  >
    ステータス・管理
  </button>
</div>

          <div className="fieldGrid">
            {activeTab === "settings" ? (
              <>
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

                <div>
                  <p style={ui.input.label}>読了日</p>
                  <input
                    type="date"
                    value={editForm.finishedDate}
                    onChange={(e) =>
                      handleEditChange("finishedDate", e.target.value)
                    }
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
                  <p style={ui.input.label}>電子書籍</p>
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
                      checked={editForm.isEbook}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isEbook: e.target.checked,
                        }))
                      }
                    />
                    電子書籍
                  </label>
                </div>

                <div className="fieldFull">
                  <p style={ui.input.label}>棚</p>
                  <select
                    value={editForm.shelf}
                    onChange={(e) => handleEditChange("shelf", e.target.value)}
                    style={ui.input.base}
                  >
                    <option value="">未分類</option>
                    {shelfList.map((shelf) => (
                      <option key={shelf} value={shelf}>
                        {shelf}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fieldFull" style={{ position: "relative" }}>
                  <p style={ui.input.label}>タグ</p>

                  <div
                    style={{
                      ...ui.input.base,
                      minHeight: "48px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      alignItems: "center",
                      padding: "8px 10px",
                    }}
                  >
                    {editForm.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: ui.colors.tagBg,
                          color: ui.colors.tagText,
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          lineHeight: 1,
                        }}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: ui.colors.tagText,
                            fontSize: "14px",
                            padding: 0,
                            lineHeight: 1,
                          }}
                          aria-label={`${tag} を削除`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowTagSuggestions(true);
                      }}
                      onKeyDown={handleTagInputKeyDown}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowTagSuggestions(false);
                        }, 150);
                      }}
                      placeholder="タグを入力して Enter で追加"
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        flex: 1,
                        minWidth: "140px",
                        fontSize: "14px",
                        color: ui.colors.text,
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0 0",
                      color: ui.colors.subText,
                      fontSize: "12px",
                    }}
                  >
                    Enterで追加。×ですぐ削除できます
                  </p>

                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "86px",
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
                    style={{
                      ...ui.input.textarea,
                      minHeight: "120px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </>
            ) : (
              <>
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
                  <p style={ui.input.label}>サブタイトル</p>
                  <input
                    type="text"
                    value={editForm.subTitle}
                    onChange={(e) =>
                      handleEditChange("subTitle", e.target.value)
                    }
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

                <div className="fieldFull">
                  <p style={ui.input.label}>出版社</p>
                  <input
                    type="text"
                    value={editForm.publisher}
                    onChange={(e) =>
                      handleEditChange("publisher", e.target.value)
                    }
                    style={ui.input.base}
                  />
                </div>

                <div className="fieldFull">
                  <p style={ui.input.label}>シリーズ名</p>
                  <input
                    type="text"
                    value={editForm.seriesName}
                    onChange={(e) =>
                      handleEditChange("seriesName", e.target.value)
                    }
                    style={ui.input.base}
                  />
                </div>

                <div className="fieldFull">
                  <p style={ui.input.label}>ISBN</p>
                  <input
                    type="text"
                    value={editForm.isbn}
                    onChange={(e) => handleEditChange("isbn", e.target.value)}
                    style={ui.input.base}
                  />
                </div>
              </>
            )}
          </div>

          {book?.createdAt && (
            <p
              style={{
                margin: "8px 0 0 0",
                color: ui.colors.subText,
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              登録日：
              {book.createdAt?.toDate
                ? book.createdAt.toDate().toLocaleDateString("ja-JP")
                : new Date(book.createdAt).toLocaleDateString("ja-JP")}
            </p>
          )}

          {book?.updatedAt && (
            <p
              style={{
                margin: "4px 0 0 0",
                color: ui.colors.subText,
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              更新日：
              {book.updatedAt?.toDate
                ? book.updatedAt.toDate().toLocaleDateString("ja-JP")
                : new Date(book.updatedAt).toLocaleDateString("ja-JP")}
            </p>
          )}

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
      <BottomNav />
    </main>
  );
}