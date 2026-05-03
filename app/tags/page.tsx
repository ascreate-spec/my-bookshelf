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
import { ui } from "@/lib/ui";
import { isAllowedEmail } from "../../lib/authGuard";
import { signOut } from "firebase/auth";
import PageHeader from "../../components/PageHeader";
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
      <div style={ui.tagsPage.authBox}>
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
  @media (max-width: 768px) {
    .addArea {
      display: grid !important;
      gap: 10px !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin-bottom: 20px !important;
    }

    .addArea > * {
      width: 100% !important;
    }

    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
    }

    .actions {
      justify-content: flex-end;
      flex-wrap: nowrap;
    }

    .editRow {
      grid-template-columns: 1fr !important;
      align-items: stretch;
      gap: 10px;
    }

    .editRow input {
      width: 100%;
    }

    .editActions {
      width: 100%;
      justify-content: flex-end;
      flex-wrap: nowrap;
    }

    .editActions button,
    .actions button {
      flex: 0 0 auto;
    }
  }
`}</style>

      <div style={ui.tagsPage.pageWrap}>

        <PageHeader title="タグ設定" backHref="/" />

        <div style={ui.tagsPage.searchArea}>

          <div style={ui.tagsPage.relativeField}>
            <input
  id="tagSearch"
  type="text"
  value={searchText}
  autoComplete="off"
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="タグを検索"
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
                style={ui.tagsPage.clearButton}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div
  className="addArea"
  style={{
    display: "grid",
    gap: "10px",
    width: "100%",
    marginTop: "16px",
    marginBottom: "20px",
  }}
>
  <div style={ui.tagsPage.addInputWrap}>
    <input
      value={newTagName}
      onChange={(e) => setNewTagName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleAddTag();
      }}
      placeholder="追加するタグ"
      style={{
  ...ui.input.base,
  width: "100%",
}}
    />

    {newTagName && (
      <button
        type="button"
        onClick={() => setNewTagName("")}
        aria-label="入力を消す"
        style={ui.tagsPage.clearButton}
      >
        ×
      </button>
    )}
  </div>

  <button
    type="button"
    onClick={handleAddTag}
    style={{
      ...ui.button.primary,
      width: "100%",
      justifyContent: "center",
      ...ui.tagsPage.smallActionButton,
    }}
  >
    タグを追加
  </button>

  <button
    type="button"
    onClick={handleImportTagsFromBooks}
    style={{
      ...ui.button.secondary,
      width: "100%",
      justifyContent: "center",
      ...ui.tagsPage.importButton,
    }}
  >
    本データから取り込む
  </button>
</div>

        {loading && <p style={ui.text.helper}>読み込み中...</p>}

        {!loading && filteredTags.length === 0 && (
          <p style={ui.text.helper}>タグが見つかりませんでした</p>
        )}

        {!loading && filteredTags.length > 0 && (
          <div style={ui.tagsPage.listBox}>
            {filteredTags.map((tag) => (
              <div
  key={tag.id}
  className="row"
  style={{
    ...ui.tagsPage.row,
    ...(filteredTags.indexOf(tag) > 0 ? ui.tagsPage.rowWithBorder : {}),
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = ui.colors.selectedBg;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "";
  }}
>
                {editingTagId === tag.id ? (
                  <div className="editRow" style={ui.tagsPage.editRow}>
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

                    <div className="editActions" style={ui.tagsPage.editActions}>
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
    ...ui.tagsPage.tagName,
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    maxWidth: "100%",
    padding: "6px 10px",
    borderRadius: "999px",
    background: ui.colors.hoverBg,
    color: ui.colors.text,
    fontSize: "14px",
    fontWeight: 600,
  }}
>
  #{tag.name}
</div>

                    <div className="actions" style={ui.tagsPage.actions}>
                      <button
  type="button"
  onClick={() => handleEditStart(tag)}
  style={{
    ...ui.button.edit,
    ...ui.tagsPage.smallActionButton,
  }}
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