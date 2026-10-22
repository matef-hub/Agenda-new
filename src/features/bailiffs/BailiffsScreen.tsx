import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { dbHelper } from '../../core/database/databaseHelper';

export interface BailiffPaper {
  id: number;
  reference_number: string;
  bailiffs_office: string;
  client_name: string;
  delivery_date: string;
  hearing_date: string;
  status: string;
  notes: string;
  created_at: string;
  is_demo?: number;
}

interface BailiffsScreenProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

export const BailiffsScreen: React.FC<BailiffsScreenProps> = ({
  refreshTrigger = 0,
  onDataChange,
}) => {
  const [papers, setPapers] = useState<BailiffPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<BailiffPaper | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bailiffsOffice, setBailiffsOffice] = useState('');
  const [clientName, setClientName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await dbHelper.queryAll<BailiffPaper>('bailiff_papers');
    setPapers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const filteredPapers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) =>
        String(p.reference_number || '')
          .toLowerCase()
          .includes(q) ||
        String(p.bailiffs_office || '')
          .toLowerCase()
          .includes(q) ||
        String(p.client_name || '')
          .toLowerCase()
          .includes(q) ||
        String(p.status || '')
          .toLowerCase()
          .includes(q)
    );
  }, [papers, searchQuery]);

  const openDialog = (paper?: BailiffPaper) => {
    setFormErrors({});
    if (paper) {
      setEditingPaper(paper);
      setReferenceNumber(paper.reference_number ?? '');
      setBailiffsOffice(paper.bailiffs_office ?? '');
      setClientName(paper.client_name ?? '');
      setDeliveryDate(paper.delivery_date ?? '');
      setHearingDate(paper.hearing_date ?? '');
      setStatus(paper.status ?? '');
      setNotes(paper.notes ?? '');
    } else {
      setEditingPaper(null);
      setReferenceNumber('');
      setBailiffsOffice('');
      setClientName('');
      setDeliveryDate('');
      setHearingDate('');
      setStatus('');
      setNotes('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!referenceNumber.trim()) errs.referenceNumber = 'هذا الحقل مطلوب';
    if (!bailiffsOffice.trim()) errs.bailiffsOffice = 'هذا الحقل مطلوب';
    if (!clientName.trim()) errs.clientName = 'هذا الحقل مطلوب';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      reference_number: referenceNumber.trim(),
      bailiffs_office: bailiffsOffice.trim(),
      client_name: clientName.trim(),
      delivery_date: deliveryDate.trim(),
      hearing_date: hearingDate.trim(),
      status: status.trim(),
      notes: notes.trim(),
      created_at: editingPaper?.created_at ?? new Date().toISOString(),
      is_demo: 0,
    };

    if (editingPaper) {
      await dbHelper.update('bailiff_papers', payload, editingPaper.id);
    } else {
      await dbHelper.insert('bailiff_papers', payload);
    }
    setIsDialogOpen(false);
    await loadData();
    onDataChange?.();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId == null) return;
    await dbHelper.delete('bailiff_papers', deleteTargetId);
    setDeleteTargetId(null);
    await loadData();
    onDataChange?.();
  };

  return (
    <div className="relative flex flex-col h-full bg-[#FDFBF7]">
      {/* AppBar */}
      <div className="px-4 py-2.5 bg-[#FDFBF7] border-b border-[#C5A059] text-center">
        <h2 className="font-amiri text-xl font-bold text-[#3E5228]">
          أوراق المحضرين
        </h2>
      </div>

      {/* Search bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#666666] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الورقة أو قلم المحضرين أو الموكل..."
            aria-label="بحث في أوراق المحضرين"
            className="w-full bg-white border border-[#D0D0D0] focus:border-[#3E5228] rounded-lg pr-9 pl-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#3E5228] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#666666]">
              {searchQuery.trim() === ''
                ? 'لا توجد أوراق مسجلة'
                : 'لا توجد نتائج مطابقة'}
            </p>
          </div>
        ) : (
          <div className="m-2.5 flex-1 border-2 border-[#3E5228] bg-white flex flex-col overflow-hidden shadow-2xs">
            {/* رأس الجدول */}
            <div className="py-2 bg-[#A3B18A] border-b-2 border-[#3E5228] flex items-center text-center">
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                الرقم / القلم
              </div>
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                الموكل
              </div>
              <div className="flex-[3] font-amiri text-sm font-bold text-[#3E5228]">
                التواريخ / الحالة
              </div>
              <div className="w-9 font-amiri text-xs font-bold text-[#3E5228]">
                حذف
              </div>
            </div>

            {/* محتوى الجدول */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#D0D0D0]">
              {filteredPapers.map((p) => {
                const isDemo = Number(p.is_demo) === 1;
                return (
                  <div
                    key={p.id}
                    onClick={() => openDialog(p)}
                    className="px-2 py-2.5 flex items-center hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                  >
                    <div className="flex-[3] flex flex-col items-start pr-1">
                      <span className="font-amiri text-[13px] font-bold text-[#2C2C2C]">
                        {p.reference_number}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        {p.bailiffs_office}
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
                    <div className="flex-[3] px-1.5 text-xs text-[#2C2C2C] font-medium">
                      {p.client_name}
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div className="flex-[3] px-1.5 flex flex-col items-start">
                      <span className="text-[10px] text-[#2C2C2C]">
                        تسليم: {p.delivery_date || '-'}
                      </span>
                      <span className="text-[10px] text-[#B23A3A] font-semibold">
                        جلسة: {p.hearing_date || '-'}
                      </span>
                      {p.status && (
                        <span className="text-[9px] italic text-[#3E5228] mt-0.5">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div
                      className="w-9 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(p.id);
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`حذف ورقة ${p.reference_number}`}
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
        aria-label="إضافة ورقة محضرين"
        onClick={() => openDialog()}
        className="fixed bottom-16 left-6 w-13 h-13 rounded-2xl bg-[#3E5228] text-white shadow-lg flex items-center justify-center hover:bg-[#3E5228]/90 transition-transform active:scale-95 cursor-pointer z-20"
        title="إضافة ورقة محضرين"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-[#D0D0D0]">
            <h3 className="font-amiri text-xl font-bold text-[#2C2C2C] mb-4">
              {editingPaper == null ? 'إضافة ورقة محضرين' : 'تعديل ورقة'}
            </h3>
            <form onSubmit={handleSave} className="space-y-2.5">
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  الرقم *
                </label>
                <input
                  type="text"
                  aria-label="رقم الورقة"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
                />
                {formErrors.referenceNumber && (
                  <p className="text-xs text-[#B23A3A] mt-0.5">
                    {formErrors.referenceNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  قلم المحضرين *
                </label>
                <input
                  type="text"
                  aria-label="قلم المحضرين"
                  value={bailiffsOffice}
                  onChange={(e) => setBailiffsOffice(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
                />
                {formErrors.bailiffsOffice && (
                  <p className="text-xs text-[#B23A3A] mt-0.5">
                    {formErrors.bailiffsOffice}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  اسم الموكل *
                </label>
                <input
                  type="text"
                  aria-label="اسم الموكل"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
                />
                {formErrors.clientName && (
                  <p className="text-xs text-[#B23A3A] mt-0.5">
                    {formErrors.clientName}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#666666] mb-1">
                    تاريخ التسليم
                  </label>
                  <input
                    type="text"
                    aria-label="تاريخ التسليم"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#666666] mb-1">
                    تاريخ الجلسة
                  </label>
                  <input
                    type="text"
                    aria-label="تاريخ الجلسة"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  الحالة
                </label>
                <input
                  type="text"
                  aria-label="حالة الورقة"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  aria-label="ملاحظات الورقة"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-1.5 text-sm outline-none"
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
              هل أنت متأكد من حذف ورقة المحضرين هذه؟
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
