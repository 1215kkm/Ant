import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions/v2";
import { ReportTemplate, type ReportTemplateProps } from "./reportTemplate";

export type RenderedReport = {
  pdfPath: string;
  pdfUrl: string;
};

/**
 * 보고서 PDF를 생성하고 Storage에 업로드, 7일짜리 signed URL을 함께 반환.
 */
export async function renderAndUploadReport(
  buildingId: string,
  reportId: string,
  props: ReportTemplateProps,
): Promise<RenderedReport> {
  const buffer = await renderToBuffer(
    React.createElement(ReportTemplate, props) as React.ReactElement<DocumentProps>,
  );
  const path = `reports/${buildingId}/${reportId}.pdf`;
  const bucket = getStorage().bucket();
  const file = bucket.file(path);
  await file.save(buffer, {
    contentType: "application/pdf",
    metadata: { cacheControl: "public, max-age=86400" },
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  logger.info("report PDF uploaded", { path, size: buffer.length });
  return { pdfPath: path, pdfUrl: url };
}
