import Link from 'next/link';

export default async function SubmissionCompletePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <section className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Submission received</h1>
        <p className="mt-3 text-slate-700">
          Thanks. Donation <span className="font-semibold">{id}</span> is now pending admin review.
        </p>
        <p className="mt-2 text-slate-700">
          We sent an email verification link so you can access updates, secure edits if needed, and receipt delivery.
        </p>

        <div className="mt-6">
          <Link href="/" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">
            Submit another donation
          </Link>
        </div>
      </section>
    </main>
  );
}
