"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const REMAINING = process.env.NEXT_PUBLIC_REMAINING_SEATS || "3";

// Review data is hardcoded and trusted - not from user input
const REVIEWS = [
  { q: '유튜브로 6개월 독학하다 여기 왔는데, 현장에서 실차 보는 건 완전히 다른 세계였어요.', highlight: '현장에서 실차 보는 건 완전히 다른 세계', name: "김OO · 32세", meta: "직장인→전업 전환 · 3개월 만에 첫 수출", av: "김", avc: "bg-[#ff4d4d]" },
  { q: '실제 거래 가격을 공유해주는 곳은 여기밖에 없었어요. 다른 곳은 뻥이거나 옛날 가격.', highlight: '실제 거래 가격을 공유해주는 곳은 여기밖에 없었어요.', name: "이OO · 45세", meta: "자영업자 · 현재 수출 파트너 활동 중", av: "이", avc: "bg-[#4f8fff]" },
  { q: '처음엔 교육만 들으려고 했는데, 파트너십 구조가 너무 좋아서 바로 합류했어요.', highlight: '파트너십 구조가 너무 좋아서 바로 합류', name: "박OO · 28세", meta: "무역회사 퇴사 후 참여 · 월 5대 수출 중", av: "박", avc: "bg-[#ff9500]" },
  { q: '50대라 걱정했는데 나이 상관없이 배울 수 있는 구조더라고요.', highlight: '나이 상관없이 배울 수 있는 구조', name: "정OO · 53세", meta: "은퇴 후 제2의 커리어 · 교육 수료", av: "정", avc: "bg-[#00c853]" },
  { q: '딸이 추천해서 시작. 경매장에서 좋은 차 고르는 눈이 생기니까 자신감이 붙더라고요.', highlight: '경매장에서 좋은 차 고르는 눈', name: "한OO · 61세", meta: "은퇴자 · 주 2회 경매장 동행 중", av: "한", avc: "bg-[#8b5cf6]" },
  { q: '해외 영업 경력을 살려서 뛰어들었어요. 차량 감별 스킬이 바이어 신뢰를 쌓는 데 결정적이었습니다.', highlight: '차량 감별 스킬이 바이어 신뢰를 쌓는 데 결정적', name: "최OO · 38세", meta: "무역 경력 10년 · 아프리카 시장 개척 중", av: "최", avc: "bg-[#fbbf24] text-black" },
];

function ReviewQuote({ text, highlight }: { text: string; highlight: string }) {
  const idx = text.indexOf(highlight);
  if (idx === -1) return <>&quot;{text}&quot;</>;
  return (
    <>
      &quot;{text.slice(0, idx)}
      <strong className="text-[#ff4d4d] font-bold">{highlight}</strong>
      {text.slice(idx + highlight.length)}&quot;
    </>
  );
}

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Anim({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollAnimation();
  return <div ref={ref} className={`animate-on-scroll ${className}`}>{children}</div>;
}

function LandingContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: "", phone: "", ageGroup: "", interest: "", agreed: false });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const utmSource = searchParams.get("utm_source") || "";
  const utmMedium = searchParams.get("utm_medium") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (!form.agreed) { setErrorMsg("개인정보 수집 및 이용에 동의해주세요."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, ageGroup: form.ageGroup, interest: form.interest, utmSource, utmMedium, utmCampaign }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "오류가 발생했습니다."); }
      setStatus("success");
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).fbq?.("track", "Lead");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gtag?.("event", "generate_lead", { event_category: "form" });
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-black mb-3">신청이 완료되었습니다!</h1>
          <p className="text-[#888] text-lg">24시간 이내 전문 상담사가 연락드리겠습니다.</p>
          <p className="text-[#555] text-sm mt-6">입력하신 연락처로 연락드릴 예정입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 h-14 bg-black/90 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <div className="text-sm font-black">GLOBAL <span className="text-[#ff4d4d]">AUTO</span> ACADEMY</div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-[#aaa] hidden sm:inline">☎ 010-0000-0000</span>
          <button onClick={scrollToForm} className="bg-[#ff4d4d] text-white text-xs font-bold px-4 py-2 rounded-md">무료 상담</button>
        </div>
      </nav>

      <section className="pt-24 pb-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,143,255,0.08),transparent_60%)]" />
        <div className="relative max-w-2xl mx-auto px-5">
          <div className="inline-flex items-center gap-2 bg-[#ff4d4d] text-white text-xs font-extrabold px-4 py-1.5 rounded btn-pulse mb-5">🔥 2026년 7기 모집 중 · 잔여 {REMAINING}석</div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-4">중고차 수출,<br /><span className="text-[#ff4d4d]">교육부터 파트너십까지</span><br />원스톱으로</h1>
          <p className="text-base text-[#999] mb-7 leading-relaxed">현장 실습 → 실거래가 공유 → 수출 파트너 연결<br />6조원 시장에 실전으로 진입하세요</p>
          <button onClick={scrollToForm} className="bg-[#ff4d4d] text-white text-lg font-extrabold px-10 py-4 rounded-lg shadow-[0_4px_20px_rgba(255,77,77,0.4)] hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(255,77,77,0.5)] transition-all">무료 상담 신청하기 →</button>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#ff4d4d]">
        {[{ n: "6조+", l: "국내 수출 시장 규모" }, { n: "100+", l: "수출 대상국" }, { n: "40만+", l: "연간 수출 대수" }, { n: "94%", l: "수강생 만족도" }].map((s) => (
          <div key={s.l} className="text-center py-5 px-3 border-r border-white/20 last:border-r-0"><div className="text-2xl sm:text-3xl font-black">{s.n}</div><div className="text-xs opacity-85 mt-0.5">{s.l}</div></div>
        ))}
      </div>

      <section className="py-14 px-5 bg-[#111]"><div className="max-w-3xl mx-auto">
        <Anim><h2 className="text-2xl font-black text-center mb-1">📊 <span className="text-[#ff4d4d]">데이터</span>로 보는 중고차 수출 시장</h2><p className="text-sm text-[#888] text-center mb-8">숫자가 증명하는 기회</p></Anim>
        <div className="grid sm:grid-cols-2 gap-4">
          <Anim><div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#222]">
            <h3 className="text-sm font-bold text-[#ccc] mb-4">🌍 지역별 수출 비중 (2026)</h3>
            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90"><circle cx="50" cy="50" r="40" fill="none" stroke="#ff4d4d" strokeWidth="18" strokeDasharray="87.96 163.36" /><circle cx="50" cy="50" r="40" fill="none" stroke="#ff9500" strokeWidth="18" strokeDasharray="50.27 200" strokeDashoffset="-87.96" /><circle cx="50" cy="50" r="40" fill="none" stroke="#4f8fff" strokeWidth="18" strokeDasharray="50.27 200" strokeDashoffset="-138.23" /><circle cx="50" cy="50" r="40" fill="none" stroke="#00c853" strokeWidth="18" strokeDasharray="37.7 213" strokeDashoffset="-188.5" /><circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="18" strokeDasharray="25.13 226" strokeDashoffset="-226.19" /></svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-black">100%</div>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-[#aaa]">
                {[{ c: "#ff4d4d", t: "중동 35%" }, { c: "#ff9500", t: "아프리카 20%" }, { c: "#4f8fff", t: "동남아 20%" }, { c: "#00c853", t: "중남미 15%" }, { c: "#8b5cf6", t: "기타 10%" }].map((l) => (
                  <div key={l.t} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: l.c }} />{l.t}</div>
                ))}
              </div>
            </div>
          </div></Anim>
          <Anim><div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#222]">
            <h3 className="text-sm font-bold text-[#ccc] mb-4">📈 연도별 수출 성장률</h3>
            <div className="flex flex-col gap-2.5">
              {[{ y: "2022", w: "55%", v: "3.2조", c: "bg-gradient-to-r from-[#ff4d4d] to-[#ff6b6b]" }, { y: "2023", w: "65%", v: "3.8조", c: "bg-gradient-to-r from-[#ff4d4d] to-[#ff6b6b]" }, { y: "2024", w: "75%", v: "4.5조", c: "bg-gradient-to-r from-[#ff9500] to-[#ffb340]" }, { y: "2025", w: "85%", v: "5.2조", c: "bg-gradient-to-r from-[#ff9500] to-[#ffb340]" }, { y: "2026", w: "95%", v: "6.1조", c: "bg-gradient-to-r from-[#00c853] to-[#4caf50]" }].map((b) => (
                <div key={b.y} className="flex items-center gap-2.5"><span className="text-xs text-[#aaa] w-10">{b.y}</span><div className="flex-1 h-6 bg-[#222] rounded overflow-hidden"><div className={`h-full rounded bar-animate ${b.c} flex items-center pl-2 text-[11px] font-bold`} style={{ width: b.w }}>{b.v}</div></div></div>
              ))}
            </div>
          </div></Anim>
        </div>
      </div></section>

      <section className="py-14 px-5 bg-[#1a1a2e]"><div className="max-w-3xl mx-auto">
        <Anim><h2 className="text-2xl font-black text-center mb-1">💰 수출 파트너 <span className="text-[#ff4d4d]">수익 구조</span></h2><p className="text-sm text-[#888] text-center mb-8">월 10대 수출 기준 예상 수익</p></Anim>
        <Anim><div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center max-w-lg mx-auto">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 text-center"><div className="text-sm text-[#888] mb-2">일반 직장인 평균</div><div className="text-3xl font-black text-[#888]">300만원</div><div className="text-xs text-[#888] mt-1">세전 월급</div></div>
          <div className="text-xl font-black text-[#ff4d4d] text-center">VS</div>
          <div className="bg-gradient-to-br from-[rgba(255,77,77,0.1)] to-[rgba(255,77,77,0.05)] border border-[#ff4d4d] rounded-xl p-5 text-center"><div className="text-sm text-[#ff4d4d] font-bold mb-2">수출 파트너 (월 10대)</div><div className="text-3xl font-black text-[#ff4d4d]">500~800만원</div><div className="text-xs text-[#888] mt-1">대당 50~80만원 마진 × 10대</div></div>
        </div><div className="text-center mt-4"><span className="inline-block bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.2)] rounded-lg px-5 py-3 text-xs text-[#ff4d4d] font-bold">✅ 시설 투자 0원 · 재고 부담 0 · 파트너십 구조</span></div></Anim>
      </div></section>

      <section className="py-14 px-5 bg-[#111]"><div className="max-w-3xl mx-auto">
        <Anim><h2 className="text-2xl font-black text-center mb-1">왜 <span className="text-[#ff4d4d]">우리</span>인가?</h2><p className="text-sm text-[#888] text-center mb-8">기존 교육과의 차이점</p></Anim>
        <div className="grid sm:grid-cols-2 gap-3">
          {[{ icon: "🔍", title: "실차 감별 교육", desc: "유튜브 이론이 아닌 실제 경매장에서 사고·침수·도색 판별 실습" }, { icon: "🏭", title: "야드 현장 방문", desc: "실제 수출 야드에서 검수·PDI·선적 과정 직접 체험" }, { icon: "💵", title: "실거래가 공유", desc: "국가별 FOB/CIF 실거래 가격과 마진 구조를 투명하게 공개" }, { icon: "🤝", title: "파트너십 연결", desc: "교육 후 바로 수출 프로젝트 참여. 혼자가 아닌 팀으로 시작" }].map((f) => (
            <Anim key={f.title}><div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 hover:border-[#ff4d4d] hover:-translate-y-0.5 transition-all"><div className="text-3xl mb-2.5">{f.icon}</div><h3 className="text-base font-extrabold mb-1">{f.title}</h3><p className="text-xs text-[#888] leading-relaxed">{f.desc}</p></div></Anim>
          ))}
        </div>
        <Anim className="mt-6"><div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#ccc] mb-4">📊 교육 수료 후 역량 변화</h3>
          <div className="flex flex-col gap-3">
            {[{ label: "차량 감별 능력", pct: 92, color: "from-[#ff4d4d] to-[#ff6b6b]" }, { label: "수출 프로세스 이해", pct: 88, color: "from-[#ff9500] to-[#ffb340]" }, { label: "바이어 소통 능력", pct: 76, color: "from-[#4f8fff] to-[#6ba3ff]" }, { label: "실전 수출 자신감", pct: 94, color: "from-[#00c853] to-[#4caf50]" }].map((s) => (
              <div key={s.label}><div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="text-[#ff4d4d] font-bold">{s.pct}%</span></div><div className="h-2 bg-[#222] rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${s.color} bar-animate`} style={{ width: `${s.pct}%` }} /></div></div>
            ))}
          </div>
        </div></Anim>
      </div></section>

      <section className="bg-gradient-to-r from-[#c0392b] to-[#e74c3c] py-10 px-5 text-center">
        <h2 className="text-2xl font-black mb-1.5">🚗 지금 바로 시작하세요</h2><p className="text-sm opacity-85 mb-5">다음 기수 마감까지 잔여 {REMAINING}자리</p>
        <button onClick={scrollToForm} className="bg-white text-[#e74c3c] text-base font-extrabold px-10 py-3.5 rounded-lg hover:translate-y-[-2px] transition-transform">무료 상담 신청 →</button>
      </section>

      <section className="py-14 px-5 bg-[#0a0a0a]"><div className="max-w-3xl mx-auto">
        <Anim><h2 className="text-2xl font-black text-center mb-1">📚 <span className="text-[#ff4d4d]">4단계</span> 실전 커리큘럼</h2><p className="text-sm text-[#888] text-center mb-8">이론 NO. 현장 실습 100%</p></Anim>
        <div className="relative pl-7"><div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#ff4d4d] via-[#ff9500] to-[#4f8fff]" />
          {[{ step: 1, title: "차량 상태 확인 교육", desc: "사고 이력, 침수, 도색 여부를 경매장에서 30초 안에 판별하는 실전 기술.", tag: "2일 · 실습 위주", color: "#ff4d4d" }, { step: 2, title: "수출 야드 현장 실습", desc: "실제 수출 야드에서 차량 선별 → 검수 → PDI → 컨테이너 적재까지 전 과정을 체험합니다.", tag: "1일 · 현장 방문", color: "#ff9500" }, { step: 3, title: "실거래가 & 마진 분석", desc: "국가별 FOB/CIF 실거래 가격, 마진 구조, 운송비, 관세를 분석합니다.", tag: "1일 · 핵심 차별화", color: "#4f8fff" }, { step: 4, title: "파트너십 실전 참여", desc: "교육 수료 후 실제 수출 건에 파트너로 참여. 매입 → 검수 → 선적 → 정산.", tag: "지속 · 수익 창출", color: "#00c853" }].map((c) => (
            <Anim key={c.step}><div className="relative mb-5 bg-[#1a1a1a] border border-[#222] rounded-lg p-4 pl-5"><div className="absolute -left-[22px] top-[18px] w-3 h-3 rounded-full border-2 border-[#0a0a0a]" style={{ background: c.color }} /><h3 className="text-base font-extrabold mb-1"><span style={{ color: c.color }} className="mr-1.5">STEP {c.step}</span>{c.title}</h3><p className="text-sm text-[#999]">{c.desc}</p><span className="inline-block mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: `${c.color}22`, color: c.color }}>{c.tag}</span></div></Anim>
          ))}
        </div>
      </div></section>

      <section className="py-14 px-5 bg-[#111]"><div className="max-w-3xl mx-auto">
        <Anim><h2 className="text-2xl font-black text-center mb-1">⭐ 수강생 <span className="text-[#ff4d4d]">실제 후기</span></h2><p className="text-sm text-[#888] text-center mb-8">교육을 마치고 실제 수출에 참여하고 있는 분들</p></Anim>
        <div className="grid sm:grid-cols-2 gap-3">
          {REVIEWS.map((r) => (
            <Anim key={r.name}><div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4"><div className="text-xs text-[#fbbf24] mb-2 tracking-wider">★★★★★</div><p className="text-sm text-[#ccc] leading-relaxed mb-3"><ReviewQuote text={r.q} highlight={r.highlight} /></p><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${r.avc} flex items-center justify-center text-xs font-extrabold flex-shrink-0`}>{r.av}</div><div><div className="text-sm font-bold">{r.name}</div><div className="text-[11px] text-[#666]">{r.meta}</div></div></div></div></Anim>
          ))}
        </div>
      </div></section>

      <div className="flex justify-center gap-6 flex-wrap py-5 px-5 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        {["사업자등록 완료", "실제 수출 실적 보유", "소수 정예 교육", "100% 환불 보장", "수료증 발급"].map((t) => (
          <span key={t} className="text-xs text-[#555] flex items-center gap-1"><span className="text-[#ff4d4d] font-bold">✓</span> {t}</span>
        ))}
      </div>

      <section className="py-14 px-5 bg-[#0a0a0a]" ref={formRef} id="form">
        <div className="max-w-md mx-auto bg-[#151515] border border-[#222] rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff4d4d] via-[#ff9500] to-[#ff4d4d]" />
          <div className="text-center mb-4"><span className="bg-[rgba(255,77,77,0.15)] text-[#ff4d4d] text-sm font-bold px-4 py-1.5 rounded">🔥 이번 기수 잔여석 {REMAINING}자리</span></div>
          <h2 className="text-2xl font-black text-center mb-1">무료 상담 신청</h2>
          <p className="text-sm text-[#888] text-center mb-6">24시간 이내 전문 상담사가 연락드립니다</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div><label className="block text-xs font-bold text-[#aaa] mb-1">이름</label><input type="text" placeholder="홍길동" required minLength={2} maxLength={20} className="w-full px-4 py-3 border border-[#222] rounded-lg text-sm bg-[#1a1a1a] text-white outline-none focus:border-[#ff4d4d] transition-colors placeholder:text-[#444]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-xs font-bold text-[#aaa] mb-1">연락처</label><input type="tel" placeholder="010-0000-0000" required className="w-full px-4 py-3 border border-[#222] rounded-lg text-sm bg-[#1a1a1a] text-white outline-none focus:border-[#ff4d4d] transition-colors placeholder:text-[#444]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="block text-xs font-bold text-[#aaa] mb-1">연령대</label><select required className="w-full px-4 py-3 border border-[#222] rounded-lg text-sm bg-[#1a1a1a] text-white outline-none focus:border-[#ff4d4d] transition-colors appearance-none" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}><option value="">선택해주세요</option><option>20대</option><option>30대</option><option>40대</option><option>50대</option><option>60대 이상</option></select></div>
            <div><label className="block text-xs font-bold text-[#aaa] mb-1">관심 분야</label><select required className="w-full px-4 py-3 border border-[#222] rounded-lg text-sm bg-[#1a1a1a] text-white outline-none focus:border-[#ff4d4d] transition-colors appearance-none" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}><option value="">선택해주세요</option><option>교육만 관심</option><option>교육 + 파트너십</option><option>파트너십만 관심</option><option>기타 문의</option></select></div>
            <label className="flex items-start gap-2 mt-1"><input type="checkbox" className="mt-1 accent-[#ff4d4d]" checked={form.agreed} onChange={(e) => setForm({ ...form, agreed: e.target.checked })} /><span className="text-xs text-[#888]"><a href="/privacy" target="_blank" className="underline text-[#ff4d4d]">개인정보 수집 및 이용</a>에 동의합니다 (필수)</span></label>
            {errorMsg && <p className="text-xs text-[#ff4d4d]">{errorMsg}</p>}
            <button type="submit" disabled={status === "loading"} className="w-full py-4 bg-[#ff4d4d] text-white text-base font-extrabold rounded-lg shadow-[0_4px_20px_rgba(255,77,77,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(255,77,77,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1">{status === "loading" ? "처리 중..." : "무료 상담 신청하기 →"}</button>
            <p className="text-center text-[11px] text-[#555]">🔒 개인정보는 상담 목적으로만 사용됩니다</p>
          </form>
        </div>
      </section>

      <footer className="py-8 px-5 text-center border-t border-[#111] bg-black">
        <p className="text-xs text-[#444]">© 2026 Global Auto Academy | 서울특별시 강남구 | 사업자등록번호 000-00-00000</p>
        <p className="text-xs text-[#444] mt-1">문의: 010-0000-0000 | info@globalauto.kr</p>
      </footer>

      <button onClick={scrollToForm} className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#ff4d4d] text-white text-sm font-extrabold px-7 py-3.5 rounded-full shadow-[0_4px_20px_rgba(255,77,77,0.5)] btn-pulse">📞 무료 상담 신청</button>
    </>
  );
}

export default function Home() {
  return <Suspense><LandingContent /></Suspense>;
}
