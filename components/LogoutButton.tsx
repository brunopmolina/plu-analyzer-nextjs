'use client';

import { Button } from '@/components/ui/button';
import { logout } from '@/app/login/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  );
}
