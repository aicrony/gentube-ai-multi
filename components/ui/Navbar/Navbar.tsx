import { createClient } from '@/utils/supabase/server';
import s from './Navbar.module.css';
import Navlinks from './Navlinks';

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let subscriptionData = null;

  if (user) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching subscription data:', error);
    } else {
      subscriptionData = data;
      console.log('Subscription data retrieved ok');
    }
  }

  return (
    <nav className={s.root}>
      <a href="#skip" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="max-w-6xl px-6 mx-auto">
        <Navlinks user={user} subscription={subscriptionData} />
      </div>
    </nav>
  );
}
