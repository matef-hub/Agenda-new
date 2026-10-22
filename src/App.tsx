import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  UserSquare2,
  FileSignature,
  ScrollText,
  ClipboardCheck,
  Database,
  Trash2,
} from 'lucide-react';
import { DailyScheduleScreen } from './features/daily_schedule/DailyScheduleScreen';
import { PersonalDataScreen } from './features/personal_data/PersonalDataScreen';
import { PowersOfAttorneyScreen } from './features/powers_of_attorney/PowersOfAttorneyScreen';
import { BailiffsScreen } from './features/bailiffs/BailiffsScreen';
import { AdminWorkScreen } from './features/admin_work/AdminWorkScreen';
import { dbHelper } from './core/database/databaseHelper';

export const SECTION_CONFIG = [
  {
    title: 'الجلسات اليومية',
    navLabel: 'اليومية',
    icon: CalendarDays,
  },
  {
    title: 'البيانات الشخصية',
    navLabel: 'البيانات',
    icon: UserSquare2,
  },
  {
    title: 'التوكيلات',
    navLabel: 'التوكيلات',
    icon: FileSignature,
  },
  {
    title: 'المحضرين',
    navLabel: 'المحضرين',
    icon: ScrollText,
  },
  {
    title: 'الأعمال الإدارية',
    navLabel: 'إدارية',
    icon: ClipboardCheck,
  },
] as const;

export function App() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasDemo, setHasDemo] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const checkDemoStatus = useCallback(async () => {
    const demoPresent = await dbHelper.hasDemoData();
    setHasDemo(demoPresent);
  }, []);

  useEffect(() => {
    checkDemoStatus();
  }, [checkDemoStatus, refreshTrigger]);

  const handleLoadDemo = async () => {
    await dbHelper.seedDemoData(new Date());
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClearDemo = async () => {
    await dbHelper.clearDemoData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    // In RTL layout: swipe right-to-left or left-to-right
    if (Math.abs(deltaX) > 60) {
      if (deltaX > 0 && currentIndex < SECTION_CONFIG.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (deltaX < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    setTouchStartX(null);
  };

  return (
    <div
      className="h-screen w-screen bg-[#FDFBF7] flex flex-col overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* شريط حالة البيانات (تمييز البيانات التجريبية عن المحفوظة محلياً) */}
      <div className="bg-[#3E5228]/8 border-b border-[#C5A059]/40 px-3 py-1.5 flex items-center justify-between text-[11px] text-[#2C2C2C]">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#3E5228]" />
          <span>
            التخزين المحلي (LocalStorage) —{' '}
            {hasDemo ? (
              <strong className="text-[#B23A3A]">يتضمن بيانات تجريبية للمعاينة</strong>
            ) : (
              <strong className="text-[#3E5228]">السجلات الفعلية فقط</strong>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!hasDemo ? (
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-2 py-0.5 rounded bg-[#C5A059]/25 hover:bg-[#C5A059]/40 text-[#3E5228] font-semibold border border-[#C5A059] transition-colors cursor-pointer"
            >
              تحميل بيانات تجريبية
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClearDemo}
              className="px-2 py-0.5 rounded bg-[#B23A3A]/10 hover:bg-[#B23A3A]/20 text-[#B23A3A] font-semibold border border-[#B23A3A]/30 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>مسح البيانات التجريبية</span>
            </button>
          )}
        </div>
      </div>

      {/* شريط العنوان الأنيق (Minimalist Header matching JudicialAgendaShell) */}
      <header className="px-5 pt-3 pb-2 bg-[#FDFBF7] max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* الخط الذهبي الأيمن */}
            <div
              className="w-[3px] h-8 rounded-sm"
              style={{
                background: 'linear-gradient(to bottom, #C5A059, #3E5228)',
              }}
            />
            {/* العنوان بخط أميري */}
            <h1
              data-testid="shell-header-title"
              className="font-amiri text-[26px] sm:text-[28px] font-semibold text-[#3E5228] leading-tight"
            >
              {SECTION_CONFIG[currentIndex].title}
            </h1>
          </div>

          {/* مؤشر التنقل السريع (نقاط قابلة للضغط) */}
          <div className="flex items-center justify-center gap-2">
            {SECTION_CONFIG.map((sec, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={sec.title}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`مؤشر ${sec.title}`}
                  className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    width: isActive ? 24 : 8,
                    backgroundColor: isActive
                      ? '#3E5228'
                      : 'rgba(62, 82, 40, 0.2)',
                  }}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* الشاشة الحالية */}
      <main className="flex-1 overflow-hidden max-w-3xl w-full mx-auto">
        {currentIndex === 0 && (
          <DailyScheduleScreen
            refreshTrigger={refreshTrigger}
            onDataChange={checkDemoStatus}
          />
        )}
        {currentIndex === 1 && (
          <PersonalDataScreen
            refreshTrigger={refreshTrigger}
            onDataChange={checkDemoStatus}
          />
        )}
        {currentIndex === 2 && (
          <PowersOfAttorneyScreen
            refreshTrigger={refreshTrigger}
            onDataChange={checkDemoStatus}
          />
        )}
        {currentIndex === 3 && (
          <BailiffsScreen
            refreshTrigger={refreshTrigger}
            onDataChange={checkDemoStatus}
          />
        )}
        {currentIndex === 4 && (
          <AdminWorkScreen
            refreshTrigger={refreshTrigger}
            onDataChange={checkDemoStatus}
          />
        )}
      </main>

      {/* شريط التنقل السفلي الواضح (Accessible BottomNavigationBar) */}
      <nav
        aria-label="التنقل الرئيسي"
        className="bg-[#FDFBF7] border-t-2 border-[#C5A059] px-2 py-1.5 shadow-sm z-30"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-5 gap-1">
          {SECTION_CONFIG.map((sec, index) => {
            const Icon = sec.icon;
            const isActive = index === currentIndex;
            return (
              <button
                key={sec.navLabel}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#3E5228] font-bold bg-[#3E5228]/10'
                    : 'text-[#666666] hover:text-[#3E5228] hover:bg-[#3E5228]/5'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] leading-tight">{sec.navLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
