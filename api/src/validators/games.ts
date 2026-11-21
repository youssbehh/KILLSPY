import { z } from 'zod';

export const recordGameSchema = z.object({
  outcome: z.enum(['won', 'lost', 'draw']),
  // PvP results are recorded by the server itself at the end of a socket match.
  // A client may only report training (PvE) games, which are never persisted.
  mode: z.literal('pve'),
  rounds: z.number().int().min(1).max(200).optional(),
});

export const pageQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RecordGameInput = z.infer<typeof recordGameSchema>;
