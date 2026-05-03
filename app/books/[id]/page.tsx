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
import PageHeader from "../../../components/PageHeader";
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
  .fieldFull {
    grid-column: 1 / -1;
  }

  @media (max-width: 768px) {
    .formCard {
      padding: 16px;
    }

    .topArea {
      grid-template-columns: 1fr !important;
      gap: 16px;
    }

    .fieldGrid {
      grid-template-columns: 1fr !important;
      gap: 16px;
    }

    .actionRow {
      flex-direction: column;
    }

    .actionRow button {
      width: 100%;
      flex: none;
    }
  }
`}</style>

      <div style={ui.bookEditPage.pageWrap}>

        <PageHeader title="本を編集" backHref="/" />

        <div className="formCard" style={ui.bookEditPage.formCard}>
          <div className="topArea" style={ui.bookEditPage.topArea}>
            <div>
              {book?.image ? (
                <img
  src={book.image}
  alt="表紙"
  style={ui.bookEditPage.coverImage}
/>
              ) : (
                <div style={ui.bookEditPage.coverPlaceholder}>
  画像なし
</div>
              )}
            </div>

            <div>
              <p style={ui.bookEditPage.previewTitle}>
                {editForm.title || "タイトルなし"}
              </p>

              {editForm.author && (
                <p style={ui.bookEditPage.previewAuthor}>
                  {editForm.author}
                </p>
              )}

              <div style={ui.bookEditPage.badgeRow}>
                <span style={ui.badge.shelf}>
                  {normalizeShelfName(editForm.shelf)}
                </span>

                {editForm.owned && <span style={ui.badge.owned}>所持</span>}

                {editForm.isEbook && (
                  <span style={ui.bookEditPage.ebookBadge}>
  電子書籍
</span>
                )}
              </div>
            </div>
          </div>

          <div style={ui.bookEditPage.tabRow}>
  <button
  type="button"
  style={{
    ...ui.bookEditPage.tabButton,
    ...(activeTab === "basic" ? ui.bookEditPage.tabButtonActive : {}),
  }}
  onClick={() => setActiveTab("basic")}
>
  基本情報
</button>

  <button
  type="button"
  style={{
    ...ui.bookEditPage.tabButton,
    ...(activeTab === "settings" ? ui.bookEditPage.tabButtonActive : {}),
  }}
  onClick={() => setActiveTab("settings")}
>
  ステータス・管理
</button>
</div>

          <div className="fieldGrid" style={ui.bookEditPage.fieldGrid}>
            {activeTab === "settings" ? (
              <>
                <div className="fieldFull">
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
  onChange={(e) =>
    handleEditChange("finishedDate", e.target.value)
  }
  disabled={editForm.status !== "読了"}
  style={{
  ...ui.input.base,
  ...ui.bookEditPage.dateInput,
  ...(editForm.status !== "読了"
    ? ui.bookEditPage.dateInputDisabled
    : ui.bookEditPage.dateInputEnabled),
}}
/>

                  <div style={ui.bookEditPage.smallButtonArea}>
                    <button
                      type="button"
                      onClick={() => handleEditChange("finishedDate", "")}
                      style={ui.button.smallMuted}
                    >
                      読了日を未指定にする
                    </button>
                  </div>
                </div>

                <div className="fieldFull">
  <label style={ui.bookEditPage.checkboxLabel}>
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

                <div className="fieldFull">
  <label style={ui.bookEditPage.checkboxLabel}>
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

                <div className="fieldFull" style={ui.bookEditPage.tagArea}>
                  <p style={ui.input.label}>タグ</p>

                  <div
  style={{
    ...ui.input.base,
    ...ui.bookEditPage.tagInputBox,
  }}
>
                    {editForm.tags.map((tag, index) => (
                      <span style={ui.bookEditPage.tagChip}>
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={ui.bookEditPage.tagRemoveButton}
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
                      style={ui.bookEditPage.tagInnerInput}
                    />
                  </div>

                  <p style={ui.bookEditPage.helperSmall}>
                    Enterで追加。×ですぐ削除できます
                  </p>

                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div style={ui.bookEditPage.suggestionList}>
                      {tagSuggestions.slice(0, 8).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleTagSuggestionClick(tag)}
                          style={ui.bookEditPage.suggestionButton}
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
  ...ui.bookEditPage.memoTextarea,
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
            <p style={ui.bookEditPage.dateMeta}>
              登録日：
              {book.createdAt?.toDate
                ? book.createdAt.toDate().toLocaleDateString("ja-JP")
                : new Date(book.createdAt).toLocaleDateString("ja-JP")}
            </p>
          )}

          {book?.updatedAt && (
            <p style={ui.bookEditPage.updatedMeta}>
              更新日：
              {book.updatedAt?.toDate
                ? book.updatedAt.toDate().toLocaleDateString("ja-JP")
                : new Date(book.updatedAt).toLocaleDateString("ja-JP")}
            </p>
          )}

          <div className="actionRow" style={ui.bookEditPage.actionRow}>
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