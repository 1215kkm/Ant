/**
 * 개미청소 Cloud Functions 진입점.
 * 2세대 함수, asia-northeast3(서울).
 */
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({
  region: "asia-northeast3",
  maxInstances: 10,
});

// HTTP
export { healthcheck } from "./http/healthcheck";

// Auth blocking trigger (Phase 1)
export { onUserCreated } from "./triggers/onUserCreated";

// Firestore triggers (Phase 1)
export { onMembershipChanged } from "./triggers/onMembershipChanged";

// Firestore triggers (Phase 3)
export { onRequestCreated } from "./triggers/onRequestCreated";
export { onRequestStatusChanged } from "./triggers/onRequestStatusChanged";

// Callable (Phase 1)
export { setUserRole } from "./callable/setUserRole";

// Callable (Phase 2)
export { findUserByContact } from "./callable/findUserByContact";
export { linkResident } from "./callable/linkResident";
