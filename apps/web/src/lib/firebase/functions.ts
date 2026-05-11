import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "./client";

const functions = getFunctions(firebaseApp, "asia-northeast3");

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
