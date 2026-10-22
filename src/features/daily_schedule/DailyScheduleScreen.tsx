import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Scale,
  Plus,
  CalendarX2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Save,
  Calendar,
  ArrowRight,
  Search,
} from 'lucide-react';
import { AppDateUtils } from '../../core/utils/dateUtils';
import { dbHelper } from '../../core/database/databaseHelper';
import { Session, sessionFromMap, sessionToMap } from './models/sessionModel';

interface DailyScheduleScreenProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

export const DailyScheduleScreen: React.FC<DailyScheduleScreenProps> = ({
  refreshTrigger = 0,
  onDataChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add/Edit Screen modal/view state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Delete confirmation dialog state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const loadSessions = useCallback(async (dateToLoad: Date) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const dateStr = AppDateUtils.toDateInputString(dateToLoad);
      const allRows = await dbHelper.queryAll('sessions');
      const filtered = allRows
        .filter((row) => String(row.session_date || '').startsWith(dateStr))
        .map(sessionFromMap);
      setSessions(filtered);
    } catch (e: any) {
      setErrorMessage(`فشل تحميل الجلسات: ${e?.message || e}`);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions(selectedDate);
  }, [selectedDate, loadSessions, refreshTrigger]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.courtName.toLowerCase().includes(q) ||
        s.circuit.toLowerCase().includes(q) ||
        s.caseNumber.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        s.opponentName.toLowerCase().includes(q) ||
        s.decision.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId == null) return;
    try {
      await dbHelper.delete('sessions', deleteTargetId);
      setDeleteTargetId(null);
      await loadSessions(selectedDate);
      onDataChange?.();
    } catch (e: any) {
      setErrorMessage(`فشل حذف الجلسة: ${e?.message || e}`);
      setDeleteTargetId(null);
    }
  };

  if (isFormOpen) {
    return (
      <AddEditSessionView
        session={editingSession}
        initialDate={selectedDate}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSession(null);
        }}
        onSaved={async () => {
          setIsFormOpen(false);
          setEditingSession(null);
          await loadSessions(selectedDate);
          onDataChange?.();
        }}
      />
    );
  }

  const gregorianDay = AppDateUtils.getGregorianDay(selectedDate);
  const gregorianMonth = AppDateUtils.getGregorianMonth(selectedDate);
  const gregorianYear = AppDateUtils.getGregorianYear(selectedDate);
  const hijriDay = AppDateUtils.getHijriDay(selectedDate);
  const hijriMonth = AppDateUtils.getHijriMonth(selectedDate);
  const hijriYear = AppDateUtils.getHijriYear(selectedDate);
  const weekday = AppDateUtils.getWeekday(selectedDate);

  return (
    <div className="relative flex flex-col h-full bg-[#FDFBF7]">
      {/* --- الهيدر العلوي (Header) --- */}
      <div className="px-4 py-2.5 bg-[#FDFBF7] border-b-2 border-[#C5A059] flex items-center justify-between">
        {/* التاريخ الهجري */}
        <div
          className="w-[78px] p-2 border-[1.5px] border-[#3E5228] rounded-lg bg-white flex flex-col items-center text-center shadow-2xs"
          title="تقويم هجري حسابي (جدولي/مدني) — قد يختلف ±1 يوم عن الرؤية الشرعية"
        >
          <span className="text-[10px] text-[#666666]">هجري</span>
          <span
            data-testid="hijri-day"
            className="font-amiri text-[26px] font-bold text-[#3E5228] leading-none my-0.5"
          >
            {hijriDay}
          </span>
          <span
            data-testid="hijri-month"
            className="text-[10px] text-[#2C2C2C] truncate w-full"
          >
            {hijriMonth}
          </span>
        </div>

        {/* الوسط (اسم اليوم + السنة) */}
        <div className="flex-1 flex flex-col items-center px-2">
          <h2
            data-testid="weekday-title"
            className="font-amiri text-[30px] sm:text-[32px] font-bold text-[#2C2C2C] leading-none"
          >
            {weekday}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              data-testid="hijri-year"
              className="text-base font-bold text-[#3E5228]"
            >
              {hijriYear}
            </span>
            <Scale className="w-5 h-5 text-[#B23A3A]" />
            <span
              data-testid="gregorian-year"
              className="text-base font-bold text-[#B23A3A]"
            >
              {gregorianYear}
            </span>
          </div>
          <span className="text-[9px] text-[#666666] mt-0.5">
            التقويم الهجري الحسابي (الجدولي)
          </span>
        </div>

        {/* التاريخ الميلادي */}
        <div className="w-[78px] p-2 border-[1.5px] border-[#3E5228] rounded-lg bg-white flex flex-col items-center text-center shadow-2xs">
          <span className="text-[10px] text-[#666666]">ميلادي</span>
          <span
            data-testid="gregorian-day"
            className="font-amiri text-[26px] font-bold text-[#3E5228] leading-none my-0.5"
          >
            {gregorianDay}
          </span>
          <span
            data-testid="gregorian-month"
            className="text-[10px] text-[#2C2C2C] truncate w-full"
          >
            {gregorianMonth}
          </span>
        </div>
      </div>

      {/* --- شريط التنقل بين الأيام والبحث --- */}
      <div className="px-3 py-1.5 border-b border-[#D0D0D0] flex flex-wrap items-center justify-between gap-2 bg-[#FDFBF7]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="اليوم السابق"
            onClick={() => changeDate(-1)}
            className="p-1.5 text-[#3E5228] hover:bg-[#3E5228]/10 rounded transition-colors cursor-pointer"
            title="اليوم السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="font-amiri text-base sm:text-lg font-bold text-[#3E5228]">
            جدول الجلسات اليومية
          </span>

          <button
            type="button"
            aria-label="اليوم التالي"
            onClick={() => changeDate(1)}
            className="p-1.5 text-[#3E5228] hover:bg-[#3E5228]/10 rounded transition-colors cursor-pointer"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-44 max-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute right-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في جلسات اليوم..."
              aria-label="بحث في جلسات اليوم"
              className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded pr-7 pl-2 py-1 text-xs outline-none"
            />
          </div>
          <input
            type="date"
            aria-label="اختر تاريخ الجلسة"
            value={AppDateUtils.toDateInputString(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
              }
            }}
            className="text-xs border border-[#D0D0D0] rounded px-1.5 py-1 bg-white text-[#3E5228] cursor-pointer"
          />
        </div>
      </div>

      {/* --- جدول الجلسات (تصميم الأجندة الورقية) --- */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#3E5228] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#B23A3A] mb-4" />
            <p className="text-sm text-[#B23A3A] mb-4">{errorMessage}</p>
            <button
              type="button"
              onClick={() => loadSessions(selectedDate)}
              className="flex items-center gap-1.5 text-[#3E5228] font-semibold hover:underline cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <CalendarX2 className="w-16 h-16 text-[#D0D0D0] mb-3" />
            <p className="text-base text-[#666666] mb-2">
              {searchQuery.trim()
                ? 'لا توجد جلسات مطابقة للبحث في هذا اليوم'
                : 'لا توجد جلسات مسجلة لهذا اليوم'}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-[#3E5228] hover:bg-[#3E5228]/10 rounded-md font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة جلسة</span>
            </button>
          </div>
        ) : (
          <div className="m-2.5 flex-1 border-2 border-[#3E5228] bg-white flex flex-col overflow-hidden shadow-2xs">
            {/* رأس الجدول */}
            <div className="py-2 bg-[#A3B18A] border-b-2 border-[#3E5228] flex items-center text-center">
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                المحكمة / الدائرة
              </div>
              <div className="flex-[4] font-amiri text-sm font-bold text-[#3E5228]">
                الموكل / الخصم
              </div>
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                القرار / السابقة
              </div>
              <div className="w-9 font-amiri text-xs font-bold text-[#3E5228]">
                حذف
              </div>
            </div>

            {/* محتوى الجدول */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#D0D0D0]">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    setEditingSession(session);
                    setIsFormOpen(true);
                  }}
                  className="px-2 py-2.5 flex items-start hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                >
                  {/* العمود الأول: المحكمة */}
                  <div className="flex-[3] flex flex-col items-start pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-amiri text-[13px] font-bold text-[#2C2C2C]">
                        {session.courtName}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border ${
                          session.isDemo
                            ? 'bg-[#C5A059]/15 text-[#3E5228] border-[#C5A059]'
                            : 'bg-[#3E5228]/10 text-[#3E5228] border-[#3E5228]/30'
                        }`}
                      >
                        {session.isDemo ? 'بيانات تجريبية' : 'محفوظ محلياً'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#2C2C2C]">
                      {session.circuit}
                    </span>
                    <span className="text-[10px] text-[#3E5228] font-semibold mt-0.5">
                      رقم {session.caseNumber}/{session.caseYear}
                    </span>
                  </div>

                  <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />

                  {/* العمود الثاني: الأطراف */}
                  <div className="flex-[4] px-1.5 flex flex-col items-start">
                    <div className="text-[11px] text-[#2C2C2C]">
                      <span className="text-[9px] text-[#666666]">موكل: </span>
                      <span className="font-semibold">{session.clientName}</span>
                      {session.clientCapacity ? (
                        <span className="text-[9px] text-[#666666]">
                          {' '}
                          ({session.clientCapacity})
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-[#2C2C2C] mt-0.5">
                      <span className="text-[9px] text-[#666666]">خصم: </span>
                      <span>{session.opponentName}</span>
                      {session.opponentCapacity ? (
                        <span className="text-[9px] text-[#666666]">
                          {' '}
                          ({session.opponentCapacity})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />

                  {/* العمود الثالث: القرار */}
                  <div className="flex-[3] flex flex-col items-start px-1">
                    {session.decision && (
                      <span className="font-amiri text-xs font-bold text-[#B23A3A]">
                        {session.decision}
                      </span>
                    )}
                    {session.previousSession && (
                      <span className="text-[9px] text-[#666666]">
                        س: {session.previousSession}
                      </span>
                    )}
                    {session.notes && (
                      <span className="text-[9px] italic text-[#2C2C2C] line-clamp-1">
                        {session.notes}
                      </span>
                    )}
                  </div>

                  {/* زر الحذف */}
                  <div
                    className="w-9 flex items-center justify-center self-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (session.id != null) {
                        setDeleteTargetId(session.id);
                      }
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`حذف جلسة ${session.clientName}`}
                      className="p-1.5 text-[#B23A3A] hover:bg-[#B23A3A]/10 rounded transition-colors cursor-pointer"
                      title="حذف الجلسة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="إضافة جلسة جديدة"
        onClick={() => {
          setEditingSession(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-16 left-6 w-13 h-13 rounded-2xl bg-[#3E5228] text-white shadow-lg flex items-center justify-center hover:bg-[#3E5228]/90 transition-transform active:scale-95 cursor-pointer z-20"
        title="إضافة جلسة جديدة"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-[#D0D0D0]">
            <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-[#666666] mb-5">
              هل أنت متأكد من حذف هذه الجلسة؟
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-1.5 text-sm text-[#666666] hover:bg-gray-100 rounded cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-sm font-bold text-[#B23A3A] hover:bg-[#B23A3A]/10 rounded cursor-pointer"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AddEditSessionViewProps {
  session: Session | null;
  initialDate: Date;
  onClose: () => void;
  onSaved: () => void;
}

const AddEditSessionView: React.FC<AddEditSessionViewProps> = ({
  session,
  initialDate,
  onClose,
  onSaved,
}) => {
  const [dateStr, setDateStr] = useState<string>(() =>
    session
      ? session.sessionDate.split('T')[0]
      : AppDateUtils.toDateInputString(initialDate)
  );
  const [courtName, setCourtName] = useState(session?.courtName ?? '');
  const [circuit, setCircuit] = useState(session?.circuit ?? '');
  const [caseNumber, setCaseNumber] = useState(session?.caseNumber ?? '');
  const [caseYear, setCaseYear] = useState(
    session ? String(session.caseYear) : String(new Date().getFullYear())
  );
  const [clientName, setClientName] = useState(session?.clientName ?? '');
  const [clientCapacity, setClientCapacity] = useState(
    session?.clientCapacity ?? ''
  );
  const [opponentName, setOpponentName] = useState(session?.opponentName ?? '');
  const [opponentCapacity, setOpponentCapacity] = useState(
    session?.opponentCapacity ?? ''
  );
  const [previousSession, setPreviousSession] = useState(
    session?.previousSession ?? ''
  );
  const [decision, setDecision] = useState(session?.decision ?? '');
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!courtName.trim()) nextErrors.courtName = 'هذا الحقل مطلوب';
    if (!circuit.trim()) nextErrors.circuit = 'هذا الحقل مطلوب';
    if (!caseNumber.trim()) nextErrors.caseNumber = 'هذا الحقل مطلوب';
    if (!caseYear.trim()) {
      nextErrors.caseYear = 'هذا الحقل مطلوب';
    } else {
      const y = Number(caseYear.trim());
      if (!Number.isInteger(y)) {
        nextErrors.caseYear = 'أدخل رقماً صحيحاً';
      } else if (y < 1900 || y > 2100) {
        nextErrors.caseYear = 'سنة غير صالحة';
      }
    }
    if (!clientName.trim()) nextErrors.clientName = 'هذا الحقل مطلوب';
    if (!opponentName.trim()) nextErrors.opponentName = 'هذا الحقل مطلوب';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const sessionObj: Session = {
        id: session?.id,
        courtName: courtName.trim(),
        circuit: circuit.trim(),
        caseNumber: caseNumber.trim(),
        caseYear: Number(caseYear.trim()),
        clientName: clientName.trim(),
        clientCapacity: clientCapacity.trim(),
        opponentName: opponentName.trim(),
        opponentCapacity: opponentCapacity.trim(),
        previousSession: previousSession.trim(),
        decision: decision.trim(),
        notes: notes.trim(),
        sessionDate: `${dateStr}T00:00:00.000`,
        createdAt: session?.createdAt ?? nowIso,
        updatedAt: nowIso,
        isDemo: false, // Any user-created or user-edited session becomes a real persisted record
      };

      if (session?.id != null) {
        await dbHelper.update('sessions', sessionToMap(sessionObj), session.id);
      } else {
        await dbHelper.insert('sessions', sessionToMap(sessionObj));
      }
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7]">
      {/* AppBar */}
      <div className="bg-[#3E5228] text-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          aria-label="رجوع"
          className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <h2 className="font-amiri text-xl font-bold">
          {session == null ? 'إضافة جلسة جديدة' : 'تعديل الجلسة'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* اختيار التاريخ */}
        <div className="bg-white border border-[#D0D0D0] rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#666666]">تاريخ الجلسة</div>
            <div className="text-sm font-semibold text-[#2C2C2C] mt-0.5">{dateStr}</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="border border-[#D0D0D0] rounded px-2 py-1 text-sm bg-[#FDFBF7] text-[#3E5228]"
            />
            <Calendar className="w-5 h-5 text-[#3E5228]" />
          </div>
        </div>

        {/* اسم المحكمة */}
        <div>
          <label className="block text-xs text-[#666666] mb-1">اسم المحكمة *</label>
          <input
            type="text"
            aria-label="اسم المحكمة"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            placeholder="مثال: محكمة القاهرة الجديدة"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
          {errors.courtName && (
            <p className="text-xs text-[#B23A3A] mt-1">{errors.courtName}</p>
          )}
        </div>

        {/* الدائرة */}
        <div>
          <label className="block text-xs text-[#666666] mb-1">الدائرة *</label>
          <input
            type="text"
            aria-label="الدائرة"
            value={circuit}
            onChange={(e) => setCircuit(e.target.value)}
            placeholder="مثال: الدائرة 5 مدني"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
          {errors.circuit && (
            <p className="text-xs text-[#B23A3A] mt-1">{errors.circuit}</p>
          )}
        </div>

        {/* رقم الدعوى والسنة */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs text-[#666666] mb-1">رقم الدعوى *</label>
            <input
              type="text"
              aria-label="رقم الدعوى"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="1234"
              className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
            />
            {errors.caseNumber && (
              <p className="text-xs text-[#B23A3A] mt-1">{errors.caseNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-[#666666] mb-1">السنة *</label>
            <input
              type="number"
              aria-label="السنة"
              value={caseYear}
              onChange={(e) => setCaseYear(e.target.value)}
              placeholder={String(new Date().getFullYear())}
              className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
            />
            {errors.caseYear && (
              <p className="text-xs text-[#B23A3A] mt-1">{errors.caseYear}</p>
            )}
          </div>
        </div>

        <hr className="border-[#E0E0E0] my-2" />

        {/* اسم الموكل وصفته */}
        <div>
          <label className="block text-xs text-[#666666] mb-1">اسم الموكل *</label>
          <input
            type="text"
            aria-label="اسم الموكل"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
          {errors.clientName && (
            <p className="text-xs text-[#B23A3A] mt-1">{errors.clientName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#666666] mb-1">صفة الموكل</label>
          <input
            type="text"
            aria-label="صفة الموكل"
            value={clientCapacity}
            onChange={(e) => setClientCapacity(e.target.value)}
            placeholder="مدعي / مدعى عليه / متهم"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* اسم الخصم وصفته */}
        <div>
          <label className="block text-xs text-[#666666] mb-1">اسم الخصم *</label>
          <input
            type="text"
            aria-label="اسم الخصم"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
          {errors.opponentName && (
            <p className="text-xs text-[#B23A3A] mt-1">{errors.opponentName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#666666] mb-1">صفة الخصم</label>
          <input
            type="text"
            aria-label="صفة الخصم"
            value={opponentCapacity}
            onChange={(e) => setOpponentCapacity(e.target.value)}
            placeholder="مدعي / مدعى عليه / سلطة اتهام"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>

        <hr className="border-[#E0E0E0] my-2" />

        {/* الجلسة السابقة والقرار والملاحظات */}
        <div>
          <label className="block text-xs text-[#666666] mb-1">الجلسة السابقة</label>
          <input
            type="text"
            aria-label="الجلسة السابقة"
            value={previousSession}
            onChange={(e) => setPreviousSession(e.target.value)}
            placeholder="تاريخ وقرار الجلسة السابقة"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[#666666] mb-1">القرار الحالي</label>
          <input
            type="text"
            aria-label="القرار الحالي"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="تأجيل / حجز / حكم"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[#666666] mb-1">ملاحظات</label>
          <textarea
            rows={3}
            aria-label="ملاحظات"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="pt-2 pb-12">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#3E5228] hover:bg-[#3E5228]/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 text-base transition-colors cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>حفظ الجلسة</span>
          </button>
        </div>
      </form>
    </div>
  );
};
