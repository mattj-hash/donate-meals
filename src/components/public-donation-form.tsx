'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FMV_DISCLAIMER_TEXT, FMV_GUIDANCE_TEXT, MAX_PHOTO_UPLOADS } from '@/lib/constants';

function toFixedMoney(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '';
}

export function PublicDonationForm() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState('');
  const [startedAt] = useState(() => Date.now());

  const [mealCount, setMealCount] = useState('');
  const [fmvPerMeal, setFmvPerMeal] = useState('');
  const [fmvTotal, setFmvTotal] = useState('');
  const [lastEdited, setLastEdited] = useState<'per' | 'total' | null>(null);

  useEffect(() => {
    const meals = Number.parseInt(mealCount, 10);
    if (!Number.isInteger(meals) || meals <= 0) return;

    if (lastEdited === 'per' && fmvPerMeal) {
      const per = Number.parseFloat(fmvPerMeal);
      if (Number.isFinite(per)) {
        setFmvTotal(toFixedMoney(per * meals));
      }
    }

    if (lastEdited === 'total' && fmvTotal) {
      const total = Number.parseFloat(fmvTotal);
      if (Number.isFinite(total) && meals > 0) {
        setFmvPerMeal(toFixedMoney(total / meals));
      }
    }
  }, [mealCount, fmvPerMeal, fmvTotal, lastEdited]);

  const totalPreview = useMemo(() => {
    const total = Number.parseFloat(fmvTotal);
    if (!Number.isFinite(total)) return '—';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(total);
  }, [fmvTotal]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('clientStartedAt', String(startedAt));

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error || 'Unable to submit donation.');
      }

      router.push(`/submitted/${data.id}`);
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'Unexpected submission error.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Donor business name *</span>
          <input name="donorBusinessName" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Contact name *</span>
          <input name="donorContactName" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Email *</span>
          <input name="donorEmail" type="email" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Phone</span>
          <input name="donorPhone" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Donation date/time *</span>
          <input
            name="donationDatetime"
            type="datetime-local"
            required
            defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Meal count *</span>
          <input
            name="mealCount"
            type="number"
            min={1}
            required
            value={mealCount}
            onChange={(event) => setMealCount(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      <label className="space-y-1 block">
        <span className="text-sm font-medium">Meal description *</span>
        <textarea
          name="mealDescription"
          required
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="What meals were donated? Include quantity breakdown if needed."
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-sm font-medium">Dietary / packaging notes</span>
        <textarea
          name="dietaryPackagingNotes"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Allergens, dietary tags, packaging details, etc."
        />
      </label>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-base font-semibold">Dropoff location</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Site name</span>
            <input name="dropoffSiteName" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Address 1 *</span>
            <input name="dropoffAddress1" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Address 2</span>
            <input name="dropoffAddress2" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">City *</span>
            <input name="dropoffCity" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">State *</span>
            <input name="dropoffState" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">ZIP *</span>
            <input name="dropoffZip" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <h2 className="text-base font-semibold text-emerald-900">Fair Market Value (donor-reported)</h2>
        <p className="text-sm text-emerald-900/90">{FMV_GUIDANCE_TEXT}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">FMV per meal</span>
            <input
              name="fmvPerMealInput"
              inputMode="decimal"
              value={fmvPerMeal}
              onChange={(event) => {
                setLastEdited('per');
                setFmvPerMeal(event.target.value);
              }}
              placeholder="e.g., 8.50"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Total FMV</span>
            <input
              name="fmvTotalInput"
              inputMode="decimal"
              value={fmvTotal}
              onChange={(event) => {
                setLastEdited('total');
                setFmvTotal(event.target.value);
              }}
              placeholder="e.g., 850.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <p className="text-sm text-slate-700">
          Computed total: <strong>{totalPreview}</strong>
        </p>
        <p className="text-sm text-amber-800">{FMV_DISCLAIMER_TEXT}</p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 p-4">
        <h2 className="text-base font-semibold">Verification uploads</h2>
        <p className="text-sm text-slate-700">
          On mobile, use <strong>Take photo now</strong> to open your camera directly.
        </p>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Take photo now (camera)</span>
          <input
            name="mealPhotos"
            type="file"
            accept="image/*"
            capture="environment"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Meal photos (1–{MAX_PHOTO_UPLOADS}) *</span>
          <input
            name="mealPhotos"
            type="file"
            accept="image/*"
            multiple
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium">Optional invoice / packing slip</span>
          <input
            name="invoiceFile"
            type="file"
            accept="application/pdf,image/*"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      <input name="botField" className="hidden" tabIndex={-1} autoComplete="off" />

      {status === 'error' ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-lg bg-emerald-800 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'sending' ? 'Submitting…' : 'Submit donation'}
      </button>
    </form>
  );
}
