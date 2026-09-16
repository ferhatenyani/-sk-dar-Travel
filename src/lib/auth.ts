import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as dbSchema from "@/db/schema";
import { sendResetPasswordEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: dbSchema.user,
      session: dbSchema.session,
      account: dbSchema.account,
      verification: dbSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  rateLimit: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
