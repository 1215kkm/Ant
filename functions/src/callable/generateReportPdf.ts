import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { buildAndSendReport } from "../services/reportBuilder";
import { TELEGRAM_BOT_TOKEN } from "../services/telegram";
import { MAILER_SECRETS } from "../services/mailer";

const Input = z.object({
  buildingId: z.string().min(1),
  kind: z.enum(["weekly", "monthly"]),
  periodStart: z.string(), // ISO date
  periodEnd: z.string(),
});

/**
 * 매니저가 즉시 보고서를 생성/재생성하기 위한 callable.
 * 알림 fan-out도 함께 수행한다.
 */
export const generateReportPdf = onCall<z.infer<typeof Input>>(
  {
    secrets: [TELEGRAM_BOT_TOKEN, ...MAILER_SECRETS],
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const role = req.auth.token.role;
    if (role !== "cleaning_manager" && role !== "super_manager") {
      throw new HttpsError("permission-denied", "관리자만 생성할 수 있습니다.");
    }
    const parsed = Input.safeParse(req.data);
    if (!parsed.success) throw new HttpsError("invalid-argument", parsed.error.message);

    const reportId = await buildAndSendReport({
      buildingId: parsed.data.buildingId,
      kind: parsed.data.kind,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
    });
    return { ok: true, reportId };
  },
);
