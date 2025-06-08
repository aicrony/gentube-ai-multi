'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { FaCheck } from 'react-icons/fa';
import s from './Navbar.module.css';
import ThemeToggle from '@/components/theme/ThemeToggle';
import InfoPanel from '@/components/ui/InfoPanel';
import { useUserId } from '@/context/UserIdContext';

interface NavlinksProps {
  user: any | null;
}

export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const userId = useUserId();

  return (
    <div className="relative flex flex-row justify-between py-1 align-center md:py-6">
      <div className="flex items-center flex-1">
        <nav className="ml-4 space-x-1 lg:block">
          <Link href="/" target="_parent" className={s.link}>
            Generate
          </Link>
          <Link href="/about" className={s.link}>
            About
          </Link>
          <Link href="/pricing" className={s.link}>
            Pricing
          </Link>
          {user && (
            <Link href="/account" className={s.link}>
              Account
            </Link>
          )}
          <Link href="/gallery" className={s.link}>
            Gallery
          </Link>
        </nav>
      </div>
      <div className="flex items-center">
        <div>
          {user ? (
            <div className="flex items-center gap-2">
              <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
                <input
                  type="hidden"
                  name="pathName"
                  value={usePathname() ?? ''}
                />
                <button type="submit" className={s.signOutButton}>
                  <span>
                    <FaCheck />
                  </span>
                  &nbsp; Sign out
                </button>
              </form>
              {/* Only show feedback icon for signed in users */}
              <InfoPanel userId={userId} />
            </div>
          ) : (
            <Link href="/signin" className={s.link}>
              Sign In
            </Link>
          )}
        </div>
        <div className="absolute right-[0%] top-[140%] transform -translate-y-1/2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
