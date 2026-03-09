import { PublicDonationForm } from '@/components/public-donation-form';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="mb-6 rounded-2xl border border-emerald-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-placeholder.svg" alt="Rethink Food" className="h-10 w-auto" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-700">Rethink Food</p>
          </div>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Admin Login
          </Link>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Donate Meals</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700 md:text-base">
          Submit in-kind prepared meal donations for review. After approval, we send a charitable contribution
          acknowledgment PDF from <strong>Rethink Food NYC Inc.</strong>
        </p>
      </header>

      <PublicDonationForm />

      <div className="fixed bottom-4 right-4 z-10 md:hidden">
        <Link
          href="/admin/login"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          Admin Login
        </Link>
      </div>
    </main>
  );
}
