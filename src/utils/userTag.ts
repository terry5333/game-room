/**
 * 玩家專屬 4 位數字代碼格式化工具 (例: "0215", "8823")
 * 保證絕不回傳 UID 英文亂碼 (如 "eYBm")
 */
export function getCleanUserTag(user: any, fallback: string = '0215'): string {
  if (!user) return fallback;

  // 1. 若本身已有 userTag，且符合或接近 4 碼
  const raw = user.userTag ?? user.tag;
  if (raw !== undefined && raw !== null) {
    const s = String(raw).trim().replace(/^#/, '');
    if (/^\d{4}$/.test(s)) {
      return s;
    }
    if (s.length > 0 && !/[a-zA-Z]/.test(s)) {
      return s.padStart(4, '0').slice(-4);
    }
    if (s.length > 0) {
      return s;
    }
  }

  // 2. 若無 userTag，由 uid 演算確定性 4 碼純數字 (1000 ~ 9999)，絕不顯示英文 UID 字串
  if (user.uid) {
    const uidStr = String(user.uid);
    let hash = 0;
    for (let i = 0; i < uidStr.length; i++) {
      hash = (hash * 31 + uidStr.charCodeAt(i)) % 9000;
    }
    return String(1000 + Math.abs(hash));
  }

  return fallback;
}
