import { onRequest } from "firebase-functions/v2/https";

/** Functions 배포 검증용 단순 헬스체크. */
export const healthcheck = onRequest({ cors: true }, (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "ant-cleaning-functions",
    timestamp: new Date().toISOString(),
  });
});
