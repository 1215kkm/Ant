import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "이용약관 · 개미청소",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "2026-05-11";

export default function TermsPage() {
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
        <h1 className="text-xl font-semibold">이용약관</h1>
      </header>

      <p className="mb-6 text-sm text-brand-700">최종 갱신일: {LAST_UPDATED}</p>

      <section className="prose-legal flex flex-col gap-6 text-base leading-relaxed">
        <Article title="제1조 (목적)">
          본 약관은 개미청소(이하 “회사”)가 제공하는 건물관리 PWA 서비스(이하 “서비스”)의
          이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </Article>

        <Article title="제2조 (용어의 정의)">
          <ul className="list-disc pl-5">
            <li>“이용자”란 본 약관에 따라 서비스를 이용하는 거주자, 호실 소유자, 관리자를 말합니다.</li>
            <li>“계정”이란 이용자가 서비스를 이용하기 위해 생성한 식별 단위를 말합니다.</li>
            <li>“콘텐츠”란 이용자가 서비스에 업로드한 사진, 영상, 텍스트, 메모 등을 말합니다.</li>
          </ul>
        </Article>

        <Article title="제3조 (서비스의 제공)">
          회사는 다음 각 호의 서비스를 제공합니다.
          <ol className="list-decimal pl-5">
            <li>수리 요청 및 문의 접수·처리</li>
            <li>관리비 청구 및 납부 안내</li>
            <li>자동 보고서 작성 및 전달</li>
            <li>거주자 메모 및 통계 대시보드</li>
            <li>청소 블로그 등 부가 서비스</li>
          </ol>
        </Article>

        <Article title="제4조 (계정 생성 및 관리)">
          <ol className="list-decimal pl-5">
            <li>이용자는 정확한 정보로 가입하여야 하며, 타인의 정보를 도용해서는 안 됩니다.</li>
            <li>이용자는 자신의 계정 정보가 유출되지 않도록 관리할 책임을 부담합니다.</li>
            <li>회사는 부정 이용이 의심되는 경우 사전 통지 없이 계정을 일시 정지할 수 있습니다.</li>
          </ol>
        </Article>

        <Article title="제5조 (이용자의 의무)">
          이용자는 다음 행위를 하여서는 안 됩니다.
          <ul className="list-disc pl-5">
            <li>허위 사실이나 타인의 명예를 훼손하는 내용 게시</li>
            <li>타인의 개인정보를 무단 수집·공개</li>
            <li>서비스의 정상 운영을 방해하는 행위</li>
            <li>법령 또는 공서양속에 위배되는 행위</li>
          </ul>
        </Article>

        <Article title="제6조 (콘텐츠의 권리)">
          이용자가 서비스에 업로드한 콘텐츠의 저작권은 이용자에게 있으나, 회사는 서비스 운영과
          홍보를 위해 해당 콘텐츠를 비독점적으로 사용·복제·공중송신할 수 있습니다.
          이용자는 언제든지 자신의 콘텐츠를 삭제할 수 있습니다.
        </Article>

        <Article title="제7조 (서비스 중단 및 변경)">
          <ol className="list-decimal pl-5">
            <li>회사는 정기 점검, 시스템 장애 등 부득이한 사유로 서비스를 일시 중단할 수 있습니다.</li>
            <li>회사는 운영상·기술상 필요에 따라 서비스 내용을 변경할 수 있으며, 중요한 변경은 사전에 공지합니다.</li>
          </ol>
        </Article>

        <Article title="제8조 (책임의 제한)">
          회사는 천재지변, 통신 장애, 이용자의 귀책사유로 인한 손해에 대하여 책임을 지지 않습니다.
          회사가 제공하는 청소·수리 등 오프라인 서비스 자체에 대한 책임은 별도의 계약에 따릅니다.
        </Article>

        <Article title="제9조 (약관의 변경)">
          회사는 필요 시 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해
          최소 7일 전(이용자에게 불리한 변경의 경우 30일 전)에 알립니다.
        </Article>

        <Article title="제10조 (준거법 및 분쟁 해결)">
          본 약관은 대한민국 법령에 따라 해석되며, 회사와 이용자 간 분쟁은 회사의 본점 소재지를
          관할하는 법원을 1심 법원으로 합니다.
        </Article>
      </section>

      <footer className="mt-10 border-t border-brand-100 pt-4 text-sm text-brand-700">
        문의: <a className="underline" href="mailto:support@ant-cleaning.app">support@ant-cleaning.app</a>
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
