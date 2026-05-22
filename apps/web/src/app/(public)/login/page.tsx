"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { syncAuthCookie } from "@/lib/auth/AuthProvider";
import { Icon } from "@/components/ui/Icon";

type Mode = "email" | "phone";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("email");

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col bg-white px-4 pt-8 pb-12">
      {/*
        위치 결정: 헤더 좌측 IconButton (옵션 A).
        근거: PageHeader/terms/privacy와 동일 컨벤션 유지 — 보호 라우트에서
        리다이렉트된 사용자가 "익숙한 위치"에서 탈출구를 찾도록.
        별도 줄(옵션 B)은 시각 위계를 한 단계 더 만들어 헤더를 분산시킴.
      */}
      <div className="flex items-center gap-3">
        <BackButton />
        <img src="/brand/ant-clean-logo.svg" alt="" className="h-10 w-10" />
        <h1 className="text-xl font-semibold text-brand-900">로그인</h1>
      </div>

      <p className="mt-2 text-sm text-brand-700">
        개미청소 건물관리 앱에 오신 것을 환영합니다.
      </p>

      <div className="mt-6 flex rounded-xl bg-brand-50 p-1 text-sm">
        <SegmentButton
          active={mode === "email"}
          onClick={() => setMode("email")}
          icon="mail"
          label="이메일"
        />
        <SegmentButton
          active={mode === "phone"}
          onClick={() => setMode("phone")}
          icon="smartphone"
          label="휴대폰"
        />
      </div>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-brand-700">불러오는 중…</p>}>
          {mode === "email" ? <EmailForm /> : <PhoneForm />}
        </Suspense>
      </div>

      <p className="mt-8 text-center text-sm text-brand-700">
        가입 시 <a className="underline" href="/terms">이용약관</a> 및{" "}
        <a className="underline" href="/privacy">개인정보처리방침</a>에 동의합니다.
      </p>

      {/* invisible reCAPTCHA 컨테이너 (휴대폰 인증용) */}
      <div id="recaptcha-container" />
    </main>
  );
}

/**
 * 로그인 헤더의 뒤로 가기 버튼.
 * - history가 있으면 router.back(), 없으면 홈("/")으로 fallback.
 * - SSR 안전: window 접근은 onClick 내부에서만.
 * - 디자인 토큰: PageHeader와 동일 (min-h-tap min-w-tap, rounded-lg, text-brand-700, -ml-2).
 */
function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
      className="-ml-2 inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg text-brand-700 transition active:bg-brand-50"
      aria-label="뒤로 가기"
    >
      <Icon name="arrow_back" />
    </button>
  );
}

function SegmentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex min-h-tap flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 transition " +
        (active
          ? "bg-white text-brand-900 shadow-sm"
          : "text-brand-700/70 hover:text-brand-900")
      }
    >
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </button>
  );
}

function EmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (signupMode && !agreed) {
      toast.error("이용약관과 개인정보처리방침에 동의가 필요합니다.");
      return;
    }
    setSubmitting(true);
    try {
      if (signupMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("가입이 완료되었습니다.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("로그인되었습니다.");
      }
      // 미들웨어 race 회피: AuthProvider.onAuthStateChanged 콜백을 기다리지 않고
      // 쿠키를 직접 set 한 뒤 navigate. 이게 없으면 첫 진입이 다시 /login 으로 튕김.
      syncAuthCookie(true);
      router.replace(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="이메일"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
      />
      <Field
        label="비밀번호"
        type="password"
        autoComplete={signupMode ? "new-password" : "current-password"}
        value={password}
        onChange={setPassword}
        minLength={6}
        required
      />
      {signupMode && <ConsentCheckbox checked={agreed} onChange={setAgreed} />}
      <button
        type="submit"
        disabled={submitting || (signupMode && !agreed)}
        className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm transition active:bg-brand-600 disabled:opacity-50"
      >
        {submitting ? "처리 중…" : signupMode ? "가입하기" : "로그인"}
      </button>
      <button
        type="button"
        onClick={() => setSignupMode((v) => !v)}
        className="self-center text-sm text-brand-700 underline-offset-4 hover:underline"
      >
        {signupMode ? "이미 계정이 있으신가요? 로그인" : "처음이신가요? 가입하기"}
      </button>
    </form>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 accent-brand-500"
        aria-label="약관 동의"
      />
      <span>
        <a className="underline" href="/terms" target="_blank" rel="noopener noreferrer">
          이용약관
        </a>{" "}
        및{" "}
        <a className="underline" href="/privacy" target="_blank" rel="noopener noreferrer">
          개인정보처리방침
        </a>
        에 동의합니다.
      </span>
    </label>
  );
}

function PhoneForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !recaptchaRef.current) return;
    setSubmitting(true);
    try {
      const e164 = toE164(phone);
      const result = await signInWithPhoneNumber(auth, e164, recaptchaRef.current);
      setConfirmation(result);
      toast.success("인증번호를 전송했습니다.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "전송에 실패했습니다.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmation || submitting) return;
    setSubmitting(true);
    try {
      await confirmation.confirm(code);
      toast.success("로그인되었습니다.");
      // 미들웨어 race 회피 — 이메일 로그인과 동일.
      syncAuthCookie(true);
      router.replace(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "인증에 실패했습니다.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!confirmation) {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-4">
        <Field
          label="휴대폰 번호"
          type="tel"
          inputMode="numeric"
          placeholder="010-1234-5678"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "전송 중…" : "인증번호 받기"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-4">
      <Field
        label="인증번호 (6자리)"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={setCode}
        maxLength={6}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-base font-medium text-white shadow-sm active:bg-brand-600 disabled:opacity-50"
      >
        {submitting ? "확인 중…" : "확인"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmation(null)}
        className="self-center text-sm text-brand-700 underline-offset-4 hover:underline"
      >
        번호 다시 입력
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-brand-700">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </label>
  );
}

/** 010-XXXX-XXXX → +82-10-XXXX-XXXX */
function toE164(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.startsWith("82")) return `+${digits}`;
  if (digits.startsWith("0")) return `+82${digits.slice(1)}`;
  return `+${digits}`;
}
