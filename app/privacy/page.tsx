export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-6 py-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-8">개인정보 수집 및 이용 동의</h1>

      <div className="space-y-6 text-sm text-[#ccc] leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. 수집 항목</h2>
          <p>이름, 연락처(전화번호), 연령대, 관심분야</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. 수집 및 이용 목적</h2>
          <p>무료 상담 서비스 제공을 위한 연락 및 안내</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. 보유 및 이용 기간</h2>
          <p>상담 완료 후 1년간 보유하며, 이후 지체 없이 파기합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. 동의 거부권 및 불이익</h2>
          <p>개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부하실 경우 무료 상담 신청이 제한됩니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">5. 제3자 제공</h2>
          <p>수집된 개인정보는 제3자에게 제공되지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">6. 개인정보 처리 위탁</h2>
          <p>데이터 저장: Supabase Inc. (클라우드 데이터베이스)</p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-[#222]">
        <p className="text-xs text-[#555]">© 2026 Global Auto Academy | 경기도 부천시 상동로 186</p>
      </div>
    </div>
  );
}
