import { Bot, InlineKeyboard } from "grammy";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { adminDb } from "./admin";

export const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");

let _bot: Bot | null = null;

export function getBot(): Bot {
  if (_bot) return _bot;
  const token = TELEGRAM_BOT_TOKEN.value();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN secret is not configured");
  }
  _bot = new Bot(token);
  return _bot;
}

export type TelegramMessage = {
  title: string;
  body: string;
  href?: string;
  appUrl?: string;
};

/** 사용자에게 메시지 전송. 연동된 chatId가 없으면 스킵. */
export async function sendTelegramToUser(
  uid: string,
  msg: TelegramMessage,
): Promise<boolean> {
  const linkSnap = await adminDb.doc(`telegramLinks/${uid}`).get();
  const chatId = linkSnap.data()?.chatId as string | undefined;
  if (!chatId) return false;

  const text =
    `<b>${escapeHtml(msg.title)}</b>\n` +
    `${escapeHtml(msg.body)}`;

  const keyboard = new InlineKeyboard();
  if (msg.href && msg.appUrl) {
    keyboard.url("앱에서 보기", `${msg.appUrl}${msg.href}`);
  }

  try {
    await getBot().api.sendMessage(chatId, text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined,
    });
    return true;
  } catch (err) {
    logger.warn("telegram send failed", { uid, err });
    return false;
  }
}

export async function sendTelegramToUsers(
  uids: string[],
  msg: TelegramMessage,
): Promise<number> {
  let count = 0;
  await Promise.all(
    uids.map((uid) =>
      sendTelegramToUser(uid, msg).then((ok) => {
        if (ok) count++;
      }),
    ),
  );
  return count;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
