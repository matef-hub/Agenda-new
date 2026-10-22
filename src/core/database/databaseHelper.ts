import { AppDateUtils } from '../utils/dateUtils';

/**
 * LocalStorage-backed DatabaseHelper matching lib/core/database/database_helper.dart
 * Supports tables:
 * - sessions
 * - personal_info
 * - powers_of_attorney
 * - bailiff_papers
 * - admin_notes
 *
 * Also supports distinguishing demo records (`is_demo: 1`) from real user-persisted
 * records (`is_demo: 0`).
 */

export type TableName =
  | 'sessions'
  | 'personal_info'
  | 'powers_of_attorney'
  | 'bailiff_papers'
  | 'admin_notes';

const ALL_TABLES: TableName[] = [
  'sessions',
  'personal_info',
  'powers_of_attorney',
  'bailiff_papers',
  'admin_notes',
];

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private readonly storagePrefix = 'judicial_agenda_db_';

  private constructor() {}

  static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }

  private getTableData<T extends Record<string, any>>(table: TableName): T[] {
    try {
      const raw = localStorage.getItem(`${this.storagePrefix}${table}`);
      if (!raw) return [];
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private saveTableData<T extends Record<string, any>>(table: TableName, rows: T[]): void {
    localStorage.setItem(`${this.storagePrefix}${table}`, JSON.stringify(rows));
  }

  async insert(table: TableName, row: Record<string, any>): Promise<number> {
    const rows = this.getTableData(table);
    const maxId = rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    const newId = row.id != null ? Number(row.id) : maxId + 1;
    const newRow = {
      ...row,
      id: newId,
      is_demo: row.is_demo != null ? Number(row.is_demo) : 0,
    };
    rows.push(newRow);
    this.saveTableData(table, rows);
    return newId;
  }

  async queryAll<T extends Record<string, any> = Record<string, any>>(
    table: TableName
  ): Promise<T[]> {
    return this.getTableData<T>(table);
  }

  async update(table: TableName, row: Record<string, any>, id: number): Promise<number> {
    const rows = this.getTableData(table);
    const index = rows.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) return 0;
    // When a user edits a record, unless explicitly specified, mark it as real user data (is_demo: 0)
    const isDemo = row.is_demo != null ? Number(row.is_demo) : 0;
    rows[index] = {
      ...rows[index],
      ...row,
      id: Number(id),
      is_demo: isDemo,
    };
    this.saveTableData(table, rows);
    return 1;
  }

  async delete(table: TableName, id: number): Promise<number> {
    const rows = this.getTableData(table);
    const filtered = rows.filter((item) => Number(item.id) !== Number(id));
    const deletedCount = rows.length - filtered.length;
    this.saveTableData(table, filtered);
    return deletedCount;
  }

  async clearTable(table: TableName): Promise<void> {
    this.saveTableData(table, []);
  }

  async clearAllTables(): Promise<void> {
    for (const t of ALL_TABLES) {
      this.saveTableData(t, []);
    }
  }

  async hasDemoData(): Promise<boolean> {
    for (const t of ALL_TABLES) {
      const rows = this.getTableData(t);
      if (rows.some((r) => Number(r.is_demo) === 1)) {
        return true;
      }
    }
    return false;
  }

  async clearDemoData(): Promise<void> {
    for (const t of ALL_TABLES) {
      const rows = this.getTableData(t);
      const realOnly = rows.filter((r) => Number(r.is_demo) !== 1);
      this.saveTableData(t, realOnly);
    }
  }

  async seedDemoData(referenceDate: Date = new Date()): Promise<void> {
    await this.clearDemoData();
    const dateStr = AppDateUtils.toDateInputString(referenceDate);
    const nowIso = new Date().toISOString();

    // 1. Demo Sessions for selected date
    await this.insert('sessions', {
      court_name: 'محكمة شمال القاهرة الابتدائية',
      circuit: 'الدائرة 5 مدني كلي',
      case_number: '4812',
      case_year: referenceDate.getFullYear(),
      client_name: 'محمود عبد الرحمن السيد',
      client_capacity: 'مدعي',
      opponent_name: 'شركة النيل للتعمير والإسكان',
      opponent_capacity: 'مدعى عليه',
      previous_session: 'إعلان بصحيفة الدعوى',
      decision: 'تأجيل لتقديم المستندات ومذكرة دفاع',
      notes: 'مطلوب حافظة مستندات أصل العقد',
      session_date: `${dateStr}T09:00:00.000`,
      created_at: nowIso,
      updated_at: nowIso,
      is_demo: 1,
    });

    await this.insert('sessions', {
      court_name: 'محكمة القضاء الإداري بمجلس الدولة',
      circuit: 'الدائرة الثانية أفراد',
      case_number: '19305',
      case_year: referenceDate.getFullYear() - 1,
      client_name: 'د. طارق عزت المنشاوي',
      client_capacity: 'طاعن',
      opponentName: 'وزير التعليم العالي بصفته',
      opponent_name: 'وزير التعليم العالي بصفته',
      opponent_capacity: 'مطعون ضده',
      previous_session: 'تقرير هيئة مفوضي الدولة',
      decision: 'حجز الدعوى للحكم بجلسة آخر الشهر',
      notes: 'مع التصريح بمذكرات خلال أسبوعين',
      session_date: `${dateStr}T10:30:00.000`,
      created_at: nowIso,
      updated_at: nowIso,
      is_demo: 1,
    });

    // 2. Demo Personal Info (only if personal_info is empty)
    const existingPersonal = await this.queryAll('personal_info');
    if (existingPersonal.length === 0) {
      await this.insert('personal_info', {
        name: 'الأستاذ / عاطف محمد المحامي بالنقض والإدارية العليا',
        home_address: '14 شارع التحرير - الدقي - الجيزة',
        office_address: '22 شارع قصر النيل - وسط البلد - القاهرة',
        home_tel: '0233384910',
        office_tel: '0223914820',
        mobile: '01001234567',
        id_card_no: '28001011234567',
        passport_no: 'A12345678',
        car_license_no: 'ق هـ ر 4912 - مرور الجزيرة',
        driving_license_no: '1049281 - خاصة الجيزة',
        bank_account_no: 'البنك الأهلي المصري - فرع ثروت (بدون بيانات بطاقات دفع)',
        email: 'lawyer.office@example.eg',
        updated_at: nowIso,
        is_demo: 1,
      });
    }

    // 3. Demo Powers of Attorney
    await this.insert('powers_of_attorney', {
      client_name: 'محمود عبد الرحمن السيد',
      poa_number: '3412 / ب لسنة 2025',
      notarization_office: 'توثيق قصر النيل النموذجي',
      poa_type: 'رسمي عام قضايا',
      poa_date: '2025-02-14',
      notes: 'يبيح الصلح والإقرار والإنكار',
      created_at: nowIso,
      is_demo: 1,
    });

    await this.insert('powers_of_attorney', {
      client_name: 'شركة الأمل للاستيراد والتصدير',
      poa_number: '8901 / أ لسنة 2024',
      notarization_office: 'توثيق الاستثمار بالقاهرة',
      poa_type: 'توكيل خاص تجاري وضرائب',
      poa_date: '2024-11-05',
      notes: 'صادر من الممثل القانوني للشركة',
      created_at: nowIso,
      is_demo: 1,
    });

    // 4. Demo Bailiff Papers
    await this.insert('bailiff_papers', {
      reference_number: 'مقيد برقم 1142 محضرين',
      bailiffs_office: 'قلم محضري عابدين',
      client_name: 'محمود عبد الرحمن السيد',
      delivery_date: '2026-10-15',
      hearing_date: dateStr,
      status: 'تم الإعلان مخاطباً مع الإدارة',
      notes: 'استلام أصل الصحيفة المعلنة قبل الجلسة',
      created_at: nowIso,
      is_demo: 1,
    });

    await this.insert('bailiff_papers', {
      reference_number: 'إنذار رسمي رقم 789',
      bailiffs_office: 'قلم محضري الدقي',
      client_name: 'ورثة المرحوم كامل حسن',
      delivery_date: '2026-10-18',
      hearing_date: '2026-11-02',
      status: 'تحت الإعلان',
      notes: 'إنذار عرض القيمة الإيجارية',
      created_at: nowIso,
      is_demo: 1,
    });

    // 5. Demo Admin Notes
    await this.insert('admin_notes', {
      title: 'استخراج شهادة من جدول المحكمة الإدارية',
      content: 'شهادة بعدم حصول طعن في الحكم الصادر في الدعوى رقم 8104 لسنة 76 ق',
      is_completed: 0,
      note_date: nowIso,
      created_at: nowIso,
      is_demo: 1,
    });

    await this.insert('admin_notes', {
      title: 'سداد أمانة الخبير في دعوى الريع',
      content: 'سداد الأمانة بخزينة محكمة شمال القاهرة وإرفاق الإيصال بملف الدعوى',
      is_completed: 1,
      note_date: nowIso,
      created_at: nowIso,
      is_demo: 1,
    });
  }
}

export const dbHelper = DatabaseHelper.getInstance();
