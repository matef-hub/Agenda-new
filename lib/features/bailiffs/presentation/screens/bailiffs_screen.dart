import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/database/database_helper.dart';

/// شاشة أوراق المحضرين
///
/// توفر عمليات الإضافة والتعديل والحذف لعناصر جدول `bailiff_papers` مع:
/// - عرض فعلي لتاريخ التسليم (`delivery_date`) وتاريخ الجلسة (`hearing_date`).
/// - التحقق من الحقول الإلزامية (`reference_number`, `bailiffs_office`, `client_name`).
/// - نافذة تأكيد قبل الحذف.
/// - إخلاء جميع `TextEditingController` بعد إغلاق النافذة.
/// - معالجة حالات التحميل والفراغ والأخطاء دون فقدان مدخلات المستخدم.
class BailiffsScreen extends StatefulWidget {
  const BailiffsScreen({super.key});

  @override
  State<BailiffsScreen> createState() => _BailiffsScreenState();
}

class _BailiffsScreenState extends State<BailiffsScreen> {
  final _dbHelper = DatabaseHelper();
  List<Map<String, dynamic>> _papers = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
      final data = await _dbHelper.queryAll('bailiff_papers');
      if (mounted) {
        setState(() {
          _papers = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'فشل تحميل أوراق المحضرين: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _deletePaper(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: const Text('هل أنت متأكد من حذف ورقة المحضرين هذه؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text(
              'حذف',
              style: TextStyle(color: AppColors.accentRed),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _dbHelper.delete('bailiff_papers', id);
        await _loadData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('فشل حذف الورقة: $e')),
          );
        }
      }
    }
  }

  Widget _headerCell(String text, {required int flex}) {
    return Expanded(
      flex: flex,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: GoogleFonts.amiri(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: AppColors.primaryOlive,
        ),
      ),
    );
  }

  Future<void> _showAddEditDialog({Map<String, dynamic>? paper}) async {
    final formKey = GlobalKey<FormState>();
    final refCtrl = TextEditingController(text: paper?['reference_number']);
    final officeCtrl = TextEditingController(text: paper?['bailiffs_office']);
    final clientCtrl = TextEditingController(text: paper?['client_name']);
    final delDateCtrl = TextEditingController(text: paper?['delivery_date']);
    final hearDateCtrl = TextEditingController(text: paper?['hearing_date']);
    final statusCtrl = TextEditingController(text: paper?['status']);
    final notesCtrl = TextEditingController(text: paper?['notes']);

    try {
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(paper == null ? 'إضافة ورقة محضرين' : 'تعديل ورقة'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: refCtrl,
                    decoration: const InputDecoration(labelText: 'الرقم'),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'هذا الحقل مطلوب' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: officeCtrl,
                    decoration: const InputDecoration(labelText: 'قلم المحضرين'),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'هذا الحقل مطلوب' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: clientCtrl,
                    decoration: const InputDecoration(labelText: 'اسم الموكل'),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'هذا الحقل مطلوب' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: delDateCtrl,
                    decoration: const InputDecoration(labelText: 'تاريخ التسليم'),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: hearDateCtrl,
                    decoration: const InputDecoration(labelText: 'تاريخ الجلسة'),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: statusCtrl,
                    decoration: const InputDecoration(labelText: 'الحالة'),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(labelText: 'ملاحظات'),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;

                final data = {
                  'reference_number': refCtrl.text.trim(),
                  'bailiffs_office': officeCtrl.text.trim(),
                  'client_name': clientCtrl.text.trim(),
                  'delivery_date': delDateCtrl.text.trim(),
                  'hearing_date': hearDateCtrl.text.trim(),
                  'status': statusCtrl.text.trim(),
                  'notes': notesCtrl.text.trim(),
                  'created_at':
                      paper?['created_at'] ?? DateTime.now().toIso8601String(),
                };

                try {
                  if (paper == null) {
                    await _dbHelper.insert('bailiff_papers', data);
                  } else {
                    await _dbHelper.update(
                      'bailiff_papers',
                      data,
                      paper['id'] as int,
                    );
                  }
                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }
                  await _loadData();
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('فشل حفظ الورقة: $e')),
                    );
                  }
                }
              },
              child: const Text('حفظ'),
            ),
          ],
        ),
      );
    } finally {
      refCtrl.dispose();
      officeCtrl.dispose();
      clientCtrl.dispose();
      delDateCtrl.dispose();
      hearDateCtrl.dispose();
      statusCtrl.dispose();
      notesCtrl.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'أوراق المحضرين',
          style: GoogleFonts.amiri(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.paperCream,
        foregroundColor: AppColors.primaryOlive,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.secondaryGold),
        ),
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
              : _papers.isEmpty
                  ? const Center(
                      child: Text(
                        'لا توجد أوراق مسجلة',
                        style: TextStyle(color: AppColors.textLight),
                      ),
                    )
                  : Container(
                      margin: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border:
                            Border.all(color: AppColors.primaryOlive, width: 2),
                        color: Colors.white,
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: const BoxDecoration(
                              color: AppColors.tableHeaderGreen,
                              border: Border(
                                bottom: BorderSide(
                                  color: AppColors.primaryOlive,
                                  width: 2,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                _headerCell('الرقم / القلم', flex: 3),
                                _headerCell('الموكل', flex: 3),
                                _headerCell('التواريخ / الحالة', flex: 3),
                                _headerCell('حذف', flex: 1),
                              ],
                            ),
                          ),
                          Expanded(
                            child: ListView.separated(
                              itemCount: _papers.length,
                              separatorBuilder: (_, _) => const Divider(
                                height: 1,
                                thickness: 0.5,
                                color: AppColors.tableBorder,
                              ),
                              itemBuilder: (context, index) {
                                final p = _papers[index];
                                final deliveryDate =
                                    (p['delivery_date'] ?? '').toString().trim();
                                final hearingDate =
                                    (p['hearing_date'] ?? '').toString().trim();
                                final status =
                                    (p['status'] ?? '').toString().trim();

                                return InkWell(
                                  onTap: () => _showAddEditDialog(paper: p),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 10,
                                    ),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          flex: 3,
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                p['reference_number'] ?? '',
                                                style: GoogleFonts.amiri(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              Text(
                                                p['bailiffs_office'] ?? '',
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  color: AppColors.textLight,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          width: 0.5,
                                          height: 30,
                                          color: AppColors.tableBorder,
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 6,
                                            ),
                                            child: Text(
                                              p['client_name'] ?? '',
                                              style: const TextStyle(
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        ),
                                        Container(
                                          width: 0.5,
                                          height: 30,
                                          color: AppColors.tableBorder,
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 6,
                                            ),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'تسليم: ${deliveryDate.isEmpty ? '-' : deliveryDate}',
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                  ),
                                                ),
                                                Text(
                                                  'جلسة: ${hearingDate.isEmpty ? '-' : hearingDate}',
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    color: AppColors.accentRed,
                                                  ),
                                                ),
                                                if (status.isNotEmpty)
                                                  Text(
                                                    status,
                                                    style: const TextStyle(
                                                      fontSize: 9,
                                                      fontStyle:
                                                          FontStyle.italic,
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        Container(
                                          width: 0.5,
                                          height: 30,
                                          color: AppColors.tableBorder,
                                        ),
                                        Expanded(
                                          flex: 1,
                                          child: IconButton(
                                            icon: const Icon(
                                              Icons.delete_outline,
                                              color: AppColors.accentRed,
                                              size: 20,
                                            ),
                                            onPressed: () =>
                                                _deletePaper(p['id'] as int),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab_bailiffs',
        onPressed: () => _showAddEditDialog(),
        backgroundColor: AppColors.primaryOlive,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
