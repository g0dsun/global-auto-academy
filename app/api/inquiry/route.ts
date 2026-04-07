import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";

const PHONE_REGEX = /^01[016789]-?\d{3,4}-?\d{4}$/;

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
  if (!phone || !PHONE_REGEX.test(phone.replace(/-/g, "").replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3") ? phone : phone)) {
    const cleaned = phone?.replace(/[^0-9]/g, "");
    if (!cleaned || !/^01[016789]\d{7,8}$/.test(cleaned)) {
      return NextResponse.json({ error: "올바른 전화번호를 입력해주세요." }, { status: 400 });
    }
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

  try {
    await getResend().emails.send({
      from: "문의알림 <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL!,
      subject: `[신규 문의] ${name} (${ageGroup}) - ${interest}`,
      html: `
        <h2>신규 상담 문의</h2>
        <table style="border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold">이름</td><td style="padding:8px">${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">연락처</td><td style="padding:8px">${phone}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">연령대</td><td style="padding:8px">${ageGroup}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">관심분야</td><td style="padding:8px">${interest}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">UTM</td><td style="padding:8px">${utmSource || "-"} / ${utmMedium || "-"} / ${utmCampaign || "-"}</td></tr>
        </table>
      `,
    });

    await getSupabase()
      .from("inquiries")
      .update({ notification_status: "sent" })
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);
  } catch (emailError) {
    console.error("Resend error:", emailError);
    // DB에는 이미 저장됨, notification_status는 'pending' 유지
  }

  return NextResponse.json({ success: true });
}
