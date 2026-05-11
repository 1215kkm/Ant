import type { Timestamp } from "firebase-admin/firestore";

export const ROLES = [
  "resident",
  "cleaning_manager",
  "super_manager",
  "building_owner",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL_KO: Record<Role, string> = {
  resident: "거주자",
  cleaning_manager: "청소관리자",
  super_manager: "슈퍼관리자",
  building_owner: "건물주",
};

/** custom claims 페이로드. role + bIds (≤30) + sm 단축 플래그. */
export type AppClaims = {
  role: Role;
  bIds: string[];
  sm: boolean;
};

/** Firestore user 문서 타입. */
export type UserDoc = {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  role: Role;
  buildingIds: string[];
  pushEnabled: boolean;
  locale: "ko-KR";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
