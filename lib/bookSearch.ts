export type BookSearchItem = {
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  isbn: string;
  thumbnail: string;
  pageCount?: number;
  source: "google" | "google+openbd";
};

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9X]/gi, "").trim().toUpperCase();
}

function normalizeThumbnailUrl(url: string): string {
  if (!url) return "";
  return url.trim().replace(/^http:\/\//i, "https://");
}

function getGoogleIsbn(industryIdentifiers: any[] = []): string {
  const isbn13 =
    industryIdentifiers.find((id) => id?.type === "ISBN_13")?.identifier ?? "";
  const isbn10 =
    industryIdentifiers.find((id) => id?.type === "ISBN_10")?.identifier ?? "";

  return normalizeIsbn(isbn13 || isbn10 || "");
}

function toBookSearchItem(item: any): BookSearchItem {
  const info = item?.volumeInfo ?? {};
  const isbn = getGoogleIsbn(info.industryIdentifiers ?? []);

  const rawThumbnail =
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail ??
    "";

  return {
    title: info.title ?? "",
    authors: Array.isArray(info.authors) ? info.authors : [],
    publisher: info.publisher ?? "",
    publishedDate: info.publishedDate ?? "",
    description: info.description ?? "",
    isbn,
    thumbnail: normalizeThumbnailUrl(rawThumbnail),
    pageCount: info.pageCount,
    source: "google",
  };
}

function buildDedupeKey(book: BookSearchItem): string {
  if (book.isbn) return `isbn:${book.isbn}`;

  const title = (book.title ?? "").trim().toLowerCase();
  const author = (book.authors?.[0] ?? "").trim().toLowerCase();

  return `meta:${title}:${author}`;
}

export async function searchGoogleBooks(
  query: string
): Promise<BookSearchItem[]> {
  const trimmed = query.trim();
  const normalized = trimmed.replace(/-/g, "");
  const isIsbnLike = /^[0-9]{10,13}$/.test(normalized);

  const queries = isIsbnLike
    ? [`isbn:${normalized}`, normalized]
    : [
        trimmed,
        `"${trimmed}"`,
        `intitle:${trimmed}`,
        `inauthor:${trimmed}`,
      ];

  const allItems: BookSearchItem[] = [];
  let apiFailedCount = 0;

  for (const q of queries) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        q
      )}&maxResults=20&printType=books`;

      console.log("Google Books query:", q);
      console.log("Google Books url:", url);

      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        apiFailedCount += 1;
        console.warn("Google Books API failed:", q, res.status, res.statusText);
        continue;
      }

      const data = await res.json();

      console.log("Google Books totalItems:", q, data.totalItems);
      console.log("Google Books items:", q, data.items);

      if (Array.isArray(data.items)) {
        allItems.push(...data.items.map(toBookSearchItem));
      }
    } catch (error) {
      apiFailedCount += 1;
      console.error("Google Books search failed:", q, error);
    }
  }

  if (allItems.length === 0 && apiFailedCount === queries.length) {
    throw new Error("Google Books APIから取得できませんでした");
  }

  const uniqueMap = new Map<string, BookSearchItem>();

  for (const book of allItems) {
    const key = buildDedupeKey(book);

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, book);
    }
  }

  return Array.from(uniqueMap.values());
}

export async function fetchOpenBdByIsbns(
  isbns: string[]
): Promise<Record<string, any>> {
  const cleanIsbns = Array.from(
    new Set(isbns.map(normalizeIsbn).filter(Boolean))
  );

  if (cleanIsbns.length === 0) {
    return {};
  }

  const res = await fetch(
    `https://api.openbd.jp/v1/get?isbn=${cleanIsbns.join(",")}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("openBD APIの取得に失敗しました");
  }

  const data = await res.json();
  const result: Record<string, any> = {};

  cleanIsbns.forEach((isbn, index) => {
    if (data[index]) {
      result[isbn] = data[index];
    }
  });

  return result;
}

function getOpenBdTitle(record: any): string {
  return record?.summary?.title ?? "";
}

function getOpenBdAuthor(record: any): string {
  return record?.summary?.author ?? "";
}

function getOpenBdPublisher(record: any): string {
  return record?.summary?.publisher ?? "";
}

function getOpenBdPubdate(record: any): string {
  return record?.summary?.pubdate ?? "";
}

function getOpenBdCover(record: any): string {
  return record?.summary?.cover ?? "";
}

function getOpenBdDescription(record: any): string {
  const textContents = record?.onix?.CollateralDetail?.TextContent;
  if (!Array.isArray(textContents)) return "";

  const found = textContents.find((t: any) => t?.Text);
  return found?.Text ?? "";
}

function parseOpenBdAuthors(authorText: string): string[] {
  if (!authorText) return [];

  return authorText
    .split(/,|、|\/|／/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mergeBookData(
  googleBooks: BookSearchItem[],
  openBdMap: Record<string, any>
): BookSearchItem[] {
  return googleBooks.map((book) => {
    const normalizedIsbn = normalizeIsbn(book.isbn);
    const openbd = openBdMap[normalizedIsbn];

    if (!openbd) {
      return {
        ...book,
        thumbnail: normalizeThumbnailUrl(book.thumbnail),
      };
    }

    const openBdTitle = getOpenBdTitle(openbd);
    const openBdAuthor = getOpenBdAuthor(openbd);
    const openBdPublisher = getOpenBdPublisher(openbd);
    const openBdPubdate = getOpenBdPubdate(openbd);
    const openBdCover = getOpenBdCover(openbd);
    const openBdDescription = getOpenBdDescription(openbd);

    return {
      ...book,
      title: openBdTitle || book.title,
      authors:
        book.authors.length > 0
          ? book.authors
          : parseOpenBdAuthors(openBdAuthor),
      publisher: openBdPublisher || book.publisher,
      publishedDate: openBdPubdate || book.publishedDate,
      description: openBdDescription || book.description,
      thumbnail: normalizeThumbnailUrl(openBdCover || book.thumbnail),
      source: "google+openbd",
    };
  });
}

export async function searchBooks(query: string): Promise<BookSearchItem[]> {
  const googleBooks = await searchGoogleBooks(query);

  if (googleBooks.length === 0) {
    return [];
  }

  const isbns = googleBooks.map((book) => book.isbn).filter(Boolean);

  try {
    const openBdMap = await fetchOpenBdByIsbns(isbns);
    return mergeBookData(googleBooks, openBdMap);
  } catch (error) {
    console.error("openBD merge failed. Fallback to Google Books only.", error);
    return googleBooks.map((book) => ({
      ...book,
      thumbnail: normalizeThumbnailUrl(book.thumbnail),
    }));
  }
}