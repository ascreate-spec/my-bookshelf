"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "../../lib/ui";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { searchBooks, BookSearchItem } from "@/lib/bookSearch";
import BottomNav from "../../components/BottomNav";
import { isAllowedEmail } from "../../lib/authGuard";

function normalizeThumbnailUrl(url: string): string {
  if (!url) return "";
  return url.trim().replace(/^http:\/\//i, "https://");
}

type BookInfo = BookSearchItem;

export default function AddBookPage() {
  const [keyword, setKeyword] = useState("");
  const [book, setBook] = useState<BookInfo | null>(null);
  const [message, setMessage] = useState("");
  const [searchResults, setSearchResults] = useState<BookInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthors, setManualAuthors] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");

  const [subTitle, setSubTitle] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [isEbook, setIsEbook] = useState(false);

  const [manualSubTitle, setManualSubTitle] = useState("");
  const [manualSeriesName, setManualSeriesName] = useState("");
  const [manualIsEbook, setManualIsEbook] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  

  const ensureTagsExist = async (uid: string, tags: string[]) => {
  const normalizedTags = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "")
    )
  );

  if (normalizedTags.length === 0) return;

  const q = query(
    collection(db, "tags"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);

  const existingTagNames = snapshot.docs.map((docSnap) =>
    String(docSnap.data().name || "").trim().toLowerCase()
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

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setAuthLoading(false);
  });

  return () => unsubscribe();
}, []);

  const normalizeIsbn = (isbn: string) => {
  return isbn.replace(/[^0-9X]/gi, "").trim();
};

const isDuplicateIsbn = async (isbn: string) => {
  if (!user) return false;

  const normalized = normalizeIsbn(isbn);
  if (!normalized) return false;

  const q = query(
    collection(db, "books"),
    where("uid", "==", user.uid),
    where("isbn", "==", normalized),
    limit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

  const handleSearch = async () => {
  const trimmed = keyword.trim();

  if (!trimmed) {
    setMessage("ISBN、タイトル、作者のいずれかを入力してください");
    setSearchResults([]);
    setBook(null);
    setSelectedIndex(null);
    return;
  }

  if (searching) return;

  setSearching(true);
  setSelectedIndex(null);
  setMessage("検索中...");
  setBook(null);
  setSearchResults([]);

  try {
    const results = await searchBooks(trimmed);

    if (results.length === 0) {
      setMessage("本が見つかりませんでした");
      return;
    }

    setSearchResults(results);
    setMessage("候補を選んで保存してください");
  } catch (error) {
    console.error(error);
    setMessage("検索に失敗しました");
  } finally {
    setSearching(false);
  }
};

  const handleSave = async () => {
  if (!book) return;

  if (!user) {
    setMessage("ログインしてください");
    return;
  }

  try {
    setSaving(true);

    const normalizedIsbn = normalizeIsbn(book.isbn || "");

    if (normalizedIsbn) {
      const exists = await isDuplicateIsbn(normalizedIsbn);

      if (exists) {
        setMessage("同じISBNの本はすでに登録されています");
        return;
      }
    }

    await addDoc(collection(db, "books"), {
  isbn: normalizedIsbn,
  title: book.title,
  subTitle: subTitle.trim(),
  seriesName: seriesName.trim(),
  isEbook,
  author: book.authors.length > 0 ? book.authors.join(", ") : "",
  authors: book.authors,
  publisher: book.publisher,
  image: normalizeThumbnailUrl(book.thumbnail || ""),
  shelf: "未分類",
  status: "未読",
  finishedDate: "",
  memo: "",
  tags: [],
  owned: false,
  uid: user.uid,
  createdAt: new Date(),
});

    setMessage("追加しました！");
    setTimeout(() => {
      router.push("/");
    }, 500);

    setBook(null);
    setKeyword("");
    setSearchResults([]);
    setSelectedIndex(null);
    setSubTitle("");
    setSeriesName("");
    setIsEbook(false);

  } catch (error) {
    console.error(error);
    setMessage("保存に失敗しました");
  } finally {
    setSaving(false);
  }
};

  const handleManualSave = async () => {
  if (!manualTitle.trim()) {
    setMessage("タイトルは必須です");
    return;
  }

  if (!user) {
    setMessage("ログインしてください");
    return;
  }

  try {
    const normalizedIsbn = normalizeIsbn(manualIsbn);

    if (normalizedIsbn) {
      const exists = await isDuplicateIsbn(normalizedIsbn);

      if (exists) {
        setMessage("同じISBNの本はすでに登録されています");
        return;
      }
    }

    await addDoc(collection(db, "books"), {
  isbn: normalizedIsbn,
  title: manualTitle.trim(),
  subTitle: manualSubTitle.trim(),
  seriesName: manualSeriesName.trim(),
  isEbook: manualIsEbook,
  author: manualAuthors.trim(),
  authors: manualAuthors
    ? manualAuthors.split(",").map((a) => a.trim())
    : [],
  publisher: manualPublisher.trim(),
  image: "",
  shelf: "未分類",
  status: "未読",
  finishedDate: "",
  memo: "",
  tags: [],
  owned: false,
  uid: user.uid,
  createdAt: new Date(),
  isManual: true,
});

    setMessage("追加しました！");
    setTimeout(() => {
      router.push("/");
    }, 500);

    setManualTitle("");
    setManualAuthors("");
    setManualPublisher("");
    setManualIsbn("");
    setManualSubTitle("");
    setManualSeriesName("");
    setManualIsEbook(false);

  } catch (error) {
    console.error(error);
    setMessage("保存に失敗しました");
  }
};

if (authLoading) {
  return (
    <main
      style={{
        ...ui.layout.page,
        paddingBottom: "96px",
      }}
    >
      <div style={{ maxWidth: "400px", margin: "100px auto" }}>
        <p style={ui.text.helper}>認証確認中...</p>
      </div>
    </main>
  );
}

if (!user) {
  return (
    <main
      style={{
        ...ui.layout.page,
        paddingBottom: "96px",
      }}
    >
      <div style={{ maxWidth: "400px", margin: "100px auto" }}>
        <p style={ui.text.helper}>ログインしてください</p>
      </div>
    </main>
  );
}

if (!isAllowedEmail(user.email)) {
  return (
    <main
      style={{
        ...ui.layout.page,
        paddingBottom: "96px",
      }}
    >
      <div style={{ maxWidth: "400px", margin: "100px auto" }}>
        <p>このアカウントでは利用できません</p>

        <button style={ui.button.muted} onClick={async () => await signOut(auth)}>
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

        .searchArea,
        .manualArea,
        .selectedArea {
          background: ${ui.colors.cardBg};
          border: 1px solid ${ui.colors.border};
          border-radius: 14px;
          padding: 18px;
        }

        .resultsList {
          margin-top: 24px;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .resultCard {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          margin-top: 12px;
          cursor: pointer;
          background: ${ui.colors.cardBg};
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .resultCard:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${ui.colors.shadow};
        }

        .twoColumn {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
          margin-top: 28px;
        }

        @media (max-width: 768px) {
          .twoColumn {
            grid-template-columns: 1fr;
          }

          .resultCard {
            align-items: flex-start;
          }

          .actionButton {
            width: 100%;
          }
        }
      `}</style>

      <div className="pageWrap">

        <h1 style={ui.layout.sectionTitle}>本を追加</h1>
        <p style={ui.layout.sectionDescription}>
          ISBN・タイトル・作者で検索して追加します
        </p>

        <div className="searchArea">
          <label htmlFor="keyword" style={ui.input.label}>
            キーワード
          </label>

          <div style={{ position: "relative", marginBottom: "16px" }}>
  <input
    id="keyword"
    type="text"
    value={keyword}
    onChange={(e) => setKeyword(e.target.value)}
    placeholder="ISBN / タイトル / 作者 で検索"
    style={{
      ...ui.input.base,
      marginBottom: 0,
      paddingRight: "36px",
    }}
    onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSearch();
  }
}}
  />

  {keyword && (
    <button
      type="button"
      onClick={() => setKeyword("")}
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

          <button
  onClick={handleSearch}
  disabled={searching}
  className="actionButton"
  style={{
    ...ui.button.primary,
    opacity: searching ? 0.7 : 1,
    cursor: searching ? "not-allowed" : "pointer",
  }}
>
  {searching ? "検索中..." : "検索"}
</button>

          {message && (
            <p
              style={{
                marginTop: "16px",
                color: ui.colors.text,
                lineHeight: 1.6,
              }}
            >
              {message}
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="resultsList">
              <h2
                style={{
                  marginBottom: "8px",
                  color: ui.colors.text,
                  fontSize: "22px",
                }}
              >
                検索結果
              </h2>

              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => {
  setBook(result);
  setSelectedIndex(index);
  setSubTitle("");
  setSeriesName("");
  setIsEbook(false);
}}
                  className="resultCard"
                  onMouseEnter={(e) => {
  Object.assign(e.currentTarget.style, ui.card.hover);
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "";
  e.currentTarget.style.boxShadow = "";
}}
                  style={{
                    border:
                      selectedIndex === index
                        ? `2px solid ${ui.colors.selectedBorder}`
                        : `1px solid ${ui.colors.border}`,
                    background:
                      selectedIndex === index
                        ? ui.colors.selectedBg
                        : ui.colors.cardBg,
                  }}
                >
                  {result.thumbnail && (
  <img
    src={normalizeThumbnailUrl(result.thumbnail)}
    alt="表紙"
    style={{
      width: "60px",
      minWidth: "60px",
      height: "auto",
      objectFit: "contain",
      borderRadius: "6px",
      display: "block",
      alignSelf: "flex-start",
    }}
  />
)}
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        ...ui.text.title,
                        fontSize: "16px",
                      }}
                    >
                      {result.title}
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: ui.colors.subText,
                        fontSize: "14px",
                        wordBreak: "break-word",
                      }}
                    >
                      {result.authors.length > 0
                        ? result.authors.join(", ")
                        : "著者なし"}
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: ui.colors.subText,
                        fontSize: "14px",
                      }}
                    >
                      ISBN: {result.isbn || "なし"}
                    </p>
                    <p
  style={{
    margin: "4px 0 0 0",
    color: "#888",
    fontSize: "12px",
  }}
>
  {result.source === "google+openbd"
    ? "Google + openBD"
    : "Google Books"}
</p>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="twoColumn">
          {book ? (
            <div className="selectedArea">
              {book.thumbnail && (
  <img
    src={normalizeThumbnailUrl(book.thumbnail)}
                  alt="表紙"
                  style={{
                    width: "120px",
                    maxWidth: "100%",
                    marginBottom: "16px",
                    borderRadius: "8px",
                  }}
                />
              )}

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  color: ui.colors.text,
                  wordBreak: "break-word",
                  lineHeight: 1.5,
                }}
              >
                {book.title}
              </h2>

              <p
                style={{
                  margin: "0 0 8px 0",
                  color: ui.colors.text,
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                }}
              >
                <strong>著者:</strong>{" "}
                {book.authors.length > 0 ? book.authors.join(", ") : "なし"}
              </p>

              <p
                style={{
                  margin: "0 0 8px 0",
                  color: ui.colors.text,
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                }}
              >
                <strong>出版社:</strong> {book.publisher}
              </p>

              <p
                style={{
                  margin: "0 0 8px 0",
                  color: ui.colors.text,
                  lineHeight: 1.7,
                }}
              >
                <strong>ISBN:</strong> {book.isbn || "なし"}
              </p>

              <label style={ui.input.label}>サブタイトル</label>
<input
  type="text"
  value={subTitle}
  onChange={(e) => setSubTitle(e.target.value)}
  style={{ ...ui.input.base, marginBottom: "12px" }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }}
/>

<label style={ui.input.label}>シリーズ名</label>
<input
  type="text"
  value={seriesName}
  onChange={(e) => setSeriesName(e.target.value)}
  style={{ ...ui.input.base, marginBottom: "12px" }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }}
/>

<label
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
    color: ui.colors.text,
  }}
>
  <input
    type="checkbox"
    checked={isEbook}
    onChange={(e) => setIsEbook(e.target.checked)}
  />
  電子書籍
</label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="actionButton"
                style={{ ...ui.button.primary, marginTop: "16px" }}
              >
                {saving ? "保存中..." : "追加する"}
              </button>
            </div>
          ) : (
            <div
              className="selectedArea"
              style={{
                color: ui.colors.subText,
                display: "flex",
                alignItems: "center",
                lineHeight: 1.7,
              }}
            >
              検索結果から本を選ぶと、ここに詳細が表示されます
            </div>
          )}

          <div className="manualArea">
            <h2
              style={{
                marginTop: 0,
                marginBottom: "8px",
                color: ui.colors.text,
                fontSize: "22px",
              }}
            >
              手動で追加
            </h2>

            <p
              style={{
                color: ui.colors.subText,
                marginBottom: "16px",
                lineHeight: 1.6,
              }}
            >
              検索で見つからない本はこちらから登録できます
            </p>

            <label style={ui.input.label}>タイトル</label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleManualSave();
  }
}}
            />

            <label style={ui.input.label}>サブタイトル</label>
<input
  type="text"
  value={manualSubTitle}
  onChange={(e) => setManualSubTitle(e.target.value)}
  style={{ ...ui.input.base, marginBottom: "12px" }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleManualSave();
    }
  }}
/>

            <label style={ui.input.label}>著者</label>
            <input
              type="text"
              value={manualAuthors}
              onChange={(e) => setManualAuthors(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleManualSave();
  }
}}
            />

            <label style={ui.input.label}>出版社</label>
            <input
              type="text"
              value={manualPublisher}
              onChange={(e) => setManualPublisher(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleManualSave();
  }
}}
            />
            <label style={ui.input.label}>シリーズ名</label>
<input
  type="text"
  value={manualSeriesName}
  onChange={(e) => setManualSeriesName(e.target.value)}
  style={{ ...ui.input.base, marginBottom: "12px" }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleManualSave();
    }
  }}
/>

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
    checked={manualIsEbook}
    onChange={(e) => setManualIsEbook(e.target.checked)}
  />
  電子書籍
</label>


            <label style={ui.input.label}>ISBN（任意）</label>
            <input
              type="text"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleManualSave();
  }
}}
            />

            <button
              onClick={handleManualSave}
              className="actionButton"
              style={{ ...ui.button.primary, marginTop: "8px" }}
            >
              手動で追加
            </button>
          </div>
        </div>
      </div>
    <BottomNav />
    </main>
  );
}