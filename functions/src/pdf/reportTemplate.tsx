import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Pretendard Variable (OFL) self-host URL. 운영 시 자체 Storage에 업로드 권장.
const PRETENDARD_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf";
const PRETENDARD_BOLD_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf";

let registered = false;
function ensureFont(): void {
  if (registered) return;
  Font.register({
    family: "Pretendard",
    fonts: [
      { src: PRETENDARD_URL, fontWeight: 400 },
      { src: PRETENDARD_BOLD_URL, fontWeight: 700 },
    ],
  });
  registered = true;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Pretendard",
    fontSize: 10,
    color: "#0B1B2B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#2E9CF2",
    paddingBottom: 12,
    marginBottom: 16,
  },
  brand: { fontSize: 16, fontWeight: 700, color: "#1668AA" },
  subtitle: { fontSize: 10, color: "#1B82D6", marginLeft: 8 },
  h1: { fontSize: 18, fontWeight: 700, color: "#0B3F6B", marginBottom: 4 },
  meta: { fontSize: 9, color: "#1668AA", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0B3F6B",
    marginBottom: 6,
  },
  metricsRow: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    backgroundColor: "#EFF8FF",
    padding: 10,
    borderRadius: 6,
  },
  metricLabel: { fontSize: 9, color: "#1668AA" },
  metricValue: { fontSize: 16, fontWeight: 700, color: "#0B3F6B" },
  table: { marginTop: 4 },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBEEFE",
  },
  th: { fontSize: 9, fontWeight: 700, color: "#1668AA", flex: 1 },
  td: { fontSize: 10, color: "#0B1B2B", flex: 1 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#5FB4F8",
    textAlign: "center",
  },
});

export type ReportTemplateProps = {
  buildingName: string;
  kind: "weekly" | "monthly";
  periodStart: Date;
  periodEnd: Date;
  summary: {
    totalRequests: number;
    completed: number;
    pending: number;
    byCategory?: Record<string, number>;
    byStatus?: Record<string, number>;
    invoicesIssued?: number;
    invoicesPaid?: number;
    invoicesOverdue?: number;
  };
  requestSamples?: Array<{
    requestNumber?: string;
    title: string;
    status: string;
    unitLabel?: string;
    createdAt?: Date;
  }>;
};

const STATUS_KO: Record<string, string> = {
  received: "접수",
  confirmed: "확인",
  in_progress: "진행중",
  completed: "완료",
  on_hold: "보류",
};

export function ReportTemplate(props: ReportTemplateProps) {
  ensureFont();
  const kindLabel = props.kind === "weekly" ? "주간 보고서" : "월간 보고서";
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const categoryEntries = Object.entries(props.summary.byCategory ?? {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>개미청소</Text>
          <Text style={styles.subtitle}>건물관리 자동 보고서</Text>
        </View>

        <Text style={styles.h1}>
          {props.buildingName} {kindLabel}
        </Text>
        <Text style={styles.meta}>
          기간: {fmt(props.periodStart)} ~ {fmt(props.periodEnd)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>요청 현황</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>총 요청</Text>
              <Text style={styles.metricValue}>{props.summary.totalRequests}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>완료</Text>
              <Text style={styles.metricValue}>{props.summary.completed}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>미완료</Text>
              <Text style={styles.metricValue}>{props.summary.pending}</Text>
            </View>
          </View>
        </View>

        {categoryEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>분류별 요청</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.th}>분류</Text>
                <Text style={styles.th}>건수</Text>
              </View>
              {categoryEntries.map(([k, v]) => (
                <View key={k} style={styles.row}>
                  <Text style={styles.td}>{k}</Text>
                  <Text style={styles.td}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {props.requestSamples && props.requestSamples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주요 처리 내역</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.th}>번호</Text>
                <Text style={[styles.th, { flex: 3 }]}>제목</Text>
                <Text style={styles.th}>호실</Text>
                <Text style={styles.th}>상태</Text>
              </View>
              {props.requestSamples.slice(0, 20).map((r, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.td}>{r.requestNumber || "—"}</Text>
                  <Text style={[styles.td, { flex: 3 }]}>{r.title}</Text>
                  <Text style={styles.td}>{r.unitLabel || "—"}</Text>
                  <Text style={styles.td}>{STATUS_KO[r.status] || r.status}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(props.summary.invoicesIssued ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관리비 현황</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>발행</Text>
                <Text style={styles.metricValue}>
                  {props.summary.invoicesIssued ?? 0}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>완납</Text>
                <Text style={styles.metricValue}>
                  {props.summary.invoicesPaid ?? 0}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>연체</Text>
                <Text style={styles.metricValue}>
                  {props.summary.invoicesOverdue ?? 0}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          개미청소 · 본 보고서는 자동 생성되었습니다 · {fmt(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
