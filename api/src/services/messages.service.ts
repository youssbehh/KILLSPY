import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

/** All friends who have exchanged at least one message, with last message preview */
export async function getInbox(userId: number): Promise<ConversationSummary[]> {
  // Find all unique conversation partners
  const sent = await prisma.directMessage.findMany({
    where: { senderId: userId },
    select: { receiverId: true },
    distinct: ['receiverId'],
  });
  const received = await prisma.directMessage.findMany({
    where: { receiverId: userId },
    select: { senderId: true },
    distinct: ['senderId'],
  });

  const partnerIds = [
    ...new Set([
      ...sent.map((m) => m.receiverId),
      ...received.map((m) => m.senderId),
    ]),
  ];

  const result: ConversationSummary[] = [];
  for (const partnerId of partnerIds) {
    const last = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { sentAt: 'desc' },
      include: { sender: { select: { Username: true } }, receiver: { select: { Username: true, ID_User: true } } },
    });
    const unread = await prisma.directMessage.count({
      where: { senderId: partnerId, receiverId: userId, readAt: null },
    });
    const partnerUser = await prisma.users.findUnique({ where: { ID_User: partnerId }, select: { Username: true } });
    result.push({
      friendId: partnerId,
      friendUsername: partnerUser?.Username ?? `User#${partnerId}`,
      lastMessage: last?.content?.slice(0, 60) ?? null,
      lastAt: last?.sentAt.toISOString() ?? null,
      unreadCount: unread,
    });
  }

  return result.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
}

/** Messages between two users (last 100) */
export async function getConversation(userId: number, partnerId: number): Promise<MessageDTO[]> {
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    orderBy: { sentAt: 'asc' },
    take: 100,
    include: { sender: { select: { Username: true } } },
  });

  // Mark received messages as read
  await prisma.directMessage.updateMany({
    where: { senderId: partnerId, receiverId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderUsername: m.sender.Username,
    content: m.content,
    sentAt: m.sentAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  }));
}

export async function sendMessage(senderId: number, receiverId: number, content: string): Promise<MessageDTO> {
  if (!content.trim()) throw Object.assign(new Error('Message vide.'), { status: 400 });
  if (content.length > 500) throw Object.assign(new Error('Message trop long (500 chars max).'), { status: 400 });

  // Check they are friends
  const friendship = await prisma.friends.findFirst({
    where: {
      OR: [
        { ID_User: senderId, ID_Friend: receiverId, Blocked: false },
        { ID_User: receiverId, ID_Friend: senderId, Blocked: false },
      ],
    },
  });
  if (!friendship) throw Object.assign(new Error('Vous ne pouvez envoyer un message qu\'à vos amis.'), { status: 403 });

  const msg = await prisma.directMessage.create({
    data: { senderId, receiverId, content: content.trim() },
    include: { sender: { select: { Username: true } } },
  });

  return {
    id: msg.id,
    senderId: msg.senderId,
    senderUsername: msg.sender.Username,
    content: msg.content,
    sentAt: msg.sentAt.toISOString(),
    readAt: null,
  };
}
