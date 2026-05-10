import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Building, Unit, Resident, Membership } from "@/lib/types";

const buildingsCol = collection(db, "buildings");

export async function listBuildings(filters: {
  managerId?: string;
  ownerId?: string;
}): Promise<Building[]> {
  const constraints: QueryConstraint[] = [orderBy("name")];
  if (filters.managerId) {
    constraints.unshift(where("managerIds", "array-contains", filters.managerId));
  } else if (filters.ownerId) {
    constraints.unshift(where("ownerIds", "array-contains", filters.ownerId));
  }
  const snap = await getDocs(query(buildingsCol, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Building, "id">) }));
}

export function watchBuilding(
  bid: string,
  cb: (b: Building | null) => void,
): () => void {
  return onSnapshot(doc(db, "buildings", bid), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Building, "id">) }) : null);
  });
}

export async function getBuilding(bid: string): Promise<Building | null> {
  const snap = await getDoc(doc(db, "buildings", bid));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Building, "id">) } : null;
}

export async function createBuilding(input: {
  name: string;
  address: string;
  addressDetail?: string;
  ownerIds?: string[];
}): Promise<string> {
  const docRef = await addDoc(buildingsCol, {
    name: input.name,
    address: input.address,
    addressDetail: input.addressDetail ?? "",
    ownerIds: input.ownerIds ?? [],
    managerIds: [],
    unitsCount: 0,
    residentsCount: 0,
    stats: { openRequests: 0, monthlyRequests: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBuilding(
  bid: string,
  patch: Partial<Pick<Building, "name" | "address" | "addressDetail" | "ownerIds">>,
): Promise<void> {
  await updateDoc(doc(db, "buildings", bid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

// ---------- units ----------

export async function listUnits(bid: string): Promise<Unit[]> {
  const snap = await getDocs(
    query(collection(db, "buildings", bid, "units"), orderBy("label")),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    buildingId: bid,
    ...(d.data() as Omit<Unit, "id" | "buildingId">),
  }));
}

export async function createUnit(
  bid: string,
  input: { label: string; floor?: number },
): Promise<string> {
  const ref = await addDoc(collection(db, "buildings", bid, "units"), {
    label: input.label,
    floor: input.floor ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ---------- residents ----------

export async function listResidents(bid: string): Promise<Resident[]> {
  const snap = await getDocs(
    query(collection(db, "buildings", bid, "residents"), orderBy("name")),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    buildingId: bid,
    ...(d.data() as Omit<Resident, "id" | "buildingId">),
  }));
}

export async function createResident(
  bid: string,
  input: { name: string; phoneNumber?: string; unitId?: string; unitLabel?: string },
): Promise<string> {
  const ref = await addDoc(collection(db, "buildings", bid, "residents"), {
    name: input.name,
    phoneNumber: input.phoneNumber ?? "",
    unitId: input.unitId ?? null,
    unitLabel: input.unitLabel ?? null,
    stats: { total: 0, completionRate: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ---------- memberships ----------

export async function listMemberships(bid: string): Promise<Membership[]> {
  const snap = await getDocs(collection(db, "buildings", bid, "memberships"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Membership, "id">),
  }));
}

export async function upsertMembership(
  bid: string,
  input: {
    userId: string;
    role: "cleaning_manager" | "super_manager";
    permissions?: Membership["permissions"];
    invitedBy?: string;
  },
): Promise<void> {
  const id = `${input.userId}_${bid}`;
  await setDoc(
    doc(db, "buildings", bid, "memberships", id),
    {
      userId: input.userId,
      buildingId: bid,
      role: input.role,
      permissions: input.permissions ?? {},
      invitedBy: input.invitedBy ?? null,
      status: "active",
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function revokeMembership(bid: string, userId: string): Promise<void> {
  await updateDoc(doc(db, "buildings", bid, "memberships", `${userId}_${bid}`), {
    status: "revoked",
  });
}
