import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/database/database_helper.dart';

class PersonalDataScreen extends StatefulWidget {
  const PersonalDataScreen({super.key});

  @override
  State<PersonalDataScreen> createState() => _PersonalDataScreenState();
}

class _PersonalDataScreenState extends State<PersonalDataScreen> {
  final _dbHelper = DatabaseHelper();
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _nameCtrl = TextEditingController();
  final _homeAddrCtrl = TextEditingController();
  final _officeAddrCtrl = TextEditingController();
  final _homeTelCtrl = TextEditingController();
  final _officeTelCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _idCardCtrl = TextEditingController();
  final _passportCtrl = TextEditingController();
  final _carLicenseCtrl = TextEditingController();
  final _drivingLicenseCtrl = TextEditingController();
  final _bankAccountCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;
  int? _recordId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _homeAddrCtrl.dispose();
    _officeAddrCtrl.dispose();
    _homeTelCtrl.dispose();
    _officeTelCtrl.dispose();
    _mobileCtrl.dispose();
    _idCardCtrl.dispose();
    _passportCtrl.dispose();
    _carLicenseCtrl.dispose();
    _drivingLicenseCtrl.dispose();
    _bankAccountCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
      final data = await _dbHelper.queryAll('personal_info');
      if (!mounted) return;
      if (data.isNotEmpty) {
        final row = data.first;
        setState(() {
          _recordId = row['id'] as int?;
          _nameCtrl.text = row['name'] ?? '';
          _homeAddrCtrl.text = row['home_address'] ?? '';
          _officeAddrCtrl.text = row['office_address'] ?? '';
          _homeTelCtrl.text = row['home_tel'] ?? '';
          _officeTelCtrl.text = row['office_tel'] ?? '';
          _mobileCtrl.text = row['mobile'] ?? '';
          _idCardCtrl.text = row['id_card_no'] ?? '';
          _passportCtrl.text = row['passport_no'] ?? '';
          _carLicenseCtrl.text = row['car_license_no'] ?? '';
          _drivingLicenseCtrl.text = row['driving_license_no'] ?? '';
          _bankAccountCtrl.text = row['bank_account_no'] ?? '';
          _emailCtrl.text = row['email'] ?? '';
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'فشل تحميل البيانات الشخصية: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _saveData() async {
    if (!_formKey.currentState!.validate()) return;

    final data = {
      'name': _nameCtrl.text.trim(),
      'home_address': _homeAddrCtrl.text.trim(),
      'office_address': _officeAddrCtrl.text.trim(),
      'home_tel': _homeTelCtrl.text.trim(),
      'office_tel': _officeTelCtrl.text.trim(),
      'mobile': _mobileCtrl.text.trim(),
      'id_card_no': _idCardCtrl.text.trim(),
      'passport_no': _passportCtrl.text.trim(),
      'car_license_no': _carLicenseCtrl.text.trim(),
      'driving_license_no': _drivingLicenseCtrl.text.trim(),
      'bank_account_no': _bankAccountCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    try {
      if (_recordId != null) {
        await _dbHelper.update('personal_info', data, _recordId!);
      } else {
        final id = await _dbHelper.insert('personal_info', data);
        if (mounted) {
          setState(() => _recordId = id);
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم حفظ البيانات بنجاح')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل حفظ البيانات: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('البيانات الشخصية'),
        backgroundColor: AppColors.paperCream,
        foregroundColor: AppColors.accentRed,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.save), onPressed: _saveData),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 48,
                        color: AppColors.accentRed,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppColors.accentRed),
                        textAlign: TextAlign.center,
                      ),
                      TextButton(
                        onPressed: _loadData,
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                )
              : Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Header Image Style
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        decoration: const BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: AppColors.secondaryGold,
                              width: 2,
                            ),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.account_circle,
                              size: 60,
                              color: AppColors.primaryOlive,
                            ),
                            SizedBox(width: 16),
                            Text(
                              'الأجندة القضائية',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryOlive,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      _buildField(_nameCtrl, 'الاسم / Name'),
                      _buildField(_homeAddrCtrl, 'عنوان المنزل / Home Address'),
                      _buildField(
                        _officeAddrCtrl,
                        'عنوان المكتب / Office Address',
                      ),
                      const Divider(height: 32),
                      _buildField(
                        _homeTelCtrl,
                        'تليفون المنزل / Home Tel',
                        keyboardType: TextInputType.phone,
                      ),
                      _buildField(
                        _officeTelCtrl,
                        'تليفون المكتب / Office Tel',
                        keyboardType: TextInputType.phone,
                      ),
                      _buildField(
                        _mobileCtrl,
                        'رقم الموبايل / Mobile',
                        keyboardType: TextInputType.phone,
                      ),
                      const Divider(height: 32),
                      _buildField(_idCardCtrl, 'رقم البطاقة / ID Card No'),
                      _buildField(_passportCtrl, 'رقم جواز السفر / Passport No'),
                      _buildField(
                        _carLicenseCtrl,
                        'رقم رخصة السيارة / Car License No',
                      ),
                      _buildField(
                        _drivingLicenseCtrl,
                        'رقم رخصة القيادة / Driving License No',
                      ),
                      const Divider(height: 32),
                      _buildField(
                        _bankAccountCtrl,
                        'رقم حساب البنك / Bank Account No',
                      ),
                      _buildField(
                        _emailCtrl,
                        'البريد الإلكتروني / E-mail',
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          border: const UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.tableBorder),
          ),
          enabledBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.tableBorder),
          ),
          focusedBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.primaryOlive, width: 2),
          ),
          labelStyle: const TextStyle(color: AppColors.textDark, fontSize: 14),
        ),
      ),
    );
  }
}