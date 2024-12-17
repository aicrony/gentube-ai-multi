import { createClient } from '@/utils/supabase/server';
import s from './Navbar.module.css';
import Navlinks from './Navlinks';

interface NavbarProps {
  productName: string;
  subscriptionStatus: string;
}

export default async function Navbar({
  productName,
  subscriptionStatus
}: NavbarProps) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <nav className={s.root}>
      <a href="#skip" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="max-w-6xl px-6 mx-auto">
        <Navlinks
          user={user}
          subscriptionStatus={subscriptionStatus}
          productName={productName}
        />
      </div>
    </nav>
  );
}
