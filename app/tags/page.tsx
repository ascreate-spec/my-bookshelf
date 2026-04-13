"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ui } from "../../lib/ui";
import { isAllowedEmail } from "../../lib/authGuard";
import { signOut } from "firebase/auth";
import BottomNav from "../../components/BottomNav";

type TagItem = {
  id: string;
  name: string;
  uid: string;
};

export default function TagsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchTags = async (uid: string) => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "tags"),
        where("uid", "==", uid)
      );

      const snapshot = await getDocs(q);

      const list: TagItem[] = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          name: (docSnap.data().name || "").trim(),
          uid: docSnap.data().uid || "",
        }))
        .filter((tag) => tag.name !== "")
        .sort((a, b) => a.name.localeCompare(b.name, "ja"));

      setTags(list);
    } catch (error) {
      console.error(error);
      alert("タグ一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTags([]);
      setLoading(false);
      return;
    }

    fetchTags(user.uid);
  }, [user]);

  const filteredTags = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return tags;

    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(keyword)
    );
  }, [tags, searchText]);

  const handleAddTag = async () => {
    if (!user) return;

    const trimmed = newTagName.trim();

    if (!trimmed) {
      alert("タグ名を入力してください");
      return;
    }

    const alreadyExists = tags.some(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      alert("そのタグはすでにあります");
      return;
    }

    try {
      setAddingTag(true);

      await addDoc(collection(db, "tags"), {
        name: trimmed,
        uid: user.uid,
        createdAt: new Date(),
      });

      setNewTagName("");
      await fetchTags(user.uid);
    } catch (error) {
      console.error(error);
      alert("タグの追加に失敗しました");
    } finally {
      setAddingTag(false);
    }
  };

  const handleEditStart = (tag: TagItem) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const handleEditCancel = () => {
    setEditingTagId(null);
    setEditingTagName("");
  };

  const handleTagUpdate = async (tag: TagItem) => {
    if (!user) return;

    const trimmed = editingTagName.trim();

    if (!trimmed) {
      alert("タグ名を入力してください");
      return;
    }

    const duplicateExists = tags.some(
      (item) =>
        item.name.toLowerCase() === trimmed.toLowerCase() &&
        item.id !== tag.id
    );

    if (duplicateExists) {
      alert("そのタグ名はすでにあります");
      return;
    }

    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "tags", tag.id), {
        name: trimmed,
      });

      const booksQuery = query(
        collection(db, "books"),
        where("uid", "==", user.uid)
      );
      const booksSnapshot = await getDocs(booksQuery);

      booksSnapshot.forEach((bookDoc) => {
        const data = bookDoc.data();
        const currentTags = Array.isArray(data.tags) ? data.tags : [];

        if (!currentTags.includes(tag.name)) return;

        const nextTags = currentTags.map((item: string) =>
          item === tag.name ? trimmed : item
        );

        batch.update(doc(db, "books", bookDoc.id), {
          tags: Array.from(new Set(nextTags)),
        });
      });

      await batch.commit();

      handleEditCancel();
      await fetchTags(user.uid);
    } catch (error) {
      console.error(error);
      alert("タグ名の更新に失敗しました");
    }
  };

  const handleTagDelete = async (tag: TagItem) => {
    if (!user) return;

    const confirmed = window.confirm(
      `「${tag.name}」を削除しますか？\nこのタグは本データからも削除されます。`
    );
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, "tags", tag.id));

      const booksQuery = query(
        collection(db, "books"),
        where("uid", "==", user.uid)
      );
      const booksSnapshot = await getDocs(booksQuery);

      booksSnapshot.forEach((bookDoc) => {
        const data = bookDoc.data();
        const currentTags = Array.isArray(data.tags) ? data.tags : [];

        if (!currentTags.includes(tag.name)) return;

        const nextTags = currentTags.filter(
          (item: string) => item !== tag.name
        );

        batch.update(doc(db, "books", bookDoc.id), {
          tags: nextTags,
        });
      });

      await batch.commit();
      await fetchTags(user.uid);
    } catch (error) {
      console.error(error);
      alert("タグの削除に失敗しました");
    }
  };

  const handleImportTagsFromBooks = async () => {
  if (!user) return;

  try {
    const booksQuery = query(
      collection(db, "books"),
      where("uid", "==", user.uid)
    );
    const booksSnapshot = await getDocs(booksQuery);

    const bookTags = Array.from(
      new Set(
        booksSnapshot.docs.flatMap((docSnap) => {
          const data = docSnap.data();
          return Array.isArray(data.tags)
            ? data.tags
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag !== "")
            : [];
        })
      )
    ).sort((a, b) => a.localeCompare(b, "ja"));

    const existingTagNames = tags.map((tag) => tag.name.toLowerCase());

    const missingTags = bookTags.filter(
      (tag) => !existingTagNames.includes(tag.toLowerCase())
    );

    await Promise.all(
      missingTags.map((tag) =>
        addDoc(collection(db, "tags"), {
          name: tag,
          uid: user.uid,
          createdAt: new Date(),
        })
      )
    );

    await fetchTags(user.uid);
    alert("本データからタグを取り込みました");
  } catch (error) {
    console.error(error);
    alert("タグの取り込みに失敗しました");
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
          max-width: 820px;
          margin: 0 auto;
        }

        .addArea {
          margin-bottom: 20px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .searchArea {
          margin-bottom: 20px;
        }

        .listBox {
          border: 1px solid ${ui.colors.border};
          border-radius: 12px;
          overflow: hidden;
          background: ${ui.colors.cardBg};
        }

        .row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 14px 16px;
        }

        .row + .row {
          border-top: 1px solid ${ui.colors.borderSoft};
        }

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .editRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          width: 100%;
        }

        .editActions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
  .addArea {
    flex-direction: column;
    align-items: stretch;
  }

  .row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .actions {
    justify-content: flex-end;
    flex-wrap: nowrap;
  }

  .editRow {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .editActions {
    width: auto;
    flex-wrap: nowrap;
  }

  .editActions button,
  .actions button {
    flex: 0 0 auto;
  }
}
      `}</style>

      <div className="pageWrap">
        <Link
          href="/"
          style={{
            ...ui.button.secondary,
            display: "inline-block",
            marginBottom: "20px",
          }}
        >
          ← 戻る
        </Link>

        <h1 style={ui.layout.sectionTitle}>タグを編集</h1>
        <p style={ui.layout.sectionDescription}>
          タグの追加・編集・削除ができます
        </p>

        <div className="searchArea">
          <label htmlFor="tagSearch" style={ui.input.label}>
            タグを検索
          </label>

          <div style={{ position: "relative" }}>
            <input
              id="tagSearch"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="タグ名で検索"
              style={{
                ...ui.input.base,
                paddingRight: "36px",
              }}
            />

            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                aria-label="検索文字をクリア"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: ui.colors.subText,
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="addArea">
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="新しいタグ名を入力"
              style={{
                ...ui.input.base,
                flex: 1,
                minWidth: 0,
                paddingRight: "36px",
              }}
            />

            {newTagName && (
              <button
                type="button"
                onClick={() => setNewTagName("")}
                aria-label="タグ名をクリア"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: ui.colors.subText,
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={handleAddTag}
            disabled={addingTag}
            style={{
              ...ui.button.primary,
              whiteSpace: "nowrap",
              padding: "12px 16px",
            }}
          >
            {addingTag ? "追加中..." : "タグを追加"}
          </button>
          <button
  onClick={handleImportTagsFromBooks}
  style={ui.button.secondary}
>
  本データから取り込む
</button>
        </div>

        {loading && <p style={ui.text.helper}>読み込み中...</p>}

        {!loading && filteredTags.length === 0 && (
          <p style={ui.text.helper}>タグが見つかりませんでした</p>
        )}

        {!loading && filteredTags.length > 0 && (
          <div className="listBox">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="row"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = ui.colors.selectedBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                }}
              >
                {editingTagId === tag.id ? (
                  <div className="editRow">
                    <div>
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleTagUpdate(tag);
                          }
                        }}
                        style={ui.input.base}
                      />
                    </div>

                    <div className="editActions">
                      <button
                        onClick={() => handleTagUpdate(tag)}
                        style={ui.button.smallPrimary}
                      >
                        保存
                      </button>

                      <button
                        onClick={handleEditCancel}
                        style={ui.button.smallMuted}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: ui.colors.text,
                        wordBreak: "break-word",
                      }}
                    >
                      #{tag.name}
                    </div>

                    <div className="actions">
                      <button
                        onClick={() => handleEditStart(tag)}
                        style={ui.button.smallSecondary}
                      >
                        編集
                      </button>

                      <button
                        onClick={() => handleTagDelete(tag)}
                        style={ui.button.smallMuted}
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}