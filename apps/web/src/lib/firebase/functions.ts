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
