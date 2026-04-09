import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { name, phone, ageGroup, interest, utmSource, utmMedium, utmCampaign } = body;

  if (!name || name.length < 2 || name.length > 20) {
    return NextResponse.json({ error: "이름을 2~20자로 입력해주세요." }, { status: 400 });
  }
  const cleaned = phone?.replace(/[^0-9]/g, "");
  if (!cleaned || !/^01[016789]\d{7,8}$/.test(cleaned)) {
    return NextResponse.json({ error: "올바른 전화번호를 입력해주세요." }, { status: 400 });
  }
  if (!ageGroup) {
    return NextResponse.json({ error: "연령대를 선택해주세요." }, { status: 400 });
  }
  if (!interest) {
    return NextResponse.json({ error: "관심 분야를 선택해주세요." }, { status: 400 });
  }

  const { error: dbError } = await getSupabase().from("inquiries").insert({
    name,
    phone,
    age_group: ageGroup,
    interest,
    utm_source: utmSource || null,
    utm_medium: utmMedium || null,
    utm_campaign: utmCampaign || null,
    notification_status: "pending",
  });

  if (dbError) {
    console.error("Supabase error:", dbError);
    return NextResponse.json(
      { error: "일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  const message = `🚗 *신규 상담 문의*\n\n👤 이름: ${name}\n📞 연락처: ${phone}\n🎂 연령대: ${ageGroup}\n💼 관심분야: ${interest}\n📊 UTM: ${utmSource || "-"} / ${utmMedium || "-"} / ${utmCampaign || "-"}`;

  const notifications = [];

  // Discord webhook
  if (process.env.DISCORD_WEBHOOK_URL) {
    notifications.push(
      fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.replace(/\*/g, "**") }),
      }).catch((e) => console.error("Discord error:", e))
    );
  }

  // Telegram bot
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    notifications.push(
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }).catch((e) => console.error("Telegram error:", e))
    );
  }

  try {
    await Promise.allSettled(notifications);
    await getSupabase()
      .from("inquiries")
      .update({ notification_status: "sent" })
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);
  } catch (notifyError) {
    console.error("Notification error:", notifyError);
  }

  return NextResponse.json({ success: true });
}
