"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ui, applyHoverStyle, clearHoverStyle, hoverStyles } from "../../lib/ui";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

type BookInfo = {
  title: string;
  authors: string[];
  publisher: string;
  image?: string;
  isbn?: string;
};

export default function AddBookPage() {
  const [keyword, setKeyword] = useState("");
  const [book, setBook] = useState<BookInfo | null>(null);
  const [message, setMessage] = useState("");
  const [searchResults, setSearchResults] = useState<BookInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthors, setManualAuthors] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe();
}, []);

  const handleSearch = async () => {
    const trimmed = keyword.trim();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    if (!trimmed) {
      setMessage("ISBN、タイトル、作者のいずれかを入力してください");
      setSearchResults([]);
      setBook(null);
      setSelectedIndex(null);
      return;
    }

    setSelectedIndex(null);
    setMessage("検索中...");
    setBook(null);
    setSearchResults([]);

    try {
      const normalized = trimmed.replace(/-/g, "");
      const isIsbnLike = /^[0-9]{10,13}$/.test(normalized);

      const queries = isIsbnLike
        ? [`isbn:${normalized}`, trimmed]
        : [trimmed, `intitle:${trimmed}`, `inauthor:${trimmed}`];

      let foundItems: any[] = [];

      for (const q of queries) {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=15&key=${apiKey}`
        );

        if (!res.ok) {
          continue;
        }

        const data = await res.json();

        if (Array.isArray(data.items) && data.items.length > 0) {
          foundItems = data.items;
          break;
        }
      }

      if (foundItems.length === 0) {
        setMessage("本が見つかりませんでした");
        return;
      }

      const results: BookInfo[] = foundItems.slice(0, 15).map((item: any) => {
        const info = item.volumeInfo || {};

        const isbn13 =
          info.industryIdentifiers?.find(
            (identifier: any) => identifier.type === "ISBN_13"
          )?.identifier || "";

        const isbn10 =
          info.industryIdentifiers?.find(
            (identifier: any) => identifier.type === "ISBN_10"
          )?.identifier || "";

        return {
          title: info.title || "タイトルなし",
          authors: info.authors || [],
          publisher: info.publisher || "出版社なし",
          image: info.imageLinks?.thumbnail || "",
          isbn: isbn13 || isbn10 || "",
        };
      });

      setSearchResults(results);
      setMessage("候補を選んで保存してください");
    } catch (error) {
      console.error(error);
      setMessage("検索に失敗しました");
    }
  };

  const handleSave = async () => {
    if (!book) return;

    try {
      setSaving(true);

      await addDoc(collection(db, "books"), {
        isbn: book.isbn || "",
        title: book.title,
        author: book.authors.length > 0 ? book.authors.join(", ") : "",
        authors: book.authors,
        publisher: book.publisher,
        image: book.image || "",
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

    try {
      await addDoc(collection(db, "books"), {
        isbn: manualIsbn.trim(),
        title: manualTitle.trim(),
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
    } catch (error) {
      console.error(error);
      setMessage("保存に失敗しました");
    }
  };

  return (
    <main style={ui.layout.page}>
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
        <Link href="/" style={{ ...ui.button.secondary, display: "inline-block", marginBottom: "20px" }}>
          ← 戻る
        </Link>

        <h1 style={ui.layout.sectionTitle}>本を追加</h1>
        <p style={ui.layout.sectionDescription}>
          ISBN・タイトル・作者で検索して追加します
        </p>

        <div className="searchArea">
          <label htmlFor="keyword" style={ui.input.label}>
            キーワード
          </label>

          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ISBN / タイトル / 作者 で検索"
            style={{ ...ui.input.base, marginBottom: "16px" }}
          />

          <button
            onClick={handleSearch}
            className="actionButton"
            style={ui.button.primary}
          >
            検索
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
                  {result.image && (
                    <img
                      src={result.image}
                      alt="表紙"
                      style={{
                        width: "60px",
                        minWidth: "60px",
                        borderRadius: "6px",
                        display: "block",
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="twoColumn">
          {book ? (
            <div className="selectedArea">
              {book.image && (
                <img
                  src={book.image}
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

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "12px",
                }}
              >
                <span style={ui.badge.shelf}>未分類</span>
                <span style={ui.badge.notOwned}>未所持</span>
              </div>

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
            />

            <label style={ui.input.label}>著者</label>
            <input
              type="text"
              value={manualAuthors}
              onChange={(e) => setManualAuthors(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
            />

            <label style={ui.input.label}>出版社</label>
            <input
              type="text"
              value={manualPublisher}
              onChange={(e) => setManualPublisher(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
            />

            <label style={ui.input.label}>ISBN（任意）</label>
            <input
              type="text"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              style={{ ...ui.input.base, marginBottom: "12px" }}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "12px",
              }}
            >
              <span style={ui.badge.shelf}>未分類</span>
              <span style={ui.badge.notOwned}>未所持</span>
            </div>
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
    </main>
  );
}