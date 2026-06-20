import { NextResponse } from "next/server";
import webpush from "web-push";

interface PushRequestBody {
  senderEmail: string;
  title: string;
  body: string;
  url: string;
  subscriptions: webpush.PushSubscription[];
}

const maxPushRecipients = 25;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!currentUserResponse.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = (await currentUserResponse.json()) as { email?: string };
  const payload = (await request.json()) as Partial<PushRequestBody>;

  if (
    !currentUser.email ||
    currentUser.email.toLowerCase() !== payload.senderEmail?.toLowerCase() ||
    !payload.title ||
    !payload.body ||
    !payload.url ||
    !Array.isArray(payload.subscriptions)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? `mailto:${currentUser.email}`;

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const notification = JSON.stringify({
    title: payload.title.slice(0, 80),
    body: payload.body.slice(0, 180),
    url: payload.url,
  });
  const subscriptions = payload.subscriptions.slice(0, maxPushRecipients);
  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      webpush.sendNotification(subscription, notification),
    ),
  );

  return NextResponse.json({
    delivered: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  });
}
