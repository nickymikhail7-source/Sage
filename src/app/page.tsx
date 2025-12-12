import { db } from '@/db';
import { emailAccounts } from '@/db/schema';
import { getAurinkoEmails } from '@/lib/aurinko';
import { LoginButton } from '@/components/LoginButton';
import { Dashboard } from '@/components/Dashboard';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  if (!sessionToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Sage</h1>
        <p className="text-zinc-400 mb-8">Please connect your account to get started.</p>
        <LoginButton />
      </div>
    );
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.AURINKO_SIGNING_SECRET);
    const { payload } = await jwtVerify(sessionToken.value, secret);
    userId = payload.userId as string;
  } catch (err) {
    console.error("JWT Error:", err);
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-400 mb-4">Session invalid. Please login again.</p>
        <LoginButton />
      </div>
    );
  }

  // Fetch Access Token
  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.userId, userId)
  });

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-zinc-400 mb-4">No email account linked.</p>
        <LoginButton />
      </div>
    );
  }

  const emails = await getAurinkoEmails(account.accessToken);

  return (
    <Dashboard initialEmails={emails} accessToken={account.accessToken} />
  );
}
