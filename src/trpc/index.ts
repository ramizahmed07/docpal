import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";

import { privateProcedure, publicProcedure, router } from "./trpc";
import { db } from "@/db";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email)
      throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return { user };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { user, userId } = ctx;
    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),
});

export type AppRouter = typeof appRouter;
