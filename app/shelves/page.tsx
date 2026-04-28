"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "@/lib/ui";
import { isAllowedEmail } from "../../lib/authGuard";
import { signOut } from "firebase/auth";
import BottomNav from "../../components/BottomNav";

type Shelf = {
  id: string;
  name: string;
  order: number;
  uid: string;
};

export default function ShelvesPage() {
  const initialShelves = [
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

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);

  const [newShelfName, setNewShelfName] = useState("");
  const [addingShelf, setAddingShelf] = useState(false);

  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingShelfName, setEditingShelfName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const seedShelvesIfNeeded = async (uid: string) => {
    const q = query(collection(db, "shelves"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) return;

    const batch = writeBatch(db);

    initialShelves.forEach((name, index) => {
      const ref = doc(collection(db, "shelves"));
      batch.set(ref, {
        name,
        order: index,
        uid,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  };

  const fetchShelves = async (uid: string) => {
    try {
      setLoading(true);

      await seedShelvesIfNeeded(uid);

      const q = query(
  collection(db, "shelves"),
  where("uid", "==", uid)
);

const snapshot = await getDocs(q);

const list: Shelf[] = snapshot.docs
  .map((docSnap) => ({
    id: docSnap.id,
    name: (docSnap.data().name || "").trim(),
    order: typeof docSnap.data().order === "number" ? docSnap.data().order : 9999,
    uid: docSnap.data().uid || "",
  }))
  .filter((shelf) => shelf.name !== "")
  .sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name, "ja");
  });

setShelves(list);
    } catch (error) {
      console.error(error);
      alert("棚一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setShelves([]);
      setLoading(false);
      return;
    }

    fetchShelves(user.uid);
  }, [user]);

  const handleAddShelf = async () => {
    if (!user) return;

    const trimmed = newShelfName.trim();

    if (!trimmed) {
      alert("棚名を入力してください");
      return;
    }

    const alreadyExists = shelves.some(
      (shelf) => shelf.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      alert("その棚はすでにあります");
      return;
    }

    try {
      setAddingShelf(true);

      await addDoc(collection(db, "shelves"), {
        name: trimmed,
        order: shelves.length,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });

      setNewShelfName("");
      await fetchShelves(user.uid);
    } catch (error) {
      console.error(error);
      alert("棚の追加に失敗しました");
    } finally {
      setAddingShelf(false);
    }
  };

  const handleEditStart = (shelf: Shelf) => {
    setEditingShelfId(shelf.id);
    setEditingShelfName(shelf.name);
  };

  const handleEditCancel = () => {
    setEditingShelfId(null);
    setEditingShelfName("");
  };

  const handleShelfUpdate = async (shelf: Shelf) => {
    if (!user) return;

    const trimmed = editingShelfName.trim();

    if (!trimmed) {
      alert("棚名を入力してください");
      return;
    }

    if (shelf.name === "未分類" && trimmed !== "未分類") {
      alert("未分類の棚名は変更できません");
      return;
    }

    const duplicateExists = shelves.some(
      (item) =>
        item.name.toLowerCase() === trimmed.toLowerCase() &&
        item.id !== shelf.id
    );

    if (duplicateExists) {
      alert("その棚名はすでにあります");
      return;
    }

    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "shelves", shelf.id), {
        name: trimmed,
      });

      const booksQuery = query(
        collection(db, "books"),
        where("uid", "==", user.uid),
        where("shelf", "==", shelf.name)
      );
      const booksSnapshot = await getDocs(booksQuery);

      booksSnapshot.forEach((bookDoc) => {
        batch.update(doc(db, "books", bookDoc.id), {
          shelf: trimmed,
        });
      });

      await batch.commit();

      handleEditCancel();
      await fetchShelves(user.uid);
    } catch (error) {
      console.error(error);
      alert("棚名の更新に失敗しました");
    }
  };

  const handleShelfDelete = async (shelf: Shelf) => {
    if (!user) return;

    if (shelf.name === "未分類") {
      alert("未分類の棚は削除できません");
      return;
    }

    const confirmed = window.confirm(
      `「${shelf.name}」を削除しますか？\nこの棚の本は「未分類」になります。`
    );
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, "shelves", shelf.id));

      const booksQuery = query(
        collection(db, "books"),
        where("uid", "==", user.uid),
        where("shelf", "==", shelf.name)
      );
      const booksSnapshot = await getDocs(booksQuery);

      booksSnapshot.forEach((bookDoc) => {
        batch.update(doc(db, "books", bookDoc.id), {
          shelf: "未分類",
        });
      });

      await batch.commit();

      await normalizeShelfOrder(user.uid);
      await fetchShelves(user.uid);
    } catch (error) {
      console.error(error);
      alert("棚の削除に失敗しました");
    }
  };

  const normalizeShelfOrder = async (uid: string) => {
  const q = query(
    collection(db, "shelves"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);

  // ←ここが今回追加する部分
  const docs = snapshot.docs.sort((a, b) => {
    const aOrder =
      typeof a.data().order === "number" ? a.data().order : 9999;
    const bOrder =
      typeof b.data().order === "number" ? b.data().order : 9999;

    return aOrder - bOrder;
  });

  const batch = writeBatch(db);

  docs.forEach((docSnap, index) => {
    batch.update(doc(db, "shelves", docSnap.id), { order: index });
  });

  await batch.commit();
};

  const handleMoveShelf = async (index: number, direction: "up" | "down") => {
    if (!user) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= shelves.length) return;

    if (shelves[index].name === "未分類" || shelves[targetIndex].name === "未分類") {
      return;
    }

    const updatedShelves = [...shelves];
    [updatedShelves[index], updatedShelves[targetIndex]] = [
      updatedShelves[targetIndex],
      updatedShelves[index],
    ];

    try {
      const batch = writeBatch(db);

      updatedShelves.forEach((shelf, newIndex) => {
        batch.update(doc(db, "shelves", shelf.id), {
          order: newIndex,
        });
      });

      await batch.commit();
      await fetchShelves(user.uid);
    } catch (error) {
      console.error(error);
      alert("棚の並び替えに失敗しました");
    }
  };

  if (authLoading) {
    return <main style={ui.layout.page}><p style={ui.text.helper}>認証確認中...</p></main>;
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
          margin-bottom: 24px;
          display: flex;
          gap: 8px;
          align-items: center;
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
            grid-template-columns: 1fr;
            align-items: start;
          }

          .actions {
            justify-content: flex-start;
          }

          .editRow {
            grid-template-columns: 1fr;
          }

          .editActions {
            width: 100%;
          }

          .editActions button,
          .actions button {
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

        <h1 style={ui.layout.sectionTitle}>棚を編集</h1>
        <p style={ui.layout.sectionDescription}>
          棚の追加・編集・削除・並び替えができます
        </p>

        <div className="addArea">
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
  <input
    type="text"
    value={newShelfName}
    onChange={(e) => setNewShelfName(e.target.value)}
    placeholder="新しい棚名を入力"
    style={{
      ...ui.input.base,
      flex: 1,
      minWidth: 0,
      paddingRight: "36px",
    }}
    onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddShelf();
  }
}}
  />

  {newShelfName && (
    <button
      type="button"
      onClick={() => setNewShelfName("")}
      aria-label="棚名をクリア"
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
            onClick={handleAddShelf}
            disabled={addingShelf}
            style={{
              ...ui.button.primary,
              whiteSpace: "nowrap",
              padding: "12px 16px",
            }}
          >
            {addingShelf ? "追加中..." : "棚を追加"}
          </button>
        </div>

        {loading && <p style={ui.text.helper}>読み込み中...</p>}

        {!loading && (
          <div className="listBox">
            {shelves.map((shelf, index) => (
              <div
                key={shelf.id}
                className="row"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = ui.colors.selectedBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                }}
              >
                {editingShelfId === shelf.id ? (
                  <div className="editRow">
                    <div>
                      <input
                        type="text"
                        value={editingShelfName}
                        onChange={(e) => setEditingShelfName(e.target.value)}
                        style={ui.input.base}
                      />
                    </div>

                    <div className="editActions">
                      <button
                        onClick={() => handleShelfUpdate(shelf)}
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
                      {shelf.name}
                    </div>

                    <div className="actions">
                      <button
                        onClick={() => handleMoveShelf(index, "up")}
                        disabled={index === 0 || shelf.name === "未分類"}
                        style={
                          index === 0 || shelf.name === "未分類"
                            ? ui.button.smallMuted
                            : ui.button.smallSecondary
                        }
                      >
                        ↑
                      </button>

                      <button
                        onClick={() => handleMoveShelf(index, "down")}
                        disabled={index === shelves.length - 1 || shelf.name === "未分類"}
                        style={
                          index === shelves.length - 1 || shelf.name === "未分類"
                            ? ui.button.smallMuted
                            : ui.button.smallSecondary
                        }
                      >
                        ↓
                      </button>

                      <button
                        onClick={() => handleEditStart(shelf)}
                        disabled={shelf.name === "未分類"}
                        style={
                          shelf.name === "未分類"
                            ? ui.button.smallMuted
                            : ui.button.smallSecondary
                        }
                      >
                        編集
                      </button>

                      <button
                        onClick={() => handleShelfDelete(shelf)}
                        disabled={shelf.name === "未分類"}
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