"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "../../lib/ui";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

type Shelf = {
  id: string;
  name: string;
  order?: number;
};

export default function ShelvesPage() {
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

  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [newShelfName, setNewShelfName] = useState("");
  const [addingShelf, setAddingShelf] = useState(false);

  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingShelfName, setEditingShelfName] = useState("");

  const fetchShelves = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "shelves"));
      const fetchedShelves: Shelf[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        order:
          typeof doc.data().order === "number" ? doc.data().order : undefined,
      }));

      const mergedShelfNames = Array.from(
        new Set([
          ...defaultShelves,
          ...fetchedShelves.map((shelf) => shelf.name).filter((name) => name),
        ])
      );

      const normalizedShelves: Shelf[] = mergedShelfNames.map((name, index) => {
        const existing = fetchedShelves.find((shelf) => shelf.name === name);

        if (existing) {
          return existing;
        }

        return {
          id: `default-${name}`,
          name,
          order: index,
        };
      });

      const sortedShelves = normalizedShelves.sort((a, b) => {
        if (a.name === "未分類") return -1;
        if (b.name === "未分類") return 1;

        const aOrder =
          typeof a.order === "number"
            ? a.order
            : defaultShelves.indexOf(a.name) >= 0
            ? defaultShelves.indexOf(a.name)
            : 9999;

        const bOrder =
          typeof b.order === "number"
            ? b.order
            : defaultShelves.indexOf(b.name) >= 0
            ? defaultShelves.indexOf(b.name)
            : 9999;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.name.localeCompare(b.name, "ja");
      });

      setShelves(sortedShelves);
    } catch (error) {
      console.error(error);
      alert("棚一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, []);

  const handleAddShelf = async () => {
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
        createdAt: new Date(),
      });

      setNewShelfName("");
      await fetchShelves();
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

      if (!shelf.id.startsWith("default-")) {
        batch.set(
          doc(db, "shelves", shelf.id),
          {
            name: trimmed,
            order: typeof shelf.order === "number" ? shelf.order : 9999,
          },
          { merge: true }
        );
      } else {
        const newDocRef = doc(collection(db, "shelves"));
        batch.set(newDocRef, {
          name: trimmed,
          order: typeof shelf.order === "number" ? shelf.order : shelves.length,
          createdAt: new Date(),
        });
      }

      const booksQuery = query(
        collection(db, "books"),
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
      await fetchShelves();
    } catch (error) {
      console.error(error);
      alert("棚名の更新に失敗しました");
    }
  };

  const handleShelfDelete = async (shelf: Shelf) => {
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

      if (!shelf.id.startsWith("default-")) {
        batch.delete(doc(db, "shelves", shelf.id));
      }

      const booksQuery = query(
        collection(db, "books"),
        where("shelf", "==", shelf.name)
      );
      const booksSnapshot = await getDocs(booksQuery);

      booksSnapshot.forEach((bookDoc) => {
        batch.update(doc(db, "books", bookDoc.id), {
          shelf: "未分類",
        });
      });

      await batch.commit();
      await fetchShelves();
    } catch (error) {
      console.error(error);
      alert("棚の削除に失敗しました");
    }
  };

  const handleMoveShelf = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= shelves.length) return;

    const updatedShelves = [...shelves];
    const temp = updatedShelves[index];
    updatedShelves[index] = updatedShelves[targetIndex];
    updatedShelves[targetIndex] = temp;

    try {
      const batch = writeBatch(db);

      for (let i = 0; i < updatedShelves.length; i++) {
        const shelf = updatedShelves[i];

        if (shelf.id.startsWith("default-")) {
          const newDocRef = doc(collection(db, "shelves"));
          batch.set(newDocRef, {
            name: shelf.name,
            order: i,
            createdAt: new Date(),
          });
        } else {
          batch.set(
            doc(db, "shelves", shelf.id),
            {
              name: shelf.name,
              order: i,
            },
            { merge: true }
          );
        }
      }

      await batch.commit();
      await fetchShelves();
    } catch (error) {
      console.error(error);
      alert("棚の並び替えに失敗しました");
    }
  };

  return (
    <main style={ui.layout.page}>
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
          style={{ ...ui.button.secondary, display: "inline-block", marginBottom: "20px" }}
        >
          ← 戻る
        </Link>

        <h1 style={ui.layout.sectionTitle}>棚を編集</h1>
        <p style={ui.layout.sectionDescription}>
          棚の追加・編集・削除・並び替えができます
        </p>

        <div className="addArea">
          <input
            type="text"
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            placeholder="新しい棚名を入力"
            style={{
              ...ui.input.base,
              flex: 1,
              minWidth: 0,
            }}
          />
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
                        disabled={index === 0}
                        style={index === 0 ? ui.button.smallMuted : ui.button.smallSecondary}
                      >
                        ↑
                      </button>

                      <button
                        onClick={() => handleMoveShelf(index, "down")}
                        disabled={index === shelves.length - 1}
                        style={
                          index === shelves.length - 1
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
    </main>
  );
}