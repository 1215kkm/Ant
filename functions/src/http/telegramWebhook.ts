import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { Bot, webhookCallback } from "grammy";
import { adminDb } from "../services/admin";
import { TELEGRAM_BOT_TOKEN } from "../services/telegram";

/**
 * 텔레그램 봇 webhook.
 * 1) `/start <code>`로 들어오면 telegramLinks 문서에서 사용자를 찾아 chatId 매핑
 * 2) `/help`, `/unlink` 등 보조 명령
 *
 * 배포 후 https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FN_URL>로 1회 등록.
 */
export const telegramWebhook = onRequest(
  {
    secrets: [TELEGRAM_BOT_TOKEN],
    invoker: "public",
  },
  async (req, res) => {
    const bot = new Bot(TELEGRAM_BOT_TOKEN.value());

    bot.command("start", async (ctx) => {
      const arg = (ctx.match || "").trim();
      const chatId = String(ctx.chat.id);

      if (!arg) {
        await ctx.reply(
          "안녕하세요! 개미청소 알림 봇입니다.\n앱 설정에서 발급받은 6자리 코드를 보내주세요:\n`/start 123456`",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const snap = await adminDb
        .collection("telegramLinks")
        .where("pendingCode", "==", arg)
        .limit(1)
        .get();
      if (snap.empty) {
        await ctx.reply("코드가 일치하지 않습니다. 앱에서 새 코드를 발급받아 주세요.");
        return;
      }
      const doc = snap.docs[0];
      const data = doc.data();
      const expires = data.pendingCodeExpiresAt as Timestamp | undefined;
      if (expires && expires.toMillis() < Date.now()) {
        await ctx.reply("코드가 만료되었습니다. 앱에서 새 코드를 발급받아 주세요.");
        return;
      }

      await doc.ref.set(
        {
          chatId,
          telegramUsername: ctx.from?.username ?? null,
          pendingCode: FieldValue.delete(),
          pendingCodeExpiresAt: FieldValue.delete(),
          linkedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await ctx.reply(
        "✅ 연동 완료!\n이제 새 요청, 관리비, 보고서 알림을 여기로 받으실 수 있어요.",
      );
    });

    bot.command("help", async (ctx) => {
      await ctx.reply(
        "사용 가능한 명령:\n" +
          "`/start <코드>` — 앱 계정과 연동\n" +
          "`/unlink` — 연동 해제",
        { parse_mode: "Markdown" },
      );
    });

    bot.command("unlink", async (ctx) => {
      const chatId = String(ctx.chat.id);
      const snap = await adminDb
        .collection("telegramLinks")
        .where("chatId", "==", chatId)
        .limit(1)
        .get();
      if (snap.empty) {
        await ctx.reply("이 채팅에 연동된 계정이 없습니다.");
        return;
      }
      await snap.docs[0].ref.set(
        {
          chatId: FieldValue.delete(),
          linkedAt: FieldValue.delete(),
        },
        { merge: true },
      );
      await ctx.reply("연동이 해제되었습니다.");
    });

    bot.catch((err) => {
      logger.error("telegram bot error", err);
    });

    return webhookCallback(bot, "express")(req, res);
  },
);
