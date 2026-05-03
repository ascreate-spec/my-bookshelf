import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "検索キーワードがありません" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Books APIキーが設定されていません" },
      { status: 500 }
    );
  }

  const googleUrl = new URL("https://www.googleapis.com/books/v1/volumes");

  googleUrl.searchParams.set("q", q.trim());
  googleUrl.searchParams.set("maxResults", "20");
  googleUrl.searchParams.set("printType", "books");
  googleUrl.searchParams.set("key", apiKey);

  try {
    const response = await fetch(googleUrl.toString(), {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("Google Books API error:", response.status, data);

      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "Google Books APIの利用回数が多くなっています。少し時間をおいて再検索してください。"
              : "Google Books APIから取得できませんでした。",
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Books API route error:", error);

    return NextResponse.json(
      { error: "Google Books APIへの接続に失敗しました。" },
      { status: 500 }
    );
  }
}