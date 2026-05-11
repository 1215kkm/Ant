/** 사용자 역할 4종 */
export const ROLES = ["resident", "cleaning_manager", "super_manager", "building_owner"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL_KO: Record<Role, string> = {
  resident: "거주자",
  cleaning_manager: "청소관리자",
  super_manager: "슈퍼관리자",
  building_owner: "건물주",
};

export function isManagerRole(role: Role | undefined): boolean {
  return role === "cleaning_manager" || role === "super_manager";
}
