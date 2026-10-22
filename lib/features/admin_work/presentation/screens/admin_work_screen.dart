import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/database/database_helper.dart';
import '../../../../core/utils/date_utils.dart';

/// شاشة الأعمال الإدارية
///
/// تدعم إضافة وتعديل وحذف المهام الإدارية وتبديل حالة الإنجاز مع:
/// - نافذة موحدة للإضافة والتعديل تحافظ على `is_completed` و`note_date` و`created_at`.
/// - التحقق من المدخلات برسائل خطأ عربية واضحة.
/// - الحذف مع نافذة تأكيد.
/// - إخلاء جميع `TextEditingController` بشكل آمن.
class AdminWorkScreen extends StatefulWidget {
  const AdminWorkScreen({super.key});

  @override
  State<AdminWorkScreen> createState() => _AdminWorkScreenState();
}

class _AdminWorkScreenState extends State<AdminWorkScreen> {
  final _dbHelper = DatabaseHelper();
  List<Map<String, dynamic>> _notes = [];
  bool _isLoading = true;
  String? _errorMessage;
  final DateTime _selectedDate = DateTime.now();

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
      final data = await _dbHelper.queryAll('admin_notes');
      if (mounted) {
        setState(() {
          _notes = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'فشل تحميل الأعمال الإدارية: $e';
          _isLoading = false;
        });
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

  Future<void> _toggleCompletion(Map<String, dynamic> note) async {
    final isCompleted = (note['is_completed'] as int?) == 1;
    try {
      final updatedData = {
        'title': note['title'],
        'content': note['content'],
        'is_completed': isCompleted ? 0 : 1,
        'note_date': note['note_date'],
        'created_at': note['created_at'],
      };
      await _dbHelper.update('admin_notes', updatedData, note['id'] as int);
      await _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل تحديث الحالة: $e')),
        );
      }
    }
  }

  Future<void> _deleteNote(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: const Text('هل أنت متأكد من حذف هذا العمل الإداري؟'),
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
        await _dbHelper.delete('admin_notes', id);
        await _loadData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('فشل حذف العمل الإداري: $e')),
          );
        }
      }
    }
  }

  Future<void> _showAddEditNoteDialog({Map<String, dynamic>? note}) async {
    final formKey = GlobalKey<FormState>();
    final titleCtrl = TextEditingController(text: note?['title']);
    final contentCtrl = TextEditingController(text: note?['content']);

    try {
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(note == null ? 'عمل إداري جديد' : 'تعديل عمل إداري'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(labelText: 'العنوان'),
                    validator: (v) {
                      if ((v == null || v.trim().isEmpty) &&
                          contentCtrl.text.trim().isEmpty) {
                        return 'هذا الحقل مطلوب';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: contentCtrl,
                    decoration: const InputDecoration(labelText: 'التفاصيل'),
                    maxLines: 3,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return 'هذا الحقل مطلوب';
                      }
                      return null;
                    },
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
                  'title': titleCtrl.text.trim(),
                  'content': contentCtrl.text.trim(),
                  'is_completed': note?['is_completed'] ?? 0,
                  'note_date':
                      note?['note_date'] ?? _selectedDate.toIso8601String(),
                  'created_at':
                      note?['created_at'] ?? DateTime.now().toIso8601String(),
                };

                try {
                  if (note == null) {
                    await _dbHelper.insert('admin_notes', data);
                  } else {
                    await _dbHelper.update(
                      'admin_notes',
                      data,
                      note['id'] as int,
                    );
                  }
                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }
                  await _loadData();
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('فشل حفظ العمل الإداري: $e')),
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
      titleCtrl.dispose();
      contentCtrl.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header similar to Daily Schedule
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: AppColors.paperCream,
                border: Border(
                  bottom: BorderSide(color: AppColors.secondaryGold, width: 2),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppDateUtils.getHijriDay(_selectedDate),
                    style: GoogleFonts.amiri(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryOlive,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    'أعمال إدارية',
                    style: GoogleFonts.amiri(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    AppDateUtils.getGregorianDay(_selectedDate),
                    style: GoogleFonts.amiri(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryOlive,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _isLoading
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
                                style: const TextStyle(
                                  color: AppColors.accentRed,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              TextButton(
                                onPressed: _loadData,
                                child: const Text('إعادة المحاولة'),
                              ),
                            ],
                          ),
                        )
                      : _notes.isEmpty
                          ? const Center(
                              child: Text(
                                'لا توجد أعمال مسجلة',
                                style: TextStyle(color: AppColors.textLight),
                              ),
                            )
                          : Container(
                              margin: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppColors.primaryOlive,
                                  width: 2,
                                ),
                                color: Colors.white,
                              ),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 8,
                                    ),
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
                                        _headerCell(
                                          'العنوان / التفاصيل',
                                          flex: 5,
                                        ),
                                        _headerCell('الحالة', flex: 1),
                                        _headerCell('حذف', flex: 1),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: ListView.separated(
                                      itemCount: _notes.length,
                                      separatorBuilder: (_, _) => const Divider(
                                        height: 1,
                                        thickness: 0.5,
                                        color: AppColors.tableBorder,
                                      ),
                                      itemBuilder: (context, index) {
                                        final note = _notes[index];
                                        final isCompleted =
                                            (note['is_completed'] as int?) == 1;
                                        final titleText =
                                            (note['title'] ?? '').toString().trim();
                                        return InkWell(
                                          onTap: () =>
                                              _showAddEditNoteDialog(note: note),
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
                                                  flex: 5,
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        titleText.isEmpty
                                                            ? 'بدون عنوان'
                                                            : titleText,
                                                        style: GoogleFonts.amiri(
                                                          fontSize: 14,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                          decoration: isCompleted
                                                              ? TextDecoration
                                                                  .lineThrough
                                                              : null,
                                                          color: isCompleted
                                                              ? AppColors
                                                                  .textLight
                                                              : AppColors
                                                                  .textDark,
                                                        ),
                                                      ),
                                                      if ((note['content'] ?? '')
                                                          .toString()
                                                          .isNotEmpty)
                                                        Text(
                                                          note['content'],
                                                          maxLines: 2,
                                                          overflow: TextOverflow
                                                              .ellipsis,
                                                          style: TextStyle(
                                                            fontSize: 11,
                                                            color: isCompleted
                                                                ? AppColors
                                                                    .textLight
                                                                : AppColors
                                                                    .textDark,
                                                            decoration:
                                                                isCompleted
                                                                    ? TextDecoration
                                                                        .lineThrough
                                                                    : null,
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
                                                  flex: 1,
                                                  child: IconButton(
                                                    icon: Icon(
                                                      isCompleted
                                                          ? Icons.check_circle
                                                          : Icons
                                                              .radio_button_unchecked,
                                                      color: isCompleted
                                                          ? AppColors.primaryOlive
                                                          : AppColors.tableBorder,
                                                      size: 22,
                                                    ),
                                                    onPressed: () =>
                                                        _toggleCompletion(note),
                                                    padding: EdgeInsets.zero,
                                                    constraints:
                                                        const BoxConstraints(),
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
                                                    onPressed: () => _deleteNote(
                                                      note['id'] as int,
                                                    ),
                                                    padding: EdgeInsets.zero,
                                                    constraints:
                                                        const BoxConstraints(),
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
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab_admin',
        onPressed: () => _showAddEditNoteDialog(),
        backgroundColor: AppColors.primaryOlive,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}