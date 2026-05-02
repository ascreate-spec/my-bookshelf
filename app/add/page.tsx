"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import PageHeader from "../../components/PageHeader";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { isAllowedEmail } from "../../lib/authGuard";
import { ui } from "@/lib/ui";
import BottomNav from "../../components/BottomNav";
import { searchBooks, type BookSearchItem } from "../../lib/bookSearch";
import Link from "next/link";

type SavedBookInput = {
  title: string;
  subTitle: string;
  seriesName: string;
  author: string;
  authors: string[];
  publisher: string;
  isbn: string;
  image: string;
  shelf: string;
  status: string;
  finishedDate: string;
  memo: string;
  tags: string[];
  owned: boolean;
  uid: string;
  createdAt: Date;
  updatedAt: Date;
  isEbook: boolean;
};

function normalizeThumbnailUrl(url: string): string {
  if (!url) return "";
  return url.trim().replace(/^http:\/\//i, "https://");
}

export default function AddBookPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [mode, setMode] = useState<"search" | "manual">("search");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BookSearchItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookSearchItem | null>(null);

  const [saving, setSaving] = useState(false);

  const [isEbook, setIsEbook] = useState(false);
  const [owned, setOwned] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState("");

  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [manualIsEbook, setManualIsEbook] = useState(false);
  const [manualOwned, setManualOwned] = useState(false);
  const [manualShelf, setManualShelf] = useState("");

  const [shelfList, setShelfList] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchShelves = async () => {
  if (!user) {
    setShelfList([]);
    return;
  }

  try {
    const q = query(collection(db, "shelves"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    const customShelves = snapshot.docs
      .map((docSnap) => String(docSnap.data().name || "").trim())
      .filter(Boolean);

    const uniqueShelves = Array.from(new Set(customShelves)).sort((a, b) =>
      a.localeCompare(b, "ja")
    );

    setShelfList(uniqueShelves);

    if (uniqueShelves.length > 0) {
      setSelectedShelf((prev) =>
        prev && uniqueShelves.includes(prev) ? prev : ""
      );

      setManualShelf((prev) =>
        prev && uniqueShelves.includes(prev) ? prev : ""
      );
    } else {
      setSelectedShelf("");
      setManualShelf("");
    }
  } catch (error) {
    console.error(error);
    setShelfList([]);
    setSelectedShelf("");
    setManualShelf("");
  }
};

    if (!authLoading) {
      fetchShelves();
    }
  }, [user, authLoading]);

  const handleSearch = async () => {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    alert("タイトル・著者・ISBNなどを入力してください");
    return;
  }

  try {
    setSearchLoading(true);
    setSelectedBook(null);

    const results = await searchBooks(trimmed);
    console.log("検索結果:", results);

    setSearchResults(results);

    if (results.length === 0) {
      alert("本が見つかりませんでした。別のキーワードで検索してください。");
    }
  } catch (error) {
    console.error(error);
    alert("検索に失敗しました");
  } finally {
    setSearchLoading(false);
  }
};

  const handleSave = async () => {
    if (!user) return;
    if (!selectedBook) {
      alert("本を選択してください");
      return;
    }

    try {
      setSaving(true);

      const payload: SavedBookInput = {
        title: selectedBook.title.trim() || "タイトルなし",
        subTitle: "",
        seriesName: "",
        author: selectedBook.authors?.join(", ").trim() || "",
        authors: Array.isArray(selectedBook.authors) ? selectedBook.authors : [],
        publisher: selectedBook.publisher?.trim() || "",
        isbn: selectedBook.isbn?.trim() || "",
        image: normalizeThumbnailUrl(selectedBook.thumbnail || ""),
        shelf: selectedShelf || "未分類",
        status: "未読",
        finishedDate: "",
        memo: "",
        tags: [],
        owned,
        uid: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEbook,
      };

      await addDoc(collection(db, "books"), payload);

      alert("追加しました");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedBook(null);
      setIsEbook(false);
      setOwned(false);
      setSelectedShelf("");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("追加に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!user) return;
    if (!manualTitle.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    try {
      setSaving(true);

      const authorList = manualAuthor
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      const payload: SavedBookInput = {
        title: manualTitle.trim() || "タイトルなし",
        subTitle: "",
        seriesName: "",
        author: manualAuthor.trim(),
        authors: authorList,
        publisher: manualPublisher.trim(),
        isbn: manualIsbn.trim(),
        image: "",
        shelf: manualShelf || "未分類",
        status: "未読",
        finishedDate: "",
        memo: "",
        tags: [],
        owned: manualOwned,
        uid: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEbook: manualIsEbook,
      };

      await addDoc(collection(db, "books"), payload);

      alert("追加しました");
      setManualTitle("");
      setManualAuthor("");
      setManualPublisher("");
      setManualIsbn("");
      setManualIsEbook(false);
      setManualOwned(false);
      setManualShelf("");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("追加に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
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
        <BottomNav />
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
        <BottomNav />
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

        .tabRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
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

        .sectionCard {
          background: ${ui.colors.cardBg};
          border: 1px solid ${ui.colors.border};
          border-radius: 14px;
          padding: 20px;
        }

        .resultList {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

.resultCard {
  position: relative;
  border: 1px solid ${ui.colors.border};
  border-radius: 12px;
  background: ${ui.colors.cardBg};
  padding: 14px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.resultCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(38, 51, 34, 0.1);
}

.resultCardSelected {
  background: ${ui.colors.selectedBg};
  border-color: ${ui.colors.selectedBorder};
  box-shadow: 0 0 0 2px rgba(75, 107, 70, 0.14);
}

        .selectedArea {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid ${ui.colors.borderSoft};
        }

        .bookRow {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 16px;
          align-items: start;
        }

        .manualGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .sectionCard {
            padding: 16px;
          }

          .bookRow {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={ui.addPage.pageWrap}>

        <PageHeader title="本を追加" backHref="/" />
        <p style={ui.layout.sectionDescription}>
          検索して追加、または手動で追加できます
        </p>

        <div style={ui.addPage.tabRow}>
          <button
  type="button"
  style={{
    ...ui.addPage.tabButton,
    ...(mode === "search" ? ui.addPage.tabButtonActive : {}),
  }}
  onClick={() => setMode("search")}
>
            検索して追加
          </button>

          <button
  type="button"
  style={{
    ...ui.addPage.tabButton,
    ...(mode === "manual" ? ui.addPage.tabButtonActive : {}),
  }}
  onClick={() => setMode("manual")}
>
            手動で追加
          </button>
        </div>

        {mode === "search" ? (
          <div className="sectionCard" style={ui.addPage.sectionCard}>
            <label style={ui.input.label}>タイトル・著者・ISBN で検索</label>

<div style={ui.addPage.searchRow}>

  <div style={ui.addPage.searchInputWrap}>

    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSearch();
        }
      }}
      placeholder="本を検索"
      style={{
  ...ui.input.base,
  padding: searchQuery ? "12px 40px 12px 12px" : "12px",
}}
    />

    {searchQuery && (
      <button
        type="button"
        onClick={() => {
          setSearchQuery("");
          setSearchResults([]);
          setSelectedBook(null);
        }}
        aria-label="検索文字を消す"
        style={ui.addPage.clearButton}
      >
        ×
      </button>
    )}
  </div>

  <button
    type="button"
    onClick={() => handleSearch()}
    disabled={searchLoading}
    style={ui.button.primary}
  >
    {searchLoading ? "検索中..." : "検索"}
  </button>
</div>

            {searchResults.length > 0 && (
              <div style={ui.addPage.resultList}>
                {searchResults.map((result, index) => {
  const isSelected =
    selectedBook?.isbn === result.isbn &&
    selectedBook?.title === result.title;

  return (
    <div
  key={`${result.isbn || result.title}-${index}`}
  className="resultCard"
  style={{
    ...ui.addPage.resultCard,
    ...(isSelected ? ui.addPage.resultCardSelected : {}),
  }}
  onClick={() => setSelectedBook(result)}
>
                    <div style={ui.addPage.resultCardInner}>
                      {normalizeThumbnailUrl(result.thumbnail) ? (
                        <img
                          src={normalizeThumbnailUrl(result.thumbnail)}
                          alt={result.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          style={ui.addPage.resultCover}
                        />
                      ) : (
                        <div
                          style={{
                            width: "72px",
                            height: "108px",
                            borderRadius: "6px",
                            background: ui.colors.inputDisabledBg,
                            color: ui.colors.placeholder,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                        >
                          表紙
                        </div>
                      )}

                      <div>
                        <p style={ui.text.title}>{result.title}</p>
                        {result.authors?.length > 0 && (
                          <p style={ui.text.author}>{result.authors.join(", ")}</p>
                        )}
                        {result.publisher && (
                          <p style={ui.text.helper}>{result.publisher}</p>
                        )}
                        {result.isbn && (
                          <p style={ui.text.helper}>ISBN: {result.isbn}</p>
                        )}
                      </div>
                    </div>
                      </div>
  );
})}
              </div>
            )}

            {selectedBook && (
              <div style={ui.addPage.selectedArea}>
                <p style={ui.addPage.selectedTitle}>
                  選択中の本
                </p>

                <div className="bookRow" style={ui.addPage.bookRow}>
                  <div>
                    {normalizeThumbnailUrl(selectedBook.thumbnail) ? (
                      <img
  src={normalizeThumbnailUrl(selectedBook.thumbnail)}
  alt={selectedBook.title}
  className="h-full w-full object-cover"
  loading="lazy"
  style={ui.addPage.selectedCover}
/>
                    ) : (
                      <div
                        style={ui.addPage.selectedCoverPlaceholder}
                      >
                        画像なし
                      </div>
                    )}
                  </div>

                  <div>
                    <p style={ui.text.title}>{selectedBook.title}</p>
                    {selectedBook.authors?.length > 0 && (
                      <p style={ui.text.author}>{selectedBook.authors.join(", ")}</p>
                    )}
                    {selectedBook.publisher && (
                      <p style={ui.text.helper}>出版社: {selectedBook.publisher}</p>
                    )}
                    {selectedBook.isbn && (
                      <p style={ui.text.helper}>ISBN: {selectedBook.isbn}</p>
                    )}

                    <label style={ui.input.label}>棚</label>
                    <select
                      value={selectedShelf}
                      onChange={(e) => setSelectedShelf(e.target.value)}
                      style={ui.input.base}
                    >
                      <option value="">未分類</option>
                      {shelfList
                        .filter((shelf) => shelf !== "未分類")
                        .map((shelf) => (
                          <option key={shelf} value={shelf}>
                            {shelf}
                          </option>
                        ))}
                    </select>

                    <label style={ui.addPage.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={owned}
                        onChange={(e) => setOwned(e.target.checked)}
                      />
                      所持
                    </label>

                    <label style={ui.addPage.checkboxLabelNoMargin}>
                      <input
                        type="checkbox"
                        checked={isEbook}
                        onChange={(e) => setIsEbook(e.target.checked)}
                      />
                      電子書籍
                    </label>

                    <div style={ui.addPage.actionArea}>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        style={ui.button.primary}
                      >
                        {saving ? "追加中..." : "追加する"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sectionCard" style={ui.addPage.sectionCard}>
            <div style={ui.addPage.manualGrid}>
              <div>
                <label style={ui.input.label}>タイトル</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  style={ui.input.base}
                />
              </div>

              <div>
                <label style={ui.input.label}>著者</label>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  style={ui.input.base}
                />
              </div>

              <div>
                <label style={ui.input.label}>出版社</label>
                <input
                  type="text"
                  value={manualPublisher}
                  onChange={(e) => setManualPublisher(e.target.value)}
                  style={ui.input.base}
                />
              </div>

              <div>
                <label style={ui.input.label}>ISBN</label>
                <input
                  type="text"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  style={ui.input.base}
                />
              </div>

              <div>
                <label style={ui.input.label}>棚</label>
                  <select
                    value={manualShelf}
                    onChange={(e) => setManualShelf(e.target.value)}
                    style={ui.input.base}
                  >
                    <option value="">未分類</option>
                    {shelfList
                      .filter((shelf) => shelf !== "未分類")
                      .map((shelf) => (
                        <option key={shelf} value={shelf}>
                          {shelf}
                        </option>
                      ))}
                  </select>
              </div>

              <div>
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
                    checked={manualOwned}
                    onChange={(e) => setManualOwned(e.target.checked)}
                  />
                  所持
                </label>
              </div>

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: ui.colors.text,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={manualIsEbook}
                    onChange={(e) => setManualIsEbook(e.target.checked)}
                  />
                  電子書籍
                </label>
              </div>

              <div style={ui.addPage.manualActionArea}>
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={saving}
                  style={ui.button.primary}
                >
                  {saving ? "追加中..." : "追加する"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}