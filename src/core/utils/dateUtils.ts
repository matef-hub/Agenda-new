/**
 * Utility class for handling Gregorian and Hijri date formatting.
 *
 * ## Hijri Calendar Convention
 * Uses the **tabular Islamic calendar** (arithmetic/civil Hijri calendar):
 * - 30-year cycle of 10,631 days (19 common years of 354 days + 11 leap years of 355 days).
 * - Leap years in each 30-year cycle: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29.
 * - Epoch: 1 Muharram 1 AH = JDN 1948440 (Friday, 16 July 622 CE Julian).
 *
 * Note: This is a deterministic offline arithmetic calculation. It may differ by
 * ±1–2 days from astronomical moon-sighting announcements (e.g. Dar al-Ifta).
 */

export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  toString(): string;
}

export class AppDateUtils {
  static readonly hijriMonthNames: readonly string[] = [
    'محرم', // 1
    'صفر', // 2
    'ربيع الأول', // 3
    'ربيع الآخر', // 4
    'جمادى الأولى', // 5
    'جمادى الآخرة', // 6
    'رجب', // 7
    'شعبان', // 8
    'رمضان', // 9
    'شوال', // 10
    'ذو القعدة', // 11
    'ذو الحجة', // 12
  ];

  static readonly gregorianMonthNames: readonly string[] = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  static readonly arabicWeekdays: readonly string[] = [
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];

  private static readonly islamicEpochJdn = 1948440;

  static getGregorianDay(date: Date): string {
    return date.getDate().toString();
  }

  static getGregorianMonth(date: Date): string {
    return this.gregorianMonthNames[date.getMonth()] ?? '';
  }

  static getGregorianYear(date: Date): string {
    return date.getFullYear().toString();
  }

  static getWeekday(date: Date): string {
    return this.arabicWeekdays[date.getDay()] ?? '';
  }

  static toDateInputString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static gregorianToHijri(date: Date): HijriDate {
    const jdn = this.gregorianToJdn(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    return this.jdnToHijri(jdn);
  }

  static hijriToGregorian(hYear: number, hMonth: number, hDay: number): Date {
    const jdn = this.hijriToJdn(hYear, hMonth, hDay);
    return this.jdnToGregorian(jdn);
  }

  static getHijriDay(date: Date): string {
    return this.gregorianToHijri(date).day.toString();
  }

  static getHijriMonth(date: Date): string {
    return this.gregorianToHijri(date).monthName;
  }

  static getHijriYear(date: Date): string {
    return this.gregorianToHijri(date).year.toString();
  }

  private static gregorianToJdn(year: number, month: number, day: number): number {
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const a = Math.trunc(y / 100);
    const b = 2 - a + Math.trunc(a / 4);

    return (
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      day +
      b -
      1524
    );
  }

  private static jdnToHijri(jdn: number): HijriDate {
    const daysElapsed = jdn - this.islamicEpochJdn;
    const cycles = Math.trunc(daysElapsed / 10631);
    let remainingDays = daysElapsed % 10631;
    if (remainingDays < 0) {
      remainingDays += 10631;
    }

    let year = cycles * 30 + 1;

    while (true) {
      const yearLength = this.isHijriLeapYear(year) ? 355 : 354;
      if (remainingDays < yearLength) break;
      remainingDays -= yearLength;
      year++;
    }

    let month = 1;
    while (month <= 12) {
      const monthLength = this.hijriMonthLength(year, month);
      if (remainingDays < monthLength) break;
      remainingDays -= monthLength;
      month++;
    }

    const day = remainingDays + 1;
    const monthName =
      month >= 1 && month <= 12 ? this.hijriMonthNames[month - 1] : '--';

    return {
      year,
      month,
      day,
      monthName,
      toString() {
        return `${day} ${monthName} ${year} هـ`;
      },
    };
  }

  private static hijriToJdn(year: number, month: number, day: number): number {
    let totalDays = 0;
    for (let y = 1; y < year; y++) {
      totalDays += this.isHijriLeapYear(y) ? 355 : 354;
    }
    for (let m = 1; m < month; m++) {
      totalDays += this.hijriMonthLength(year, m);
    }
    totalDays += day - 1;
    return this.islamicEpochJdn + totalDays;
  }

  private static jdnToGregorian(jdn: number): Date {
    let l = jdn + 68569;
    const n = Math.trunc((4 * l) / 146097);
    l = l - Math.trunc((146097 * n + 3) / 4);
    const i = Math.trunc((4000 * (l + 1)) / 1461001);
    l = l - Math.trunc((1461 * i) / 4) + 31;
    const j = Math.trunc((80 * l) / 2447);
    const day = l - Math.trunc((2447 * j) / 80);
    l = Math.trunc(j / 11);
    const month = j + 2 - 12 * l;
    const year = 100 * (n - 49) + i + l;

    return new Date(year, month - 1, day);
  }

  static isHijriLeapYear(year: number): boolean {
    const leapYears = new Set([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);
    return leapYears.has(year % 30);
  }

  static hijriMonthLength(year: number, month: number): number {
    if (month < 1 || month > 12) {
      throw new RangeError(`Hijri month must be between 1 and 12, got ${month}`);
    }
    if (month === 12) {
      return this.isHijriLeapYear(year) ? 30 : 29;
    }
    return month % 2 === 1 ? 30 : 29;
  }
}
