import Link from 'next/link';

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-placeholder.svg" alt="Rethink Food" className="h-8 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Rethink Food</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Admin sign-in</h1>
        <p className="mt-2 text-sm text-slate-700">Magic link login is restricted to allowlisted Rethink staff accounts.</p>

        {params.sent ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Sign-in link sent. Check your inbox.
          </p>
        ) : null}

        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {params.error === 'not-allowed' ? 'That email is not allowlisted.' : 'Unable to send sign-in link.'}
          </p>
        ) : null}

        <form action="/api/admin/auth/request-link" method="POST" className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Work email</span>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="you@rethinkfood.org"
            />
          </label>

          <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            Email magic link
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Public donor form: <Link href="/" className="underline">donatemeals.rethinkfood.org</Link>
        </p>
      </section>
    </main>
  );
}
