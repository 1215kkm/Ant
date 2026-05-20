import type { Timestamp } from "firebase/firestore";
import type { Role } from "@/lib/auth/roles";

export type Building = {
  id: string;
  name: string;
  address: string;
  addressDetail?: string;
  ownerIds: string[];
  managerIds: string[];
  unitsCount: number;
  residentsCount: number;
  thumbnailUrl?: string;
  stats?: {
    openRequests?: number;
    monthlyRequests?: number;
    lastReportAt?: Timestamp;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Unit = {
  id: string;
  buildingId: string;
  /** 동·호수 표기, 예: "101-502" 또는 "502" */
  label: string;
  floor?: number;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Resident = {
  id: string;
  buildingId: string;
  unitId?: string;
  unitLabel?: string;
  uid?: string; // 가입한 사용자와 연결된 경우
  name: string;
  phoneNumber?: string;
  movedInAt?: Timestamp;
  movedOutAt?: Timestamp;
  stats?: {
    total: number;
    completionRate: number;
    lastRequestAt?: Timestamp;
    byCategory?: Record<string, number>;
    byStatus?: Record<string, number>;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Membership = {
  id: string; // `${userId}_${buildingId}`
  userId: string;
  buildingId: string;
  role: "cleaning_manager" | "super_manager";
  permissions?: {
    invoices?: boolean;
    reports?: boolean;
    memos?: boolean;
  };
  invitedBy?: string;
  joinedAt?: Timestamp;
  status: "active" | "revoked";
};

export type Memo = {
  id: string;
  residentId: string;
  residentName: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type RequestStatus =
  | "received"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "on_hold";

export const REQUEST_STATUS_LABEL_KO: Record<RequestStatus, string> = {
  received: "접수",
  confirmed: "확인",
  in_progress: "진행중",
  completed: "완료",
  on_hold: "보류",
};

export const REQUEST_STATUS_FLOW: RequestStatus[] = [
  "received",
  "confirmed",
  "in_progress",
  "completed",
];

export type RequestType = "repair" | "inquiry";

export const REQUEST_TYPE_LABEL_KO: Record<RequestType, string> = {
  repair: "수리 요청",
  inquiry: "문의",
};

export type RequestMedia = {
  kind: "image" | "video";
  path: string;
  url: string;
  thumbUrl?: string;
  sizeBytes?: number;
  durationSec?: number;
};

export type ServiceRequest = {
  id: string;
  requestNumber?: string;
  type: RequestType;
  category?: string;
  title: string;
  description: string;
  buildingId: string;
  unitId?: string;
  unitLabel?: string;
  /** 거주자 문서 ID (buildings/{bid}/residents/{residentId}). 통계 집계용. */
  residentId: string;
  /** 요청 소유자(거주자)의 Firebase Auth UID. 보안 규칙·내 요청 조회·알림용. */
  residentUid: string;
  residentName?: string;
  managerIds: string[];
  status: RequestStatus;
  priority?: "low" | "normal" | "high";
  media?: RequestMedia[];
  assignedTo?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
};

export type InvoiceStatus = "issued" | "sent" | "partial" | "paid" | "overdue";

export const INVOICE_STATUS_LABEL_KO: Record<InvoiceStatus, string> = {
  issued: "발행",
  sent: "발송됨",
  partial: "일부납",
  paid: "완납",
  overdue: "연체",
};

export type InvoiceAttachment = {
  kind: "pdf" | "image";
  path: string;
  url: string;
  name?: string;
};

export type Invoice = {
  id: string;
  buildingId: string;
  buildingName?: string;
  /** YYYY-MM */
  period: string;
  amount: number;
  currency: "KRW";
  attachments: InvoiceAttachment[];
  recipients: { ownerUids: string[] };
  status: InvoiceStatus;
  dueDate?: Timestamp;
  sentAt?: Timestamp;
  paidAt?: Timestamp;
  remindersSent: number;
  lastReminderAt?: Timestamp;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ReportKind = "weekly" | "monthly";

export type ReportSummary = {
  totalRequests: number;
  completed: number;
  pending: number;
  byCategory?: Record<string, number>;
  byStatus?: Record<string, number>;
  invoicesIssued?: number;
  invoicesPaid?: number;
  invoicesOverdue?: number;
};

export type Report = {
  id: string;
  buildingId: string;
  buildingName?: string;
  kind: ReportKind;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  summary: ReportSummary;
  pdfPath?: string;
  pdfUrl?: string;
  emailedAt?: Timestamp;
  telegramSentAt?: Timestamp;
  generatedAt?: Timestamp;
  generatedBy: "system" | string;
};

export type BlogImage = {
  path: string;
  url: string;
  width?: number;
  height?: number;
};

export type BeforeAfter = {
  before: BlogImage;
  after: BlogImage;
  caption?: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  heroImage?: BlogImage;
  beforeAfter: BeforeAfter[];
  tags: string[];
  buildingId?: string;
  authorId: string;
  authorName?: string;
  published: boolean;
  publishedAt?: Timestamp;
  viewCount?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type AppUser = {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  role: Role;
  buildingIds: string[];
  pushEnabled?: boolean;
  telegramChatId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
