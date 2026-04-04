"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "../lib/ui";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

type SavedBook = {
  id: string;
  title: string;
  isbn: string;
  publisher?: string;
  author?: string;
  image?: string;
  shelf?: string;
  status?: string;
  finishedDate?: string;
  memo?: string;
  tags?: string[];
  owned?: boolean;
  uid?: string;
  createdAt?: any;
};

type Shelf = {
  id: string;
  name: string;
  order?: number;
};

export default function Home() {
  const router = useRouter();

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

  const [books, setBooks] = useState<SavedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelfList, setShelfList] = useState<string[]>(defaultShelves);

  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("すべて");
  const [selectedOwned, setSelectedOwned] = useState("すべて");
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [tagFilterText, setTagFilterText] = useState("");
  const [showTagFilterSuggestions, setShowTagFilterSuggestions] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setAuthLoading(false);
  });

  return () => unsubscribe();
}, []);
  
  useEffect(() => {
  const fetchBooks = async () => {
    if (!user) {
      setBooks([]);
      return [];
    }

    const q = query(
      collection(db, "books"),
      where("uid", "==", user.uid)
    );

    const querySnapshot = await getDocs(q);

    const bookList: SavedBook[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || "タイトルなし",
      isbn: doc.data().isbn || "",
      publisher: doc.data().publisher || "",
      author: doc.data().author || "",
      image: doc.data().image || "",
      shelf: normalizeShelfName(doc.data().shelf),
      status: doc.data().status || "未読",
      finishedDate: doc.data().finishedDate || "",
      memo: doc.data().memo || "",
      tags: Array.isArray(doc.data().tags) ? doc.data().tags : [],
      owned: doc.data().owned ?? false,
      uid: doc.data().uid || "",
      createdAt: doc.data().createdAt,
    }));

    setBooks(
      bookList.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      )
    );

    return bookList;
  };

  const fetchShelves = async (bookListFromFetch: SavedBook[] = []) => {
    if (!user) {
      setShelfList(defaultShelves);
      return;
    }

    const querySnapshot = await getDocs(collection(db, "shelves"));
    const fetchedShelves: Shelf[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: (doc.data().name || "").trim(),
      order:
        typeof doc.data().order === "number" ? doc.data().order : undefined,
    }));

    const dbShelves = fetchedShelves.filter((shelf) => shelf.name !== "");

    const bookShelves = bookListFromFetch
      .map((book) => normalizeShelfName(book.shelf))
      .filter((name) => name !== "");

    const mergedShelfNames = Array.from(
      new Set([
        ...defaultShelves,
        ...dbShelves.map((shelf) => shelf.name),
        ...bookShelves,
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

  if (!user) {
    setBooks([]);
    setShelfList(defaultShelves);
    setLoading(false);
    return;
  }

  const fetchAll = async () => {
    try {
      setLoading(true);
      const bookList = await fetchBooks();
      await fetchShelves(bookList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchAll();
}, [user]);

  const handleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    alert("ログインに失敗しました");
  }
};

const handleLogout = async () => {
  await signOut(auth);
};

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setTagFilterText(tag);
    setShowTagFilterSuggestions(false);
  };

  const allTags = Array.from(
    new Set(
      books.flatMap((book) => (Array.isArray(book.tags) ? book.tags : []))
    )
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const filteredTagOptions = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagFilterText.trim().toLowerCase())
  );

  const filteredBooks = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const filtered = books.filter((book) => {
      const normalizedShelf = normalizeShelfName(book.shelf);

      const matchesShelf = selectedShelf
        ? normalizedShelf === selectedShelf
        : true;

      const matchesStatus =
        selectedStatus === "すべて"
          ? true
          : (book.status || "未読") === selectedStatus;

      const matchesTag = selectedTag
        ? Array.isArray(book.tags) && book.tags.includes(selectedTag)
        : true;

      const matchesOwned =
        selectedOwned === "すべて"
          ? true
          : selectedOwned === "所持"
          ? book.owned === true
          : book.owned !== true;

      if (!matchesShelf || !matchesStatus || !matchesTag || !matchesOwned) {
        return false;
      }

      if (!keyword) return true;

      const tagsText = Array.isArray(book.tags) ? book.tags.join(" ") : "";

      const searchableText = [
        book.title || "",
        book.author || "",
        book.isbn || "",
        book.publisher || "",
        normalizedShelf,
        book.status || "",
        book.finishedDate || "",
        book.memo || "",
        tagsText,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "title") {
        return (a.title || "").localeCompare(b.title || "", "ja");
      }

      if (sortOrder === "finishedDate") {
        const aDate = a.finishedDate;
        const bDate = b.finishedDate;

        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;

        return bDate.localeCompare(aDate);
      }

      if (sortOrder === "oldest") {
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      }

      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    return sorted;
  }, [
    books,
    selectedShelf,
    selectedStatus,
    selectedOwned,
    searchText,
    selectedTag,
    sortOrder,
  ]);

  if (authLoading) {
  return <p style={ui.text.helper}>認証確認中...</p>;
}

if (!user) {
  return (
    <main style={ui.layout.page}>
      <div style={{ maxWidth: "400px", margin: "100px auto" }}>
        <h1 style={ui.layout.sectionTitle}>📚 My Bookshelf</h1>

        <p style={{ marginBottom: "16px" }}>
          利用するにはログインしてください
        </p>

        <button style={ui.button.primary} onClick={handleLogin}>
          Googleでログイン
        </button>
      </div>
    </main>
  );
}

const ALLOWED_EMAIL = "asako.hafs@gmail.com";

if (user.email !== ALLOWED_EMAIL) {
  return (
    <main style={ui.layout.page}>
      <div style={{ maxWidth: "400px", margin: "100px auto" }}>
        <p>このアカウントでは利用できません</p>

        <button style={ui.button.muted} onClick={handleLogout}>
          ログアウト
        </button>
      </div>
    </main>
  );
}

  return (
    <main style={ui.layout.page}>
      <style jsx>{`
        .pageWrap {
          max-width: 820px;
          margin: 0 auto;
        }

        .pageHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .headerButtons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filtersGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .booksGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .bookCard {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .filterBox {
          width: 100%;
        }

        .filterToggleButton {
          display: none;
        }

        @media (max-width: 768px) {
          .pageHeader {
            align-items: flex-start;
          }

          .headerButtons {
            width: 100%;
          }

          .headerButtons :global(a) {
            flex: 1;
            text-align: center;
          }

          .filtersGrid {
            grid-template-columns: 1fr;
          }

          .booksGrid {
            grid-template-columns: 1fr;
          }

          .filterToggleButton {
            display: inline-block;
            width: 100%;
            margin-bottom: 16px;
          }

          .filtersGrid.filtersMobileHidden {
            display: none;
          }

          .filtersGrid.filtersMobileVisible {
            display: grid;
          }
        }
      `}</style>

      <div className="pageWrap">
        <div className="pageHeader">
          <h1 style={ui.layout.sectionTitle}>📚 My Bookshelf</h1>

          <div className="headerButtons">
            <Link
  href="/shelves"
  style={ui.button.secondary}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonSecondary)}
  onMouseLeave={clearHoverStyle}
>
              棚を編集
            </Link>

            <Link
  href="/add"
  style={ui.button.primary}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonPrimary)}
  onMouseLeave={clearHoverStyle}
>
              ＋ 本を追加
            </Link>
            <button
  onClick={handleLogout}
  style={ui.button.muted}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
  onMouseLeave={clearHoverStyle}
>
  ログアウト
</button>
          </div>
        </div>

        <div style={{ marginBottom: "24px", maxWidth: "640px" }}>
          <label htmlFor="searchText" style={ui.input.label}>
            本を検索
          </label>

          <input
            id="searchText"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="タイトル / 著者 / ISBN / 出版社 / メモ / タグ"
            style={ui.input.base}
          />

          <p style={ui.text.helper}>タグで絞り込みできます</p>
        </div>

        <button
  type="button"
  className="filterToggleButton"
  onClick={() => setShowFilters((prev) => !prev)}
  style={ui.button.muted}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
  onMouseLeave={clearHoverStyle}
>
          {showFilters ? "絞り込みを閉じる" : "絞り込みを開く"}
        </button>

        <div
          className={`filtersGrid ${
            showFilters ? "filtersMobileVisible" : "filtersMobileHidden"
          }`}
        >
          <div className="filterBox" style={{ position: "relative" }}>
            <label htmlFor="tagFilter" style={ui.input.label}>
              タグで絞り込み
            </label>

            <input
              id="tagFilter"
              type="text"
              value={tagFilterText}
              onChange={(e) => {
                setTagFilterText(e.target.value);
                setShowTagFilterSuggestions(true);
                if (e.target.value.trim() === "") {
                  setSelectedTag("");
                }
              }}
              onFocus={() => setShowTagFilterSuggestions(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowTagFilterSuggestions(false);
                }, 150);
              }}
              placeholder="タグ名を入力して絞り込み"
              style={ui.input.base}
            />

            {showTagFilterSuggestions &&
              tagFilterText.trim() !== "" &&
              filteredTagOptions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "72px",
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
                  {filteredTagOptions.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleTagClick(tag)}
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

          <div className="filterBox">
            <label htmlFor="shelfFilter" style={ui.input.label}>
              棚で絞り込み
            </label>

            <select
              id="shelfFilter"
              value={selectedShelf || ""}
              onChange={(e) => setSelectedShelf(e.target.value || null)}
              style={ui.input.base}
            >
              <option value="">すべて</option>
              {shelfList.map((shelf) => (
                <option key={shelf} value={shelf}>
                  {shelf}
                </option>
              ))}
            </select>
          </div>

          <div className="filterBox">
            <label htmlFor="statusFilter" style={ui.input.label}>
              ステータスで絞り込み
            </label>

            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={ui.input.base}
            >
              <option value="すべて">すべて</option>
              <option value="未読">未読</option>
              <option value="読書中">読書中</option>
              <option value="読了">読了</option>
            </select>
          </div>

          <div className="filterBox">
            <label htmlFor="ownedFilter" style={ui.input.label}>
              所持で絞り込み
            </label>

            <select
              id="ownedFilter"
              value={selectedOwned}
              onChange={(e) => setSelectedOwned(e.target.value)}
              style={ui.input.base}
            >
              <option value="すべて">すべて</option>
              <option value="所持">所持</option>
              <option value="未所持">未所持</option>
            </select>
          </div>

          <div className="filterBox">
            <label htmlFor="sortOrder" style={ui.input.label}>
              並び替え
            </label>

            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={ui.input.base}
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
              <option value="title">タイトル順</option>
              <option value="finishedDate">読了日順</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h2
            style={{
              marginBottom: "12px",
              color: ui.colors.text,
            }}
          >
            保存した本
          </h2>

          {(selectedShelf ||
            searchText ||
            selectedTag ||
            selectedStatus !== "すべて" ||
            selectedOwned !== "すべて") && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              {selectedShelf && (
                <button
  onClick={() => setSelectedShelf(null)}
  style={ui.button.secondary}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonSecondary)}
  onMouseLeave={clearHoverStyle}
>
                  棚の絞り込みを解除
                </button>
              )}

              {searchText && (
                <button
  onClick={() => setSearchText("")}
  style={ui.button.muted}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
  onMouseLeave={clearHoverStyle}
>
  検索をクリア
</button>
              )}

              {selectedTag && (
                <button
  onClick={() => {
    setSelectedTag("");
    setTagFilterText("");
  }}
  style={ui.button.muted}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
  onMouseLeave={clearHoverStyle}
>
  タグ絞り込みを解除
</button>
              )}

              {selectedStatus !== "すべて" && (
                <button
  onClick={() => setSelectedStatus("すべて")}
  style={ui.button.muted}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
  onMouseLeave={clearHoverStyle}
>
  ステータス絞り込みを解除
</button>
              )}

              {selectedOwned !== "すべて" && (
                <button
  onClick={() => setSelectedOwned("すべて")}
  style={ui.button.muted}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.buttonMuted)}
  onMouseLeave={clearHoverStyle}
>
  所持絞り込みを解除
</button>
              )}
            </div>
          )}

          {!loading && (
            <p style={{ ...ui.text.helper, marginBottom: "16px" }}>
              {filteredBooks.length}冊 表示中
            </p>
          )}

          {loading && <p style={ui.text.helper}>読み込み中...</p>}

          {!loading && filteredBooks.length === 0 && (
            <p style={ui.text.helper}>条件に合う本が見つかりませんでした</p>
          )}

          {!loading && filteredBooks.length > 0 && (
            <div className="booksGrid">
              {filteredBooks.map((book) => (
                <div
  key={book.id}
  className="bookCard"
  style={ui.card.clickable}
  onClick={() => router.push(`/books/${book.id}`)}
  onMouseEnter={(e) => applyHoverStyle(e, hoverStyles.card)}
  onMouseLeave={clearHoverStyle}
>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    {book.image && (
                      <img
                        src={book.image}
                        alt="表紙"
                        style={{
                          width: "72px",
                          minWidth: "72px",
                          borderRadius: "6px",
                          display: "block",
                        }}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={ui.text.title}>{book.title}</p>

                      {book.author && (
                        <p style={ui.text.author}>{book.author}</p>
                      )}

                      {Array.isArray(book.tags) && book.tags.length > 0 && (
                        <p style={ui.text.tagsText}>
                          {book.tags.map((tag) => `#${tag}`).join(" ")}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginTop: "10px",
                        }}
                      >
                        <span style={ui.badge.shelf}>
                          {normalizeShelfName(book.shelf)}
                        </span>

                        <span
                          style={book.owned ? ui.badge.owned : ui.badge.notOwned}
                        >
                          {book.owned ? "所持" : "未所持"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}