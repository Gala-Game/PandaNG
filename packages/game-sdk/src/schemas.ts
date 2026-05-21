import { z } from 'zod';

// ─── Session schemas ──────────────────────────────────────────────────────────

export const StartSessionSchema = z.object({
  gameType: z.enum([
    'SLOTS',
    'CRASH',
    'DRAGON_DICE',
    'PANDA_SPIN',
    'MINI_GAME',
    'SCRATCH_CARD',
    'ROULETTE',
    'BAMBOO_BLAST',
  ]),
  betAmountInCents: z.number().int().positive().max(100_000_000), // max 1M PHP
  clientSeed: z.string().min(8).max(64).optional(),
  rtpProfileId: z.string().cuid().optional(),
});

export type StartSessionInput = z.infer<typeof StartSessionSchema>;

export const ResolveSessionSchema = z.discriminatedUnion('gameType', [
  z.object({
    gameType: z.literal('SLOTS'),
    sessionId: z.string().cuid(),
  }),
  z.object({
    gameType: z.literal('CRASH'),
    sessionId: z.string().cuid(),
    cashoutMultiplier: z.number().positive().max(10000),
  }),
  z.object({
    gameType: z.literal('DRAGON_DICE'),
    sessionId: z.string().cuid(),
    target: z.number().int().min(2).max(98),
    mode: z.enum(['over', 'under']),
  }),
  z.object({
    gameType: z.literal('PANDA_SPIN'),
    sessionId: z.string().cuid(),
  }),
  z.object({
    gameType: z.literal('MINI_GAME'),
    sessionId: z.string().cuid(),
    pickedIndices: z.array(z.number().int().min(0).max(19)).min(1).max(16),
  }),
  z.object({
    gameType: z.literal('SCRATCH_CARD'),
    sessionId: z.string().cuid(),
  }),
  z.object({
    gameType: z.literal('ROULETTE'),
    sessionId: z.string().cuid(),
  }),
  z.object({
    gameType: z.literal('BAMBOO_BLAST'),
    sessionId: z.string().cuid(),
  }),
]);

export type ResolveSessionInput = z.infer<typeof ResolveSessionSchema>;

// ─── RTP Profile ─────────────────────────────────────────────────────────────

export const RTPProfileSchema = z.object({
  id: z.string(),
  gameType: z.string(),
  name: z.string(),
  rtp: z.number().min(0.5).max(1.0),
  variance: z.enum(['low', 'medium', 'high']),
  minBetInCents: z.number().int().positive(),
  maxBetInCents: z.number().int().positive(),
  isActive: z.boolean(),
});

export type RTPProfileData = z.infer<typeof RTPProfileSchema>;
