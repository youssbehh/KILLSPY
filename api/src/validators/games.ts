import { z } from 'zod';

export const recordGameSchema = z.object({
  outcome: z.enum(['won', 'lost', 'draw']),
  mode: z.enum(['pve', 'pvp_quick', 'pvp_ranked']),
});

export type RecordGameInput = z.infer<typeof recordGameSchema>;
