"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { toast } from "sonner";
import {
  getBuilding,
  listUnits,
  listResidents,
  listMemberships,
  createUnit,
  createResident,
  upsertMembership,
} from "@/lib/queries/buildings";
import type { Building, Unit, Resident, Membership } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

type TabKey = "units" | "residents" | "managers";

export default function BuildingDetailPage({
  params,
}: {
  params: Promise<{ bid: string }>;
}) {
  const { bid } = use(params);
  const { claims } = useAuth();
  const isSuper = claims?.sm === true;

  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tab, setTab] = useState<TabKey>("units");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getBuilding(bid),
      listUnits(bid),
      listResidents(bid),
      listMemberships(bid),
    ])
      .then(([b, u, r, m]) => {
        setBuilding(b);
        setUnits(u);
        setResidents(r);
        setMemberships(m);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [bid]);

  if (loading) {
    return <p className="px-4 pt-8 text-sm text-brand-700">불러오는 중…</p>;
  }
  if (!building) {
    return (
      <main className="mx-auto max-w-screen-sm pb-24">
        <PageHeader title="건물" />
        <EmptyState icon="error" title="건물을 찾을 수 없습니다" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-sm pb-24">
      <PageHeader title={building.name} subtitle={building.address} />

      <nav
        role="tablist"
        className="mx-4 mt-2 flex rounded-xl bg-brand-50 p-1 text-sm"
      >
        <TabButton active={tab === "units"} onClick={() => setTab("units")} label="호실" count={units.length} />
        <TabButton active={tab === "residents"} onClick={() => setTab("residents")} label="거주자" count={residents.length} />
        <TabButton active={tab === "managers"} onClick={() => setTab("managers")} label="관리자" count={memberships.filter((m) => m.status === "active").length} />
      </nav>

      <div className="mt-4 px-4">
        {tab === "units" && (
          <UnitsTab
            bid={bid}
            units={units}
            onCreated={(u) => setUnits((prev) => [...prev, u].sort((a, b) => a.label.localeCompare(b.label)))}
          />
        )}
        {tab === "residents" && (
          <ResidentsTab
            bid={bid}
            residents={residents}
            units={units}
            onCreated={(r) => setResidents((prev) => [...prev, r].sort((a, b) => a.name.localeCompare(b.name)))}
          />
        )}
        {tab === "managers" && (
          <ManagersTab
            bid={bid}
            memberships={memberships}
            canEdit={isSuper}
            onUpdated={(list) => setMemberships(list)}
          />
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={
        "flex min-h-tap flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 transition " +
        (active
          ? "bg-white text-brand-900 shadow-sm"
          : "text-brand-700/70")
      }
    >
      <span>{label}</span>
      <span className="text-xs text-brand-700/60">{count}</span>
    </button>
  );
}

function UnitsTab({
  bid,
  units,
  onCreated,
}: {
  bid: string;
  units: Unit[];
  onCreated: (u: Unit) => void;
}) {
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || submitting) return;
    setSubmitting(true);
    try {
      const id = await createUnit(bid, { label: label.trim() });
      onCreated({ id, buildingId: bid, label: label.trim() });
      setLabel("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="호실 (예: 502)"
          className="flex-1 rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-tap items-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          추가
        </button>
      </form>
      {units.length === 0 ? (
        <EmptyState icon="meeting_room" title="등록된 호실이 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2">
          {units.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3"
            >
              <Icon name="meeting_room" className="text-brand-500" />
              <span className="text-base text-brand-900">{u.label}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ResidentsTab({
  bid,
  residents,
  units,
  onCreated,
}: {
  bid: string;
  residents: Resident[];
  units: Unit[];
  onCreated: (r: Resident) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unitId, setUnitId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const unit = units.find((u) => u.id === unitId);
      const id = await createResident(bid, {
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
        unitId: unitId || undefined,
        unitLabel: unit?.label,
      });
      onCreated({
        id,
        buildingId: bid,
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
        unitId: unitId || undefined,
        unitLabel: unit?.label,
      });
      setName("");
      setPhone("");
      setUnitId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={add} className="mb-4 flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="휴대폰 (선택)"
          className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          <option value="">호실 선택 (선택)</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex min-h-tap items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "추가 중…" : "거주자 추가"}
        </button>
      </form>
      {residents.length === 0 ? (
        <EmptyState icon="person" title="등록된 거주자가 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2">
          {residents.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3"
            >
              <Icon name="person" className="text-brand-500" />
              <div className="flex-1">
                <p className="text-base text-brand-900">{r.name}</p>
                <p className="text-sm text-brand-700">
                  {r.unitLabel ? `${r.unitLabel} · ` : ""}
                  {r.phoneNumber || "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ManagersTab({
  bid,
  memberships,
  canEdit,
  onUpdated,
}: {
  bid: string;
  memberships: Membership[];
  canEdit: boolean;
  onUpdated: (list: Membership[]) => void;
}) {
  const [uid, setUid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const active = memberships.filter((m) => m.status === "active");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim() || submitting) return;
    setSubmitting(true);
    try {
      await upsertMembership(bid, {
        userId: uid.trim(),
        role: "cleaning_manager",
      });
      const next = await listMemberships(bid);
      onUpdated(next);
      setUid("");
      toast.success("관리자가 추가되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {canEdit && (
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="관리자 UID"
            className="flex-1 rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-tap items-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            추가
          </button>
        </form>
      )}
      {active.length === 0 ? (
        <EmptyState icon="manage_accounts" title="등록된 관리자가 없습니다" />
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3"
            >
              <Icon name="manage_accounts" className="text-brand-500" />
              <div className="flex-1">
                <p className="text-base text-brand-900">{m.userId}</p>
                <p className="text-sm text-brand-700">
                  {m.role === "super_manager" ? "슈퍼관리자" : "청소관리자"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
