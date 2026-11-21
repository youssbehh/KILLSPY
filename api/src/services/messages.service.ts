import { prisma } from '../lib/prisma';
import { emitToUser } from '../sockets/hub';
import { areFriends, isBlockedEitherWay } from './social.service';

export interface MessageDTO {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}

export interface ConversationSummary {
  friendId: number;
  friendUsername: string;
  lastMessage: string | null;
  lastAt: string | null;
  unreadCount: number;
}

export const DM_PAGE_SIZE = 30;

const err = (msg: string, status: number) => Object.assign(new Error(msg), { status });

/** Every conversation of the user with its last message and unread count (3 queries in total). */
export async function getInbox(userId: number): Promise<ConversationSummary[]> {
  // Newest message first: the first one seen for a partner is that conversation's last message.
  const recent = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { id: 'desc' },
    take: 500,
    select: { senderId: true, receiverId: true, content: true, sentAt: true },
  });

  const lastByPartner = new Map<number, { content: string; sentAt: Date }>();
  for (const m of recent) {
    const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
    if (!lastByPartner.has(partnerId)) lastByPartner.set(partnerId, { content: m.content, sentAt: m.sentAt });
  }
  const partnerIds = [...lastByPartner.keys()];
  if (partnerIds.length === 0) return [];

  const [unread, partners] = await Promise.all([
    prisma.directMessage.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, readAt: null, senderId: { in: partnerIds } },
      _count: { _all: true },
    }),
    prisma.users.findMany({
      where: { ID_User: { in: partnerIds } },
      select: { ID_User: true, Username: true },
    }),
  ]);
  const unreadBy = new Map(unread.map((u) => [u.senderId, u._count._all]));
  const nameBy = new Map(partners.map((p) => [p.ID_User, p.Username]));

  return partnerIds.map((partnerId) => {
    const last = lastByPartner.get(partnerId)!;
    return {
      friendId: partnerId,
      friendUsername: nameBy.get(partnerId) ?? `User#${partnerId}`,
      lastMessage: last.content.slice(0, 60),
      lastAt: last.sentAt.toISOString(),
      unreadCount: unreadBy.get(partnerId) ?? 0,
    };
  });
}

/**
 * One page of a conversation, oldest → newest.
 * `before` is the id of the oldest message already loaded (omit for the latest page).
 */
export async function getConversation(
  userId: number,
  partnerId: number,
  before?: number,
  limit = DM_PAGE_SIZE,
): Promise<{ messages: MessageDTO[]; hasMore: boolean }> {
  const page = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
      ...(before ? { id: { lt: before } } : {}),
    },
    orderBy: { id: 'desc' },
    take: limit + 1,
    include: { sender: { select: { Username: true } } },
  });

  const hasMore = page.length > limit;
  const messages = page.slice(0, limit).reverse();

  // Opening the latest page marks what was received as read.
  if (!before) {
    await prisma.directMessage.updateMany({
      where: { senderId: partnerId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return {
    hasMore,
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderUsername: m.sender.Username,
      content: m.content,
      sentAt: m.sentAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
  };
}

export async function sendMessage(senderId: number, receiverId: number, content: string): Promise<MessageDTO> {
  const text = content.trim();
  if (!text) throw err('Message vide.', 400);
  if (text.length > 500) throw err('Message trop long (500 caractères max).', 400);

  if ((await isBlockedEitherWay(senderId, receiverId)) || !(await areFriends(senderId, receiverId))) {
    throw err("Vous ne pouvez envoyer un message qu'à vos amis.", 403);
  }

  const msg = await prisma.directMessage.create({
    data: { senderId, receiverId, content: text },
    include: { sender: { select: { Username: true } } },
  });

  const dto: MessageDTO = {
    id: msg.id,
    senderId: msg.senderId,
    senderUsername: msg.sender.Username,
    content: msg.content,
    sentAt: msg.sentAt.toISOString(),
    readAt: null,
  };
  emitToUser(receiverId, 'dm:new', { fromId: senderId, message: dto });
  return dto;
}
