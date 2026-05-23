import { z } from 'zod';

export const offerIdParamSchema = z.object({
  offerId: z.coerce.number().int().positive(),
});

export const equipBodySchema = z.object({
  itemId: z.number().int().positive(),
});

export const unequipParamSchema = z.object({
  type: z.enum(['avatar', 'card_skin', 'emote', 'background', 'shoot_anim', 'shield_anim', 'name_effect']),
});
