import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Edit3 } from 'lucide-react';
import { dbHelper } from '../../core/database/databaseHelper';
import { AppDateUtils } from '../../core/utils/dateUtils';

export interface AdminNote {
  id: number;
  title: string;
  content: string;
  is_completed: number;
  note_date: string;
  created_at: string;
  is_demo?: number;
}

interface AdminWorkScreenProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

export const AdminWorkScreen: React.FC<AdminWorkScreenProps> = ({
  refreshTrigger = 0,
  onDataChange,
}) => {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate] = useState<Date>(() => new Date());

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<AdminNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await dbHelper.queryAll<AdminNote>('admin_notes');
    setNotes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const filteredNotes = useMemo(() => {
    if (statusFilter === 'pending') {
      return notes.filter((n) => Number(n.is_completed) !== 1);
    }
    if (statusFilter === 'completed') {
      return notes.filter((n) => Number(n.is_completed) === 1);
    }
    return notes;
  }, [notes, statusFilter]);

  const openDialog = (note?: AdminNote) => {
    setFormError(null);
    if (note) {
      setEditingNote(note);
      setTitle(note.title ?? '');
      setContent(note.content ?? '');
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
    }
    setIsDialogOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) {
      setFormError('يرجى إدخال عنوان أو تفاصيل العمل الإداري');
      return;
    }

    if (editingNote) {
      await dbHelper.update(
        'admin_notes',
        {
          title: title.trim(),
          content: content.trim(),
          is_completed: editingNote.is_completed,
          is_demo: 0,
        },
        editingNote.id
      );
    } else {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        is_completed: 0,
        note_date: selectedDate.toISOString(),
        created_at: new Date().toISOString(),
        is_demo: 0,
      };
      await dbHelper.insert('admin_notes', payload);
    }

    setTitle('');
    setContent('');
    setEditingNote(null);
    setIsDialogOpen(false);
    await loadData();
    onDataChange?.();
  };

  const toggleNoteCompletion = async (note: AdminNote) => {
    const nextState = note.is_completed === 1 ? 0 : 1;
    await dbHelper.update(
      'admin_notes',
      { is_completed: nextState, is_demo: note.is_demo ?? 0 },
      note.id
    );
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId == null) return;
    await dbHelper.delete('admin_notes', deleteTargetId);
    setDeleteTargetId(null);
    await loadData();
    onDataChange?.();
  };

  return (
    <div className="relative flex flex-col h-full bg-[#FDFBF7]">
      {/* Header similar to Daily Schedule */}
      <div className="px-4 py-3 bg-[#FDFBF7] border-b-2 border-[#C5A059] flex items-center justify-between">
        <span className="font-amiri font-bold text-[#3E5228] text-base">
          {AppDateUtils.getHijriDay(selectedDate)}{' '}
          {AppDateUtils.getHijriMonth(selectedDate)}
        </span>
        <h2 className="font-amiri text-2xl font-bold text-[#2C2C2C]">
          أعمال إدارية
        </h2>
        <span className="font-amiri font-bold text-[#3E5228] text-base">
          {AppDateUtils.getGregorianDay(selectedDate)}{' '}
          {AppDateUtils.getGregorianMonth(selectedDate)}
        </span>
      </div>

      {/* Filter bar */}
      <div className="px-3 py-2 flex items-center justify-center gap-2 border-b border-[#E0E0E0]">
        {(
          [
            { key: 'all', label: 'الكل' },
            { key: 'pending', label: 'قيد التنفيذ' },
            { key: 'completed', label: 'مكتملة' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-[#3E5228] text-white'
                : 'bg-white text-[#3E5228] border border-[#D0D0D0] hover:bg-[#3E5228]/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#3E5228] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#666666]">لا توجد أعمال مسجلة</p>
          </div>
        ) : (
          <div className="m-2.5 flex-1 border-2 border-[#3E5228] bg-white flex flex-col overflow-hidden shadow-2xs">
            {/* رأس الجدول */}
            <div className="py-2 bg-[#A3B18A] border-b-2 border-[#3E5228] flex items-center text-center">
              <div className="flex-[5] font-amiri text-sm font-bold text-[#3E5228]">
                العنوان / التفاصيل
              </div>
              <div className="flex-[1] font-amiri text-sm font-bold text-[#3E5228]">
                الحالة
              </div>
              <div className="w-16 font-amiri text-xs font-bold text-[#3E5228]">
                إجراءات
              </div>
            </div>

            {/* محتوى الجدول */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#D0D0D0]">
              {filteredNotes.map((note) => {
                const isCompleted = note.is_completed === 1;
                const isDemo = Number(note.is_demo) === 1;
                return (
                  <div
                    key={note.id}
                    onClick={() => toggleNoteCompletion(note)}
                    className="px-2 py-2.5 flex items-center hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                  >
                    <div className="flex-[5] flex flex-col items-start pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-amiri text-sm font-bold ${
                            isCompleted
                              ? 'line-through text-[#666666]'
                              : 'text-[#2C2C2C]'
                          }`}
                        >
                          {note.title || 'بدون عنوان'}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border ${
                            isDemo
                              ? 'bg-[#C5A059]/15 text-[#3E5228] border-[#C5A059]'
                              : 'bg-[#3E5228]/10 text-[#3E5228] border-[#3E5228]/30'
                          }`}
                        >
                          {isDemo ? 'بيانات تجريبية' : 'محفوظ محلياً'}
                        </span>
                      </div>
                      {note.content && (
                        <span
                          className={`text-[11px] line-clamp-2 ${
                            isCompleted
                              ? 'line-through text-[#666666]'
                              : 'text-[#2C2C2C]'
                          }`}
                        >
                          {note.content}
                        </span>
                      )}
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div className="flex-[1] flex items-center justify-center">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#3E5228]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#D0D0D0]" />
                      )}
                    </div>
                    <div className="w-[1px] self-stretch bg-[#D0D0D0] mx-1" />
                    <div
                      className="w-16 flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`تعديل ${note.title || 'عمل إداري'}`}
                        onClick={() => openDialog(note)}
                        className="p-1 text-[#3E5228] hover:bg-[#3E5228]/10 rounded cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`حذف ${note.title || 'عمل إداري'}`}
                        onClick={() => setDeleteTargetId(note.id)}
                        className="p-1 text-[#B23A3A] hover:bg-[#B23A3A]/10 rounded cursor-pointer"
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
        aria-label="عمل إداري جديد"
        onClick={() => openDialog()}
        className="fixed bottom-16 left-6 w-13 h-13 rounded-2xl bg-[#3E5228] text-white shadow-lg flex items-center justify-center hover:bg-[#3E5228]/90 transition-transform active:scale-95 cursor-pointer z-20"
        title="عمل إداري جديد"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-[#D0D0D0]">
            <h3 className="font-amiri text-xl font-bold text-[#2C2C2C] mb-4">
              {editingNote == null ? 'عمل إداري جديد' : 'تعديل عمل إداري'}
            </h3>
            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="block text-xs text-[#666666] mb-1">العنوان</label>
                <input
                  type="text"
                  aria-label="عنوان العمل الإداري"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">التفاصيل</label>
                <textarea
                  rows={3}
                  aria-label="تفاصيل العمل الإداري"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-[#D0D0D0] focus:border-[#3E5228] rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              {formError && (
                <p className="text-xs text-[#B23A3A]">{formError}</p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
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
              هل أنت متأكد من حذف هذا العمل الإداري؟
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
