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

interface NavlinksProps {
  user: any | null;
}

export default function Navlinks({ user }: NavlinksProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldUseRouter = getRedirectMethod() === 'client';

  return (
    <div className="relative py-1 md:py-6">
      {/* Main navigation row */}
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center flex-1 min-w-0">
          <nav className="ml-2 sm:ml-4 space-x-1 overflow-hidden">
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
        
        {/* Right side buttons - all grouped together, never wrap */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sign in/out button */}
          {user ? (
            <form
              onSubmit={(e) =>
                handleRequest(e, SignOut, shouldUseRouter ? router : null)
              }
            >
              <input type="hidden" name="pathName" value={pathname ?? ''} />
              <button type="submit" className={s.signOutButton}>
                <span>
                  <FaCheck />
                </span>
                &nbsp; Sign out
              </button>
            </form>
          ) : (
            <Link href="/signin" className={s.link}>
              Sign In
            </Link>
          )}
          
          {/* Info and Theme buttons - always visible on same row */}
          <InfoPanel userId={user?.id} />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
