import React, { useState, useEffect } from 'react';
import { Save, UserCircle, ShieldCheck } from 'lucide-react';
import { dbHelper } from '../../core/database/databaseHelper';

interface PersonalDataScreenProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

export const PersonalDataScreen: React.FC<PersonalDataScreenProps> = ({
  refreshTrigger = 0,
  onDataChange,
}) => {
  const [recordId, setRecordId] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [homeTel, setHomeTel] = useState('');
  const [officeTel, setOfficeTel] = useState('');
  const [mobile, setMobile] = useState('');
  const [idCardNo, setIdCardNo] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [carLicenseNo, setCarLicenseNo] = useState('');
  const [drivingLicenseNo, setDrivingLicenseNo] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await dbHelper.queryAll('personal_info');
      if (data.length > 0) {
        const row = data[0];
        setRecordId(row.id ?? null);
        setIsDemo(Number(row.is_demo) === 1);
        setName(row.name ?? '');
        setHomeAddress(row.home_address ?? '');
        setOfficeAddress(row.office_address ?? '');
        setHomeTel(row.home_tel ?? '');
        setOfficeTel(row.office_tel ?? '');
        setMobile(row.mobile ?? '');
        setIdCardNo(row.id_card_no ?? '');
        setPassportNo(row.passport_no ?? '');
        setCarLicenseNo(row.car_license_no ?? '');
        setDrivingLicenseNo(row.driving_license_no ?? '');
        setBankAccountNo(row.bank_account_no ?? '');
        setEmail(row.email ?? '');
      } else {
        setRecordId(null);
        setIsDemo(false);
        setName('');
        setHomeAddress('');
        setOfficeAddress('');
        setHomeTel('');
        setOfficeTel('');
        setMobile('');
        setIdCardNo('');
        setPassportNo('');
        setCarLicenseNo('');
        setDrivingLicenseNo('');
        setBankAccountNo('');
        setEmail('');
      }
      setIsLoading(false);
    };
    loadData();
  }, [refreshTrigger]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = {
      name,
      home_address: homeAddress,
      office_address: officeAddress,
      home_tel: homeTel,
      office_tel: officeTel,
      mobile,
      id_card_no: idCardNo,
      passport_no: passportNo,
      car_license_no: carLicenseNo,
      driving_license_no: drivingLicenseNo,
      bank_account_no: bankAccountNo,
      // Payment card storage (`credit_card_no`) is intentionally omitted for personal data security
      credit_card_no: '',
      email,
      updated_at: new Date().toISOString(),
      is_demo: 0,
    };

    if (recordId != null) {
      await dbHelper.update('personal_info', payload, recordId);
    } else {
      const id = await dbHelper.insert('personal_info', payload);
      setRecordId(id);
    }
    setIsDemo(false);
    onDataChange?.();

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    type: string = 'text'
  ) => (
    <div className="mb-3">
      <label className="block text-xs text-[#2C2C2C] mb-1">{label}</label>
      <input
        type={type}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-[#D0D0D0] focus:border-b-2 focus:border-[#3E5228] py-1.5 text-sm text-[#2C2C2C] outline-none transition-colors"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7]">
      {/* AppBar */}
      <div className="px-4 py-2.5 bg-[#FDFBF7] flex items-center justify-between border-b border-[#E0E0E0]">
        <div className="flex items-center gap-2">
          <h2 className="font-amiri text-xl font-bold text-[#B23A3A]">
            البيانات الشخصية
          </h2>
          {recordId != null && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded border ${
                isDemo
                  ? 'bg-[#C5A059]/15 text-[#3E5228] border-[#C5A059]'
                  : 'bg-[#3E5228]/10 text-[#3E5228] border-[#3E5228]/30'
              }`}
            >
              {isDemo ? 'بيانات تجريبية' : 'محفوظ محلياً'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleSave()}
          aria-label="حفظ البيانات الشخصية"
          className="p-2 text-[#3E5228] hover:bg-[#3E5228]/10 rounded-full transition-colors cursor-pointer"
          title="حفظ البيانات"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>

      {savedNotice && (
        <div className="mx-4 mt-2 bg-[#3E5228] text-white text-xs px-3 py-2 rounded shadow text-center">
          تم حفظ البيانات بنجاح
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#3E5228] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4">
          {/* Header Image Style */}
          <div className="py-4 border-b-2 border-[#C5A059] flex items-center justify-center gap-4 mb-5">
            <UserCircle className="w-14 h-14 text-[#3E5228]" />
            <span className="font-amiri text-2xl font-bold text-[#3E5228]">
              الأجندة القضائية
            </span>
          </div>

          {renderField('الاسم / Name', name, setName)}
          {renderField('عنوان المنزل / Home Address', homeAddress, setHomeAddress)}
          {renderField('عنوان المكتب / Office Address', officeAddress, setOfficeAddress)}

          <hr className="my-5 border-[#E0E0E0]" />

          {renderField('تليفون المنزل / Home Tel', homeTel, setHomeTel, 'tel')}
          {renderField('تليفون المكتب / Office Tel', officeTel, setOfficeTel, 'tel')}
          {renderField('رقم الموبايل / Mobile', mobile, setMobile, 'tel')}

          <hr className="my-5 border-[#E0E0E0]" />

          {renderField('رقم البطاقة / ID Card No', idCardNo, setIdCardNo)}
          {renderField('رقم جواز السفر / Passport No', passportNo, setPassportNo)}
          {renderField(
            'رقم رخصة السيارة / Car License No',
            carLicenseNo,
            setCarLicenseNo
          )}
          {renderField(
            'رقم رخصة القيادة / Driving License No',
            drivingLicenseNo,
            setDrivingLicenseNo
          )}

          <hr className="my-5 border-[#E0E0E0]" />

          {renderField(
            'رقم حساب البنك / Bank Account No',
            bankAccountNo,
            setBankAccountNo
          )}
          {renderField('البريد الإلكتروني / E-mail', email, setEmail, 'email')}

          {/* Security Notice */}
          <div className="mt-4 p-3 rounded border border-[#C5A059]/60 bg-[#C5A059]/10 flex items-start gap-2 text-xs text-[#2C2C2C]">
            <ShieldCheck className="w-4 h-4 text-[#3E5228] shrink-0 mt-0.5" />
            <div>
              <strong>حماية البيانات المحلية:</strong> تم استبعاد حقل أرقام بطاقات
              الدفع والائتمان لحماية خصوصيتك. تُحفظ البيانات محلياً في المتصفح
              (LocalStorage) بدون تشفير سحابي.
            </div>
          </div>

          <div className="pt-4 pb-10">
            <button
              type="submit"
              className="w-full bg-[#3E5228] text-white py-2.5 rounded-lg font-semibold hover:bg-[#3E5228]/90 transition-colors cursor-pointer"
            >
              حفظ البيانات
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
