import { z } from 'zod';

export const recordGameSchema = z.object({
  outcome: z.enum(['won', 'lost', 'draw']),
  // PvP results are recorded by the server itself at the end of a socket match.
  // A client may only report training (PvE) games, which are never persisted.
  mode: z.literal('pve'),
});

export type RecordGameInput = z.infer<typeof recordGameSchema>;
