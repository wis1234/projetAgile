import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function Index() {
  useEffect(() => {
    router.visit('/activities', { replace: true });
  }, []);
  return null;
} 