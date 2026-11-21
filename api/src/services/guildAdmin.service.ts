import { GuildRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitToUser } from '../sockets/hub';
import { getUserGuild } from './guilds.service';

/** Guild management beyond create / join / leave: roles, settings, chat, invitations. */

export const GUILD_CHAT_PAGE = 40;

const err = (msg: string, status: number) => Object.assign(new Error(msg), { status });

const membershipOf = async (userId: number) => {
  const membership = await prisma.guildMember.findUnique({ where: { userId } });
  if (!membership) throw err("Vous n'êtes dans aucune guilde.", 404);
  return membership;
};

const requireLeader = async (userId: number) => {
  const membership = await membershipOf(userId);
  if (membership.role !== 'LEADER') throw err('Réservé au leader.', 403);
  return membership;
};

const memberIdsOf = async (guildId: number): Promise<number[]> =>
  (await prisma.guildMember.findMany({ where: { guildId }, select: { userId: true } })).map((m) => m.userId);

const notifyGuild = async (guildId: number, exceptUserId?: number) => {
  for (const id of await memberIdsOf(guildId)) {
    if (id !== exceptUserId) emitToUser(id, 'social:update', { kind: 'guild' });
  }
};

// ── Settings ────────────────────────────────────────────────────────────────

export async function updateGuild(
  userId: number,
  patch: { name?: string; description?: string | null; isOpen?: boolean },
) {
  const membership = await requireLeader(userId);

  if (patch.name) {
    const taken = await prisma.guild.findFirst({
      where: { name: { equals: patch.name, mode: 'insensitive' }, NOT: { id: membership.guildId } },
    });
    if (taken) throw err('Ce nom est déjà pris.', 409);
  }

  await prisma.guild.update({ where: { id: membership.guildId }, data: patch });
  await notifyGuild(membership.guildId, userId);
  return getUserGuild(userId);
}

export async function dissolveGuild(userId: number) {
  const membership = await requireLeader(userId);
  const members = await memberIdsOf(membership.guildId);
  await prisma.guild.delete({ where: { id: membership.guildId } });
  members.filter((id) => id !== userId).forEach((id) => emitToUser(id, 'social:update', { kind: 'guild' }));
}

// ── Roles ───────────────────────────────────────────────────────────────────

export async function setMemberRole(userId: number, targetUserId: number, role: Exclude<GuildRole, 'LEADER'>) {
  const membership = await requireLeader(userId);
  if (targetUserId === userId) throw err('Impossible de modifier son propre rôle.', 400);

  const changed = await prisma.guildMember.updateMany({
    where: { userId: targetUserId, guildId: membership.guildId, role: { not: 'LEADER' } },
    data: { role },
  });
  if (changed.count !== 1) throw err('Membre introuvable.', 404);
  await notifyGuild(membership.guildId, userId);
  return getUserGuild(userId);
}

export async function transferLeadership(userId: number, targetUserId: number) {
  const membership = await requireLeader(userId);
  if (targetUserId === userId) throw err('Vous êtes déjà leader.', 400);
  const target = await prisma.guildMember.findUnique({ where: { userId: targetUserId } });
  if (!target || target.guildId !== membership.guildId) throw err('Membre introuvable.', 404);

  await prisma.$transaction([
    prisma.guildMember.update({ where: { userId: targetUserId }, data: { role: 'LEADER' } }),
    prisma.guildMember.update({ where: { userId }, data: { role: 'OFFICER' } }),
  ]);
  await notifyGuild(membership.guildId, userId);
  return getUserGuild(userId);
}

// ── Chat ────────────────────────────────────────────────────────────────────

export interface GuildMessageDTO {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  sentAt: string;
}

export async function getGuildMessages(userId: number, before?: number, limit = GUILD_CHAT_PAGE) {
  const membership = await membershipOf(userId);
  const page = await prisma.guildMessage.findMany({
    where: { guildId: membership.guildId, ...(before ? { id: { lt: before } } : {}) },
    orderBy: { id: 'desc' },
    take: limit + 1,
    include: { sender: { select: { Username: true } } },
  });
  return {
    hasMore: page.length > limit,
    messages: page
      .slice(0, limit)
      .reverse()
      .map<GuildMessageDTO>((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderUsername: m.sender.Username,
        content: m.content,
        sentAt: m.sentAt.toISOString(),
      })),
  };
}

export async function postGuildMessage(userId: number, content: string): Promise<GuildMessageDTO> {
  const membership = await membershipOf(userId);
  const msg = await prisma.guildMessage.create({
    data: { guildId: membership.guildId, senderId: userId, content: content.trim() },
    include: { sender: { select: { Username: true } } },
  });
  const dto: GuildMessageDTO = {
    id: msg.id,
    senderId: msg.senderId,
    senderUsername: msg.sender.Username,
    content: msg.content,
    sentAt: msg.sentAt.toISOString(),
  };
  for (const id of await memberIdsOf(membership.guildId)) {
    if (id !== userId) emitToUser(id, 'guild:message', { message: dto });
  }
  return dto;
}

// ── Invitations (the way into a closed guild) ───────────────────────────────

export async function invitePlayer(userId: number, username: string) {
  const membership = await membershipOf(userId);
  if (membership.role === 'MEMBER') throw err('Permission insuffisante.', 403);

  const target = await prisma.users.findFirst({
    where: { Username: { equals: username, mode: 'insensitive' }, isGuest: false, archived: false },
    select: { ID_User: true, Username: true, GuildMembership: { select: { id: true } } },
  });
  if (!target) throw err('Utilisateur introuvable !', 404);
  if (target.GuildMembership) throw err('Ce joueur est déjà dans une guilde.', 409);

  await prisma.guildInvite.upsert({
    where: { guildId_userId: { guildId: membership.guildId, userId: target.ID_User } },
    update: { invitedById: userId },
    create: { guildId: membership.guildId, userId: target.ID_User, invitedById: userId },
  });
  emitToUser(target.ID_User, 'social:update', { kind: 'guild' });
  return { username: target.Username };
}

export async function listMyInvites(userId: number) {
  const invites = await prisma.guildInvite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      guild: { select: { id: true, name: true, tag: true, maxMembers: true, _count: { select: { members: true } } } },
      invitedBy: { select: { Username: true } },
    },
  });
  return invites.map((i) => ({
    id: i.id,
    guild: {
      id: i.guild.id,
      name: i.guild.name,
      tag: i.guild.tag,
      memberCount: i.guild._count.members,
      maxMembers: i.guild.maxMembers,
    },
    invitedBy: i.invitedBy.Username,
    createdAt: i.createdAt.toISOString(),
  }));
}

export async function acceptInvite(userId: number, inviteId: number) {
  const invite = await prisma.guildInvite.findUnique({
    where: { id: inviteId },
    include: { guild: { select: { maxMembers: true, _count: { select: { members: true } } } } },
  });
  if (!invite || invite.userId !== userId) throw err('Invitation introuvable.', 404);
  if (await prisma.guildMember.findUnique({ where: { userId } })) {
    throw err("Vous êtes déjà membre d'une guilde.", 409);
  }
  if (invite.guild._count.members >= invite.guild.maxMembers) throw err('La guilde est complète.', 409);

  await prisma.$transaction([
    prisma.guildMember.create({ data: { guildId: invite.guildId, userId, role: 'MEMBER' } }),
    // Joining a guild voids every other invitation.
    prisma.guildInvite.deleteMany({ where: { userId } }),
  ]);
  await notifyGuild(invite.guildId, userId);
  return getUserGuild(userId);
}

export async function declineInvite(userId: number, inviteId: number) {
  const gone = await prisma.guildInvite.deleteMany({ where: { id: inviteId, userId } });
  if (gone.count !== 1) throw err('Invitation introuvable.', 404);
}
