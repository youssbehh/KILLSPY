import { GuildRole, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GUILD_CREATE_COST = 5_000; // coins — requires real grind to afford
const MAX_MEMBERS = 30;

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface GuildDTO {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  isOpen: boolean;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  myRole: GuildRole | null;
}

export interface GuildMemberDTO {
  userId: number;
  username: string;
  mmr: number;
  role: GuildRole;
  joinedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function err(msg: string, status: number): Error {
  return Object.assign(new Error(msg), { status });
}

// ── Service functions ─────────────────────────────────────────────────────

export async function listGuilds(search?: string): Promise<GuildDTO[]> {
  const guilds = await prisma.guild.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { tag: { contains: search, mode: 'insensitive' } }] }
      : undefined,
    include: { members: true },
    orderBy: { members: { _count: 'desc' } },
    take: 30,
  });
  return guilds.map((g) => ({
    id: g.id,
    name: g.name,
    tag: g.tag,
    description: g.description,
    isOpen: g.isOpen,
    memberCount: g.members.length,
    maxMembers: g.maxMembers,
    createdAt: g.createdAt.toISOString(),
    myRole: null,
  }));
}

export async function getUserGuild(userId: number): Promise<(GuildDTO & { members: GuildMemberDTO[] }) | null> {
  const membership = await prisma.guildMember.findUnique({
    where: { userId },
    include: {
      guild: {
        include: {
          members: {
            include: { user: { select: { ID_User: true, Username: true, MMR: true } } },
            orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
          },
        },
      },
    },
  });
  if (!membership) return null;
  const g = membership.guild;
  return {
    id: g.id,
    name: g.name,
    tag: g.tag,
    description: g.description,
    isOpen: g.isOpen,
    memberCount: g.members.length,
    maxMembers: g.maxMembers,
    createdAt: g.createdAt.toISOString(),
    myRole: membership.role,
    members: g.members.map((m) => ({
      userId: m.user.ID_User,
      username: m.user.Username,
      mmr: m.user.MMR,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
  };
}

export async function createGuild(userId: number, name: string, tag: string, description?: string) {
  // Check user has no guild
  const existing = await prisma.guildMember.findUnique({ where: { userId } });
  if (existing) throw err('Vous êtes déjà membre d\'une guilde.', 409);

  // Check funds
  const user = await prisma.users.findUnique({ where: { ID_User: userId } });
  if (!user) throw err('Utilisateur introuvable.', 404);
  if (user.Money < GUILD_CREATE_COST) {
    throw err(`Fonds insuffisants. Il faut ${GUILD_CREATE_COST.toLocaleString()} pièces pour fonder une unité.`, 402);
  }

  // Validate tag (2-5 uppercase letters/digits)
  const cleanTag = tag.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanTag.length < 2 || cleanTag.length > 5) throw err('Le tag doit contenir 2 à 5 caractères alphanumériques.', 400);

  // Atomic: deduct money + create guild + add leader
  await prisma.$transaction(async (tx) => {
    await tx.users.update({ where: { ID_User: userId }, data: { Money: { decrement: GUILD_CREATE_COST } } });
    const guild = await tx.guild.create({ data: { name, tag: cleanTag, description, isOpen: true } });
    await tx.guildMember.create({ data: { guildId: guild.id, userId, role: 'LEADER' } });
    return guild;
  });

  return getUserGuild(userId);
}

export async function joinGuild(userId: number, guildId: number) {
  const existing = await prisma.guildMember.findUnique({ where: { userId } });
  if (existing) throw err('Vous êtes déjà membre d\'une guilde.', 409);

  const guild = await prisma.guild.findUnique({ where: { id: guildId }, include: { members: true } });
  if (!guild) throw err('Guilde introuvable.', 404);
  if (!guild.isOpen) throw err('Cette guilde n\'accepte pas de nouveaux membres.', 403);
  if (guild.members.length >= guild.maxMembers) throw err('La guilde est complète.', 409);

  await prisma.guildMember.create({ data: { guildId, userId, role: 'MEMBER' } });
  return getUserGuild(userId);
}

export async function leaveGuild(userId: number) {
  const membership = await prisma.guildMember.findUnique({ where: { userId }, include: { guild: { include: { members: true } } } });
  if (!membership) throw err('Vous n\'êtes dans aucune guilde.', 404);

  if (membership.role === 'LEADER') {
    const others = membership.guild.members.filter((m) => m.userId !== userId);
    if (others.length === 0) {
      // Last member — dissolve guild
      await prisma.guild.delete({ where: { id: membership.guildId } });
    } else {
      // Transfer leadership to oldest officer or oldest member
      const next = others.find((m) => m.role === 'OFFICER') ?? others[0];
      await prisma.$transaction([
        prisma.guildMember.update({ where: { userId: next.userId }, data: { role: 'LEADER' } }),
        prisma.guildMember.delete({ where: { userId } }),
      ]);
    }
  } else {
    await prisma.guildMember.delete({ where: { userId } });
  }
}

export async function kickMember(requesterId: number, targetUserId: number) {
  const requester = await prisma.guildMember.findUnique({ where: { userId: requesterId } });
  const target = await prisma.guildMember.findUnique({ where: { userId: targetUserId } });
  if (!requester || !target) throw err('Membre introuvable.', 404);
  if (requester.guildId !== target.guildId) throw err('Pas dans la même guilde.', 403);
  if (requester.role === 'MEMBER') throw err('Permission insuffisante.', 403);
  if (target.role === 'LEADER') throw err('Impossible d\'expulser le leader.', 403);
  await prisma.guildMember.delete({ where: { userId: targetUserId } });
}
