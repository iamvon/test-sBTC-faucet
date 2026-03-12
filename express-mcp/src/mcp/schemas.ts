import { z } from "zod";

export const validateRecipientSchema = {
  recipient: z.string().min(1).describe("Stacks recipient address"),
} as Record<string, z.ZodTypeAny>;

export const faucetClaimSchema = {
  recipient: z.string().min(1).describe("Stacks recipient address"),
  confirm: z
    .boolean()
    .describe("Must be true only after the user explicitly confirms they want to get free test-sBTC now."),
} as Record<string, z.ZodTypeAny>;
