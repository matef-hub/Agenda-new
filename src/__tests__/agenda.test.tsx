import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '../App';
import { AppDateUtils } from '../core/utils/dateUtils';
import { dbHelper } from '../core/database/databaseHelper';
import {
  createSession,
  copySessionWith,
  sessionToMap,
  sessionFromMap,
} from '../features/daily_schedule/models/sessionModel';

describe('Egyptian Judicial Agenda — Prototype Verification Suite', () => {
  beforeEach(async () => {
    localStorage.clear();
    await dbHelper.clearAllTables();
  });

  // -------------------------------------------------------------------------
  // 1. Hijri / Gregorian Date Conversion & Determinism
  // -------------------------------------------------------------------------
  describe('Hijri conversion & deterministic date system', () => {
    it('converts known Gregorian reference dates to accurate tabular Hijri dates', () => {
      // 1 Jan 2000 = 24 Ramadan 1420 in Civil/Tabular calendar (JDN 1948440 epoch)
      const h2000 = AppDateUtils.gregorianToHijri(new Date(2000, 0, 1));
      expect(h2000.day).toBe(24);
      expect(h2000.month).toBe(9);
      expect(h2000.year).toBe(1420);
      expect(h2000.monthName).toBe('رمضان');

      // 8 July 2024 = 1 Muharram 1446 (Civil/Tabular epoch)
      const h1446 = AppDateUtils.gregorianToHijri(new Date(2024, 6, 8));
      expect(h1446.day).toBe(1);
      expect(h1446.month).toBe(1);
      expect(h1446.year).toBe(1446);
      expect(h1446.monthName).toBe('محرم');

      // 23 March 2023 = 1 Ramadan 1444 (tabular)
      const h1 = AppDateUtils.gregorianToHijri(new Date(2023, 2, 23));
      expect(h1.month).toBe(9);
      expect(h1.day).toBe(1);
      expect(h1.year).toBe(1444);

      // 11 March 2024 = 1 Ramadan 1445
      const h2 = AppDateUtils.gregorianToHijri(new Date(2024, 2, 11));
      expect(h2.month).toBe(9);
      expect(h2.day).toBe(1);
      expect(h2.year).toBe(1445);

      // 1 March 2025 = 1 Ramadan 1446
      const h3 = AppDateUtils.gregorianToHijri(new Date(2025, 2, 1));
      expect(h3.month).toBe(9);
      expect(h3.day).toBe(1);
      expect(h3.year).toBe(1446);
    });

    it('preserves dates across Hijri -> Gregorian -> Hijri round trips', () => {
      const cases = [
        [1, 1, 1],
        [1446, 1, 1],
        [1448, 6, 15],
        [1444, 9, 1],
        [1447, 12, 30], // Leap year 30th Dhul Hijjah
      ];

      for (const [hy, hm, hd] of cases) {
        const greg = AppDateUtils.hijriToGregorian(hy, hm, hd);
        const back = AppDateUtils.gregorianToHijri(greg);
        expect(back.year).toBe(hy);
        expect(back.month).toBe(hm);
        expect(back.day).toBe(hd);
      }
    });

    it('detects Hijri leap years and month lengths accurately', () => {
      expect(AppDateUtils.isHijriLeapYear(2)).toBe(true);
      expect(AppDateUtils.isHijriLeapYear(1442)).toBe(true);
      expect(AppDateUtils.isHijriLeapYear(1447)).toBe(true);
      expect(AppDateUtils.isHijriLeapYear(1)).toBe(false);
      expect(AppDateUtils.isHijriLeapYear(1448)).toBe(false);

      expect(AppDateUtils.hijriMonthLength(1448, 1)).toBe(30);
      expect(AppDateUtils.hijriMonthLength(1448, 2)).toBe(29);
      expect(AppDateUtils.hijriMonthLength(1448, 12)).toBe(29);
      expect(AppDateUtils.hijriMonthLength(1447, 12)).toBe(30);
    });

    it('handles month and year boundaries accurately', () => {
      const lastMuharram = AppDateUtils.hijriToGregorian(1448, 1, 30);
      const nextDay = new Date(
        lastMuharram.getFullYear(),
        lastMuharram.getMonth(),
        lastMuharram.getDate() + 1
      );
      const hijriNext = AppDateUtils.gregorianToHijri(nextDay);
      expect(hijriNext.month).toBe(2);
      expect(hijriNext.day).toBe(1);

      const lastDhulHijjah = AppDateUtils.hijriToGregorian(1447, 12, 30);
      const newYearDay = new Date(
        lastDhulHijjah.getFullYear(),
        lastDhulHijjah.getMonth(),
        lastDhulHijjah.getDate() + 1
      );
      const hijriNewYear = AppDateUtils.gregorianToHijri(newYearDay);
      expect(hijriNewYear.year).toBe(1448);
      expect(hijriNewYear.month).toBe(1);
      expect(hijriNewYear.day).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Session Model & Database Persistence (Demo vs Real Records)
  // -------------------------------------------------------------------------
  describe('Session model & DatabaseHelper persistence', () => {
    it('serializes and deserializes Session records preserving all fields', () => {
      const original = createSession({
        id: 7,
        courtName: 'محكمة شمال القاهرة',
        circuit: 'الدائرة 12 أحوال',
        caseNumber: '999',
        caseYear: 2026,
        clientName: 'فاطمة علي',
        clientCapacity: 'مدعية',
        opponentName: 'محمد عبدالله',
        opponentCapacity: 'مدعى عليه',
        previousSession: 'تأجيل للمستندات',
        decision: 'حكم غيابي',
        notes: 'ملاحظة تجريبية',
        sessionDate: '2026-10-22T00:00:00.000',
        createdAt: '2026-10-01T00:00:00.000',
      });

      const map = sessionToMap(original);
      const restored = sessionFromMap(map);
      expect(restored.id).toBe(7);
      expect(restored.courtName).toBe('محكمة شمال القاهرة');
      expect(restored.clientName).toBe('فاطمة علي');

      const updated = copySessionWith(restored, { decision: 'حجز للحكم' });
      expect(updated.decision).toBe('حجز للحكم');
      expect(updated.createdAt).toBe('2026-10-01T00:00:00.000');
    });

    it('distinguishes demo data from user-persisted records when seeding and clearing demo data', async () => {
      // Insert real user record
      await dbHelper.insert('powers_of_attorney', {
        client_name: 'موكل حقيقي محفوظ',
        poa_number: '100/أ',
        notarization_office: 'توثيق الجيزة',
        poa_type: 'قضايا',
        poa_date: '2026-10-22',
        notes: '',
        created_at: new Date().toISOString(),
        is_demo: 0,
      });

      // Seed demo records
      await dbHelper.seedDemoData(new Date(2026, 9, 22));
      expect(await dbHelper.hasDemoData()).toBe(true);

      const allPoas = await dbHelper.queryAll('powers_of_attorney');
      expect(allPoas.length).toBe(3); // 1 real + 2 demo

      // Clear demo records — real record must survive
      await dbHelper.clearDemoData();
      expect(await dbHelper.hasDemoData()).toBe(false);

      const remainingPoas = await dbHelper.queryAll('powers_of_attorney');
      expect(remainingPoas.length).toBe(1);
      expect(remainingPoas[0].client_name).toBe('موكل حقيقي محفوظ');
    });
  });

  // -------------------------------------------------------------------------
  // 3. UI Navigation & Section Rendering
  // -------------------------------------------------------------------------
  describe('Navigation and 5 functional sections', () => {
    it('renders bottom navigation bar with all 5 Arabic tabs and navigates between sections', async () => {
      render(<App />);

      // Verify all 5 bottom navigation labels exist
      expect(screen.getByText('اليومية')).toBeInTheDocument();
      expect(screen.getByText('البيانات')).toBeInTheDocument();
      expect(screen.getByText('التوكيلات')).toBeInTheDocument();
      expect(screen.getByText('المحضرين')).toBeInTheDocument();
      expect(screen.getByText('إدارية')).toBeInTheDocument();

      // Default screen is Daily Schedule
      expect(screen.getByTestId('shell-header-title')).toHaveTextContent(
        'الجلسات اليومية'
      );
      expect(
        await screen.findByText('لا توجد جلسات مسجلة لهذا اليوم')
      ).toBeInTheDocument();

      // Navigate to Personal Data
      fireEvent.click(screen.getByText('البيانات'));
      expect(screen.getByTestId('shell-header-title')).toHaveTextContent(
        'البيانات الشخصية'
      );
      expect(await screen.findByLabelText('الاسم / Name')).toBeInTheDocument();

      // Navigate to Powers of Attorney
      fireEvent.click(screen.getByText('التوكيلات'));
      expect(screen.getByTestId('shell-header-title')).toHaveTextContent(
        'التوكيلات'
      );
      expect(await screen.findByText('فهرس التوكيلات')).toBeInTheDocument();

      // Navigate to Bailiffs
      fireEvent.click(screen.getByText('المحضرين'));
      expect(screen.getByTestId('shell-header-title')).toHaveTextContent(
        'المحضرين'
      );
      expect(await screen.findByText('أوراق المحضرين')).toBeInTheDocument();

      // Navigate to Admin Work
      fireEvent.click(screen.getByText('إدارية'));
      expect(screen.getByTestId('shell-header-title')).toHaveTextContent(
        'الأعمال الإدارية'
      );
      expect(await screen.findByText('أعمال إدارية')).toBeInTheDocument();
    });

    it('validates required fields and creates a session in Daily Schedule', async () => {
      render(<App />);
      await screen.findByText('لا توجد جلسات مسجلة لهذا اليوم');

      // Open Add Session form
      fireEvent.click(screen.getByText('إضافة جلسة'));
      expect(screen.getByText('إضافة جلسة جديدة')).toBeInTheDocument();

      // Submit empty form to trigger validation
      fireEvent.click(screen.getByText('حفظ الجلسة'));
      expect(screen.getAllByText('هذا الحقل مطلوب').length).toBeGreaterThanOrEqual(4);

      // Fill required fields
      fireEvent.change(screen.getByLabelText('اسم المحكمة'), {
        target: { value: 'محكمة عابدين' },
      });
      fireEvent.change(screen.getByLabelText('الدائرة'), {
        target: { value: 'الدائرة 2 مدني' },
      });
      fireEvent.change(screen.getByLabelText('رقم الدعوى'), {
        target: { value: '7741' },
      });
      fireEvent.change(screen.getByLabelText('اسم الموكل'), {
        target: { value: 'أحمد كمال' },
      });
      fireEvent.change(screen.getByLabelText('اسم الخصم'), {
        target: { value: 'شركة التعمير' },
      });
      fireEvent.change(screen.getByLabelText('القرار الحالي'), {
        target: { value: 'تأجيل للإعلان' },
      });

      fireEvent.click(screen.getByText('حفظ الجلسة'));

      // Verify newly created session appears in the ruled table with 'محفوظ محلياً' badge
      await waitFor(() => {
        expect(screen.getByText('محكمة عابدين')).toBeInTheDocument();
        expect(screen.getByText('أحمد كمال')).toBeInTheDocument();
        expect(screen.getByText('تأجيل للإعلان')).toBeInTheDocument();
        expect(screen.getByText('محفوظ محلياً')).toBeInTheDocument();
      });
    });

    it('loads and clears demo data via the top status bar', async () => {
      render(<App />);
      await screen.findByText('لا توجد جلسات مسجلة لهذا اليوم');

      // Click load demo data
      fireEvent.click(screen.getByText('تحميل بيانات تجريبية'));

      await waitFor(() => {
        expect(
          screen.getByText('محكمة شمال القاهرة الابتدائية')
        ).toBeInTheDocument();
        expect(screen.getAllByText('بيانات تجريبية').length).toBeGreaterThan(0);
      });

      // Clear demo data
      fireEvent.click(screen.getByText('مسح البيانات التجريبية'));

      await waitFor(() => {
        expect(
          screen.getByText('لا توجد جلسات مسجلة لهذا اليوم')
        ).toBeInTheDocument();
      });
    });
  });
});
