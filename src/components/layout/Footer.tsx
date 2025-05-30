
"use client"; // Make it a client component

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MOCK_USERS } from '@/lib/constants';

export function Footer() {
  const searchParams = useSearchParams();
  const [referrerName, setReferrerName] = useState<string>("Admin"); // Default to Admin

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      const affiliateUser = MOCK_USERS.find(
        (user) => user.affiliateCode === refCode && user.roles.includes('affiliate')
      );
      if (affiliateUser) {
        setReferrerName(affiliateUser.name);
      } else {
        setReferrerName("Admin"); // If ref code is invalid, default to Admin
      }
    } else {
      setReferrerName("Admin"); // If no ref code, default to Admin
    }
  }, [searchParams]); // Re-run when searchParams change

  return (
    <footer className="border-t">
      <div className="container flex h-auto flex-col items-center justify-center py-4 text-center"> {/* Adjusted height, padding, and added text-center */}
        <p className="text-sm text-muted-foreground mb-2">
          Direferensikan oleh: {referrerName}
        </p>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bproid.com. Hak cipta dilindungi undang-undang.
        </p>
      </div>
    </footer>
  );
}
