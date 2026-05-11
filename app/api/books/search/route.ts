import { NextResponse } from "next/server";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  googleUrl.searchParams.set("maxResults", "40");
  googleUrl.searchParams.set("printType", "books");
  googleUrl.searchParams.set("key", apiKey);

  try {
    let response: Response | null = null;
    let data: any = null;

    // 503など一時障害向けに最大3回まで再試行
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(googleUrl.toString(), {
        next: { revalidate: 60 },
      });

      data = await response.json();

      // 成功したら終了
      if (response.ok) {
        return NextResponse.json(data);
      }

      console.warn("Google Books API error:", response.status, data);

      // 429は利用制限なので再試行しない
      if (response.status === 429) {
        break;
      }

      // 503は少し待って再試行
      if (response.status === 503 && attempt < 3) {
        await sleep(1000 * attempt);
        continue;
      }

      break;
    }

    const status = response?.status ?? 500;

    return NextResponse.json(
      {
        error:
          status === 429
            ? "Google Books APIの利用回数が多くなっています。少し時間をおいて再検索してください。"
            : status === 503
            ? "Google Books APIが一時的に不安定です。時間をおいて再検索してください。"
            : "Google Books APIから取得できませんでした。",
        status,
      },
      { status }
    );
  } catch (error) {
    console.error("Google Books API route error:", error);

    return NextResponse.json(
      { error: "Google Books APIへの接続に失敗しました。" },
      { status: 500 }
    );
  }
}