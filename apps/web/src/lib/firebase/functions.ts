import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "./client";

const functions = getFunctions(firebaseApp, "asia-northeast3");

if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true") {
  const g = globalThis as unknown as { __ANT_FN_EMULATOR_CONNECTED__?: boolean };
  if (!g.__ANT_FN_EMULATOR_CONNECTED__) {
    g.__ANT_FN_EMULATOR_CONNECTED__ = true;
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
}

export type SetUserRoleInput = {
  uid: string;
  role: "resident" | "cleaning_manager" | "super_manager" | "building_owner";
};

export const callSetUserRole = httpsCallable<SetUserRoleInput, { ok: true }>(
  functions,
  "setUserRole",
);

export type FindUserResult = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
};
export const callFindUserByContact = httpsCallable<
  { email?: string; phoneNumber?: string },
  FindUserResult
>(functions, "findUserByContact");

export const callLinkResident = httpsCallable<
  { buildingId: string; residentId: string; uid: string },
  { ok: true }
>(functions, "linkResident");

export type TelegramLinkCode = {
  code: string;
  expiresAt: number;
  botUsername?: string;
};
export const callRequestTelegramLinkCode = httpsCallable<undefined, TelegramLinkCode>(
  functions,
  "requestTelegramLinkCode",
);

export const callUnlinkTelegramAccount = httpsCallable<undefined, { ok: true }>(
  functions,
  "unlinkTelegramAccount",
);

export type GenerateReportInput = {
  buildingId: string;
  kind: "weekly" | "monthly";
  periodStart: string;
  periodEnd: string;
};
export const callGenerateReportPdf = httpsCallable<
  GenerateReportInput,
  { ok: true; reportId: string }
>(functions, "generateReportPdf");
