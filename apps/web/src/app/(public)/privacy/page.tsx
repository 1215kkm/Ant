import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "개인정보처리방침 · 개미청소",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "2026-05-11";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-screen-sm bg-white px-4 pb-24 pt-6 text-brand-900">
      <header className="mb-6 flex items-center gap-2">
        <Link
          href="/"
          aria-label="홈으로"
          className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg text-brand-700"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="text-xl font-semibold">개인정보처리방침</h1>
      </header>

      <p className="mb-6 text-sm text-brand-700">최종 갱신일: {LAST_UPDATED}</p>

      <section className="flex flex-col gap-6 text-base leading-relaxed">
        <Article title="1. 수집하는 개인정보 항목">
          회사는 서비스 제공을 위해 다음 정보를 수집합니다.
          <ul className="mt-2 list-disc pl-5">
            <li>필수: 이메일 또는 휴대폰번호, 이름(또는 표시명), Firebase UID</li>
            <li>선택: 호실 정보, 텔레그램 핸들, FCM 디바이스 토큰</li>
            <li>자동 수집: 접속 일시, IP, 기기 정보, 서비스 이용 기록</li>
            <li>거주자 메모: 관리자가 입력하는 개인 응대 기록(태그·코멘트)</li>
          </ul>
        </Article>

        <Article title="2. 개인정보의 이용 목적">
          <ul className="list-disc pl-5">
            <li>회원 식별 및 본인 확인</li>
            <li>수리·문의 요청 처리 및 결과 통지</li>
            <li>관리비 청구·납부 안내</li>
            <li>FCM 푸시 및 텔레그램 메시지를 통한 알림 전송</li>
            <li>자동 보고서 작성 및 이메일/메신저 발송</li>
            <li>부정 이용 방지 및 보안 강화</li>
          </ul>
        </Article>

        <Article title="3. 개인정보의 보유 및 이용 기간">
          <ol className="list-decimal pl-5">
            <li>회원 탈퇴 시 또는 보유 목적 달성 시 지체 없이 파기합니다.</li>
            <li>관계 법령(전자상거래법 등)에 따라 보관이 필요한 거래 기록은 최대 5년간 보관합니다.</li>
            <li>로그인 기록 및 접속 로그는 통신비밀보호법에 따라 3개월간 보관 후 파기합니다.</li>
          </ol>
        </Article>

        <Article title="4. 제3자 제공 및 처리 위탁">
          회사는 이용자의 개인정보를 동의 없이 외부에 제공하지 않습니다. 단, 서비스 운영에
          필요한 범위 내에서 다음 업체에 처리를 위탁합니다.
          <ul className="mt-2 list-disc pl-5">
            <li><strong>Google Firebase</strong> (Authentication·Firestore·Storage·Functions·FCM) — 인증, 데이터 저장, 푸시 알림</li>
            <li><strong>Telegram</strong> — 텔레그램 메시지를 선택한 이용자에 한해 봇 메시지 발송</li>
            <li><strong>SMTP 메일 서비스</strong> — 자동 보고서·인보이스 이메일 발송</li>
          </ul>
          <p className="mt-2 text-sm">
            Firebase는 미국 등 해외 데이터센터에 정보가 전송·저장될 수 있으며, Google의 개인정보처리방침에 따라
            관리됩니다 (<a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>).
          </p>
        </Article>

        <Article title="5. 이용자의 권리">
          이용자는 언제든지 다음 권리를 행사할 수 있습니다.
          <ul className="list-disc pl-5">
            <li>개인정보 열람·수정·삭제 요청</li>
            <li>처리 정지 및 동의 철회 요청</li>
            <li>회원 탈퇴 (앱 내 설정 또는 고객센터)</li>
          </ul>
          <p className="mt-2 text-sm">
            요청은 <a className="underline" href="mailto:privacy@ant-cleaning.app">privacy@ant-cleaning.app</a>으로
            보내주시면 지체 없이 처리합니다.
          </p>
        </Article>

        <Article title="6. 개인정보의 안전성 확보">
          <ul className="list-disc pl-5">
            <li>전송 구간 TLS 암호화 적용</li>
            <li>Firebase Security Rules 기반 접근 제어</li>
            <li>Firebase App Check를 통한 비정상 트래픽 차단</li>
            <li>관리자 화면 접근 시 역할 기반 인증</li>
          </ul>
        </Article>

        <Article title="7. 쿠키 및 자동 수집 도구">
          본 서비스는 인증 상태 유지와 통계 분석을 위해 쿠키 및 Firebase Analytics를 사용합니다.
          이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 일부 기능 사용이 제한될 수 있습니다.
        </Article>

        <Article title="8. 푸시 알림 및 텔레그램 메시지">
          이용자가 푸시 알림 권한을 허용한 경우 디바이스 토큰을 저장하여 알림을 발송합니다.
          텔레그램 계정을 연결한 경우 봇 메시지 발송 목적의 chat_id만 저장하며, 언제든 연결을 해제할 수 있습니다.
        </Article>

        <Article title="9. 개인정보 보호책임자">
          <p>책임자: 개미청소 개인정보 담당자</p>
          <p>연락처: <a className="underline" href="mailto:privacy@ant-cleaning.app">privacy@ant-cleaning.app</a></p>
        </Article>

        <Article title="10. 방침의 변경">
          본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 시행일자 7일 전부터 서비스 내 공지를 통해 안내합니다.
        </Article>
      </section>

      <footer className="mt-10 border-t border-brand-100 pt-4 text-sm text-brand-700">
        <Link href="/terms" className="underline">이용약관 보기</Link>
      </footer>
    </main>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article>
      <h2 className="mb-2 text-base font-semibold text-brand-900">{title}</h2>
      <div className="text-sm text-brand-900/90">{children}</div>
    </article>
  );
}
