'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import s from './Navbar.module.css';

interface NavlinksProps {
  user: any | null;
  subscription: any;
}

export default function Navlinks({ user, subscription }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;

  return (
    <div className="relative flex flex-row justify-between py-4 align-center md:py-6">
      <div className="flex items-center flex-1">
        {/*<Link href="/" className={s.logo} aria-label="Logo">*/}
        {/*  <Logo />*/}
        {/*</Link>*/}
        <nav className="ml-6 space-x-2 lg:block">
          <Link href="/" target="_parent" className={s.link}>
            Home
          </Link>
          <Link href="/pricing" className={s.link}>
            Pricing
          </Link>
          {user && (
            <Link href="/account" className={s.link}>
              Account
            </Link>
          )}
        </nav>
      </div>
      <div className="flex justify-end space-x-8">
        {user ? (
          <div>
            <div>
              <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
                <input
                  type="hidden"
                  name="pathName"
                  value={usePathname() ?? ''}
                />
                <button type="submit" className={s.link}>
                  Sign out {user.email}
                </button>
              </form>
            </div>
            {subscription &&
              subscription[0] &&
              subscription[0].status &&
              subscription[0].status !== 'canceled' && (
                <div>subscription: {subscription[0].status}</div>
              )}
          </div>
        ) : (
          <Link href="/signin" className={s.link}>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
