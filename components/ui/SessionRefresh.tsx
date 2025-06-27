'use client';

import { SessionRefreshHandler } from '@/utils/auth-helpers/sessionRefresh';

export default function SessionRefresh({ children }: { children: React.ReactNode }) {
  return <SessionRefreshHandler>{children}</SessionRefreshHandler>;
}