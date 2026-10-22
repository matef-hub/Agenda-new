import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { dbHelper } from '../../core/database/databaseHelper';

export interface PoaRecord {
  id: number;
  client_name: string;
  poa_number: string;
  notarization_office: string;
  poa_type: string;
  poa_date: string;
  notes: string;
  created_at: string;
  is_demo?: number;
}

interface PowersOfAttorneyScreenProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

export const PowersOfAttorneyScreen: React.FC<PowersOfAttorneyScreenProps> = ({
  refreshTrigger = 0,
  onDataChange,
}) => {
  const [poaList, setPoaList] = useState<PoaRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'client_name' | 'poa_date'>('client_name');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoa, setEditingPoa] = useState<PoaRecord | null>(null);
  const [clientName, setClientName] = useState('');
  const [poaNumber, setPoaNumber] = useState('');
  const [notarizationOffice, setNotarizationOffice] = useState('');
  const [poaType, setPoaType] = useState('');
  const [poaDate, setPoaDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await dbHelper.queryAll<PoaRecord>('powers_of_attorney');
      setPoaList(data);
    } catch (e: any) {
      setErrorMessage(`فشل تحميل التوكيلات: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = !q
      ? [...poaList]
      : poaList.filter((poa) => {
          const name = String(poa.client_name || '').toLowerCase();
          const num = String(poa.poa_number || '').toLowerCase();
          const office = String(poa.notarization_office || '').toLowerCase();
          return name.includes(q) || num.includes(q) || office.includes(q);
        });

    matches.sort((a, b) => {
      if (sortBy === 'client_name') {
        return String(a.client_name || '').localeCompare(
          String(b.client_name || ''),
          'ar'
        );
      }
      return String(b.poa_date || '').localeCompare(String(a.poa_date || ''));
    });

    return matches;
  }, [poaList, searchQuery, sortBy]);

  const openAddEditDialog = (poa?: PoaRecord) => {
    setFormErrors({});
    if (poa) {
      setEditingPoa(poa);
      setClientName(poa.client_name ?? '');
      setPoaNumber(poa.poa_number ?? '');
      setNotarizationOffice(poa.notarization_office ?? '');
      setPoaType(poa.poa_type ?? '');
      setPoaDate(poa.poa_date ?? '');
      setNotes(poa.notes ?? '');
    } else {
      setEditingPoa(null);
      setClientName('');
      setPoaNumber('');
      setNotarizationOffice('');
      setPoaType('');
      setPoaDate('');
      setNotes('');
    }
    setIsDialogOpen(true);
  };

  const handleSavePoa = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!clientName.trim()) errs.clientName = 'هذا الحقل مطلوب';
    if (!poaNumber.trim()) errs.poaNumber = 'هذا الحقل مطلوب';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      client_name: clientName.trim(),
      poa_number: poaNumber.trim(),
      notarization_office: notarizationOffice.trim(),
      poa_type: poaType.trim(),
      poa_date: poaDate.trim(),
      notes: notes.trim(),
      created_at: editingPoa?.created_at ?? new Date().toISOString(),
      is_demo: 0,
    };

    if (editingPoa) {
      await dbHelper.update('powers_of_attorney', payload, editingPoa.id);
    } else {
      await dbHelper.insert('powers_of_attorney', payload);
    }
    setIsDialogOpen(false);
    await loadData();
    onDataChange?.();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId == null) return;
    await dbHelper.delete('powers_of_attorney', deleteTargetId);
    setDeleteTargetId(null);
    await loadData();
    onDataChange?.();
  };

  return (
    <div className="relative flex flex-col h-full bg-[#FDFBF7]">
      {/* AppBar */}
      <div className="px-4 py-2.5 bg-[#FDFBF7] border-b border-[#C5A059] text-center">
        <h2 className="font-amiri text-xl font-bold text-[#3E5228]">
          فهرس التوكيلات
        </h2>
      </div>

      {/* Search & Sort bar */}
      <div className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#666666] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الموكل أو رقم التوكيل..."
            aria-label="بحث باسم الموكل أو رقم التوكيل"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg pr-9 pl-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            setSortBy((prev) =>
              prev === 'client_name' ? 'poa_date' : 'client_name'
            )
          }
          className="px-3 py-2 bg-white border border-[#D0D0D0] hover:border-[#3E5228] rounded-lg text-xs text-[#3E5228] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
          title="تغيير الترتيب"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortBy === 'client_name' ? 'ترتيب: الاسم' : 'ترتيب: التاريخ'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#3E5228] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <AlertCircle className="w-12 h-12 text-[#B23A3A] mb-2" />
            <p className="text-sm text-[#B23A3A] mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={loadData}
              className="text-sm text-[#3E5228] font-semibold hover:underline cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#666666]">
              {searchQuery.trim() === ''
                ? 'لا توجد توكيلات مسجلة'
                : 'لا توجد نتائج'}
            </p>
          </div>
        ) : (
          <div className="m-2.5 flex-1 border-2 border-[#3E5228] bg-white flex flex-col overflow-hidden shadow-2xs">
            {/* رأس الجدول */}
            <div className="py-2 bg-[#D4A373]/70 border-b-2 border-[#3E5228] flex items-center text-center">
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                الموكل
              </div>
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                رقم / مكتب
              </div>
              <div className="flex-[2] font-amiri text-sm font-bold text-[#3E5228]">
                النوع / التاريخ
              </div>
              <div className="flex-[1] font-amiri text-sm font-bold text-[#3E5228]">
                حذف
              </div>
            </div>

            {/* محتوى الجدول */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#D0D0D0]">
              {filteredList.map((poa) => {
                const isDemo = Number(poa.is_demo) === 1;
                return (
                  <div
                    key={poa.id}
                    onClick={() => openAddEditDialog(poa)}
                    className="px-2 py-2.5 flex items-center hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                  >
                    <div className="flex-[3] flex flex-col items-start pr-1">
                      <span className="font-amiri text-[13px] font-bold text-[#2C2C2C]">
                        {poa.client_name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border mt-0.5 ${
                          isDemo
                            ? 'bg-[#C5A059]/15 text-[#3E5228] border-[#C5A059]'
                            : 'bg-[#3E5228]/10 text-[#3E5228] border-[#3E5228]/30'
                        }`}
                      >
                        {isDemo ? 'بيانات تجريبية' : 'محفوظ محلياً'}
                      </span>
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div className="flex-[3] px-1.5 flex flex-col items-start">
                      <span className="text-[11px] text-[#2C2C2C] font-semibold">
                        رقم: {poa.poa_number || '-'}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        {poa.notarization_office}
                      </span>
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div className="flex-[2] px-1.5 flex flex-col items-start">
                      <span className="text-[11px] text-[#2C2C2C]">
                        {poa.poa_type}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        {poa.poa_date}
                      </span>
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div
                      className="flex-[1] flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(poa.id);
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`حذف توكيل ${poa.client_name}`}
                        className="p-1 text-[#B23A3A] hover:bg-[#B23A3A]/10 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="إضافة توكيل"
        onClick={() => openAddEditDialog()}
        className="fixed bottom-16 left-6 w-13 h-13 rounded-2xl bg-[#3E5228] text-white shadow-lg flex items-center justify-center hover:bg-[#3E5228]/90 transition-transform active:scale-95 cursor-pointer z-20"
        title="إضافة توكيل"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-[#D0D0D0]">
            <h3 className="font-amiri text-xl font-bold text-[#2C2C2C] mb-4">
              {editingPoa == null ? 'إضافة توكيل' : 'تعديل توكيل'}
            </h3>
            <form onSubmit={handleSavePoa} className="space-y-3">
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  اسم الموكل *
                </label>
                <input
                  type="text"
                  aria-label="اسم الموكل"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
                {formErrors.clientName && (
                  <p className="text-xs text-[#B23A3A] mt-1">
                    {formErrors.clientName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  رقم التوكيل *
                </label>
                <input
                  type="text"
                  aria-label="رقم التوكيل"
                  value={poaNumber}
                  onChange={(e) => setPoaNumber(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
                {formErrors.poaNumber && (
                  <p className="text-xs text-[#B23A3A] mt-1">
                    {formErrors.poaNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  مكتب التوثيق
                </label>
                <input
                  type="text"
                  aria-label="مكتب التوثيق"
                  value={notarizationOffice}
                  onChange={(e) => setNotarizationOffice(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">نوعه</label>
                <input
                  type="text"
                  aria-label="نوع التوكيل"
                  value={poaType}
                  onChange={(e) => setPoaType(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  التاريخ
                </label>
                <input
                  type="text"
                  aria-label="تاريخ التوكيل"
                  value={poaDate}
                  onChange={(e) => setPoaDate(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  aria-label="ملاحظات التوكيل"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-1.5 text-sm text-[#666666] hover:bg-gray-100 rounded cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 text-sm font-semibold bg-[#3E5228] text-white rounded hover:bg-[#3E5228]/90 cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-[#D0D0D0]">
            <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-[#666666] mb-5">
              هل أنت متأكد من حذف هذا التوكيل؟
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
