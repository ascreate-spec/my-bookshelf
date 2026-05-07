"use client";

import { useEffect, useRef, useState } from "react";
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
import { FavoriteIcon } from "../../components/icons";
import BarcodeScanner from "../../components/BarcodeScanner";

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
  isFavorite: boolean;
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
  const searchInFlightRef = useRef(false);

  const [searchResults, setSearchResults] = useState<BookSearchItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookSearchItem | null>(null);

  const [searchMessage, setSearchMessage] = useState("");
  const [lastSearch, setLastSearch] = useState<{
    query: string;
    time: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  const [isEbook, setIsEbook] = useState(false);
  const [owned, setOwned] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("未読");
  const [isFavorite, setIsFavorite] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [manualStatus, setManualStatus] = useState("未読");
  const [manualTags, setManualTags] = useState("");
  const [manualIsFavorite, setManualIsFavorite] = useState(false);

  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [manualIsEbook, setManualIsEbook] = useState(false);
  const [manualOwned, setManualOwned] = useState(false);
  const [manualShelf, setManualShelf] = useState("");

  const [shelfList, setShelfList] = useState<string[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

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

  
  const handleSearch = async (overrideQuery?: string) => {
    const trimmed = (overrideQuery ?? searchQuery).trim();

  if (searchInFlightRef.current) {
    return;
  }

  if (!trimmed) {
    setSearchMessage("タイトル・著者・ISBNなどを入力してください。");
    return;
  }

  const now = Date.now();

  if (
    lastSearch &&
    lastSearch.query === trimmed &&
    now - lastSearch.time < 10000
  ) {
    setSearchMessage(
      "同じキーワードで続けて検索しています。少し待ってから再検索してください。"
    );
    return;
  }

  try {
    searchInFlightRef.current = true;
    setSearchLoading(true);
    setSearchMessage("");
    setSelectedBook(null);
    setSearchResults([]);
    setLastSearch({ query: trimmed, time: now });

    const results = await searchBooks(trimmed);
    console.log("検索結果:", results);

    setSearchResults(results);

    if (results.length === 0) {
      setSearchMessage(
        "本が見つからないか、Google Books APIが一時的に制限されています。少し時間をおいて再検索してください。"
      );
    }
  } catch (error) {
    console.error(error);
    setSearchMessage(
      "検索に失敗しました。少し時間をおいてから再検索してください。"
    );
  } finally {
    searchInFlightRef.current = false;
    setSearchLoading(false);
  }
};
    
  const handleBarcodeDetected = async (text: string) => {
  const code = text.replace(/[^0-9Xx]/g, "");

  const isIsbn13 = /^97[89]\d{10}$/.test(code);
  const isIsbn10 = /^\d{9}[\dXx]$/.test(code);

  setShowBarcodeScanner(false);

  if (!isIsbn13 && !isIsbn10) {
    alert(
      `ISBNではないバーコードを読み取りました。\n読み取った値: ${code}\n\nISBNバーコードは通常 978 または 979 で始まります。`
    );
    return;
  }

  setSearchQuery(code);
  await handleSearch(code);
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
        status: selectedStatus,
        finishedDate: selectedStatus === "読了" ? new Date().toISOString().slice(0, 10) : "",
        memo: "",
        tags: tagInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        owned,
        uid: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEbook,
        isFavorite,
      };

      await addDoc(collection(db, "books"), payload);

      alert("追加しました");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedBook(null);
      setIsEbook(false);
      setOwned(false);
      setSelectedShelf("");
      setSelectedStatus("未読");
      setIsFavorite(false);
      setTagInput("");
      setShowBarcodeScanner(false);
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
        status: manualStatus,
        finishedDate:
          manualStatus === "読了"
            ? new Date().toISOString().slice(0, 10)
            : "",
        memo: "",
        tags: manualTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        owned: manualOwned,
        uid: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEbook: manualIsEbook,
        isFavorite: manualIsFavorite,
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
      setShowBarcodeScanner(false);
    } catch (error) {
      console.error(error);
      alert("追加に失敗しました");
    } finally {
      setSaving(false);
      setManualStatus("未読");
      setManualTags("");
      setManualIsFavorite(false);
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

        .bottomSheetBackdrop {
  position: fixed;
  inset: 0;
  background: rgba(38, 51, 34, 0.24);
  z-index: 3000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.bottomSheet {
  width: 100%;
  max-width: 760px;
  max-height: 86vh;
  overflow-y: auto;
  background: ${ui.colors.cardBg};
  border-radius: 20px 20px 16px 16px;
  padding: 18px;
  box-shadow: 0 -8px 28px rgba(38, 51, 34, 0.18);
}

.bottomSheetHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.bottomSheetTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: ${ui.colors.text};
}

.bottomSheetClose {
  border: none;
  background: ${ui.colors.hoverBg};
  color: ${ui.colors.text};
  width: 36px;
  height: 36px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 768px) {
  .bottomSheetBackdrop {
    padding: 0;
  }

  .bottomSheet {
    max-height: 88vh;
    border-radius: 18px 18px 0 0;
    padding: 16px;
  }
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

      if (!searchLoading) {
        handleSearch();
      }
    }
  }}
  autoComplete="off"
  autoCorrect="off"
  spellCheck={false}
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
          setSearchMessage("");
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
    disabled={searchLoading || !searchQuery.trim()}
    style={ui.button.primary}
  >
    {searchLoading ? "検索中..." : "検索"}
  </button>
</div>

<button
  type="button"
  onClick={() => setShowBarcodeScanner(true)}
  style={{
    ...ui.button.muted,
    marginTop: "10px",
    width: "100%",
  }}
>
  バーコードを読み取る
</button>

{searchMessage && (
  <p
    style={{
      marginTop: "12px",
      color: ui.colors.subText,
      fontSize: "14px",
      lineHeight: 1.7,
    }}
  >
    {searchMessage}
  </p>
)}

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
  onClick={() => {
  setSelectedBook(result);
  setSelectedStatus("未読");
  setIsFavorite(false);
  setTagInput("");
}}
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
  <div
    className="bottomSheetBackdrop"
    onClick={() => setSelectedBook(null)}
  >
    <div
      className="bottomSheet"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bottomSheetHeader">
        <p className="bottomSheetTitle">選択中の本</p>

        <button
          type="button"
          className="bottomSheetClose"
          onClick={() => setSelectedBook(null)}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

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
            <div style={ui.addPage.selectedCoverPlaceholder}>
              画像なし
            </div>
          )}
        </div>

        <div>
          <p style={ui.text.title}>{selectedBook.title}</p>

          {selectedBook.authors?.length > 0 && (
            <p style={ui.text.author}>
              {selectedBook.authors.join(", ")}
            </p>
          )}

          {selectedBook.publisher && (
            <p style={ui.text.helper}>
              出版社: {selectedBook.publisher}
            </p>
          )}

          {selectedBook.isbn && (
            <p style={ui.text.helper}>
              ISBN: {selectedBook.isbn}
            </p>
          )}

          <label style={ui.input.label}>ステータス</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={ui.input.base}
          >
            <option value="未読">未読</option>
            <option value="読書中">読書中</option>
            <option value="読了">読了</option>
          </select>

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

          <label style={ui.input.label}>タグ</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            autoComplete="off"
            style={ui.input.base}
          />

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

<button
  type="button"
  onClick={() => setIsFavorite((prev) => !prev)}
  style={{
  ...ui.favoriteButton.base,
  ...(isFavorite ? ui.favoriteButton.active : ui.favoriteButton.inactive),
  marginTop: "12px",
}}
  aria-pressed={isFavorite}
>
  <FavoriteIcon filled={isFavorite} size={18} />
  お気に入り
</button>

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

              <label style={ui.input.label}>ステータス</label>
<select
  value={manualStatus}
  onChange={(e) => setManualStatus(e.target.value)}
  style={ui.input.base}
>
  <option value="未読">未読</option>
  <option value="読書中">読書中</option>
  <option value="読了">読了</option>
</select>

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
<label style={ui.input.label}>タグ</label>
<input
  type="text"
  value={manualTags}
  onChange={(e) => setManualTags(e.target.value)}
  autoComplete="off"
  style={ui.input.base}
/>
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
              <button
  type="button"
  onClick={() => setManualIsFavorite((prev) => !prev)}
  style={{
    ...ui.favoriteButton.base,
    ...(manualIsFavorite
      ? ui.favoriteButton.active
      : ui.favoriteButton.inactive),
    marginTop: "12px",
  }}
  aria-pressed={manualIsFavorite}
>
  <FavoriteIcon filled={manualIsFavorite} size={18} />
  お気に入り
</button>

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

      {showBarcodeScanner && (
  <BarcodeScanner
    onDetected={handleBarcodeDetected}
    onClose={() => setShowBarcodeScanner(false)}
  />
)}
    </main>
  );
}