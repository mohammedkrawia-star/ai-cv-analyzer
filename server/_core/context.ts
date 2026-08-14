import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// This app has no login system — every request is anonymous/public.
// (History is stored locally on-device via AsyncStorage.)
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: null,
  };
}
