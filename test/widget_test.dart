// Tests for the judicial agenda application.
//
// These tests verify the actual application features, navigation synchronization,
// form validation, CRUD workflows, and Hijri/Gregorian date conversion.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'package:agenda/main.dart';
import 'package:agenda/core/database/database_helper.dart';
import 'package:agenda/core/utils/date_utils.dart';
import 'package:agenda/features/daily_schedule/data/models/session_model.dart';
import 'package:agenda/features/daily_schedule/presentation/providers/session_provider.dart';

void main() {
  // Initialize sqflite_ffi for desktop/test environments.
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  // -------------------------------------------------------------------------
  // 1. MyApp launches successfully
  // -------------------------------------------------------------------------
  group('MyApp launch', () {
    testWidgets('MyApp renders without errors', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      expect(find.byType(BottomNavigationBar), findsOneWidget);
      expect(find.byType(PageView), findsOneWidget);
    });

    testWidgets('MyApp has correct title', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(app.title, 'الأجندة القضائية');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Five-section navigation and PageView synchronization
  // -------------------------------------------------------------------------
  group('Five-section navigation & PageView synchronization', () {
    testWidgets('renders Arabic UI elements on Daily Schedule',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      expect(find.text('اليومية'), findsOneWidget);
      expect(find.text('جدول الجلسات اليومية'), findsOneWidget);
      expect(find.text('هجري'), findsOneWidget);
      expect(find.text('ميلادي'), findsOneWidget);
    });

    testWidgets('navigation bar has all five tabs in Arabic and syncs with PageView',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      expect(find.text('اليومية'), findsOneWidget);
      expect(find.text('البيانات'), findsOneWidget);
      expect(find.text('التوكيلات'), findsOneWidget);
      expect(find.text('المحضرين'), findsOneWidget);
      expect(find.text('إدارية'), findsOneWidget);

      // 1. Navigate to Personal Data (البيانات)
      await tester.tap(find.text('البيانات'));
      await tester.pumpAndSettle();
      expect(find.text('البيانات الشخصية'), findsWidgets);
      expect(find.text('الاسم / Name'), findsOneWidget);
      // Verify payment-card field is not exposed
      expect(find.textContaining('Credit Card'), findsNothing);

      // 2. Navigate to Powers of Attorney (التوكيلات)
      await tester.tap(find.text('التوكيلات'));
      await tester.pumpAndSettle();
      expect(find.text('فهرس التوكيلات'), findsOneWidget);

      // 3. Navigate to Bailiffs (المحضرين)
      await tester.tap(find.text('المحضرين'));
      await tester.pumpAndSettle();
      expect(find.text('أوراق المحضرين'), findsOneWidget);

      // 4. Navigate to Administrative Work (إدارية)
      await tester.tap(find.text('إدارية'));
      await tester.pumpAndSettle();
      expect(find.text('الأعمال الإدارية'), findsOneWidget);
      expect(find.text('أعمال إدارية'), findsOneWidget);

      // 5. Return to Daily Schedule (اليومية)
      await tester.tap(find.text('اليومية'));
      await tester.pumpAndSettle();
      expect(find.text('جدول الجلسات اليومية'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Empty sessions are handled correctly
  // -------------------------------------------------------------------------
  group('Empty sessions', () {
    testWidgets('shows empty state message when no sessions exist for date',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(
              create: (_) =>
                  SessionProvider()..setSelectedDate(DateTime(2099, 1, 1)),
            ),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      expect(
        find.text('لا توجد جلسات مسجلة لهذا اليوم'),
        findsOneWidget,
      );
      expect(find.text('إضافة جلسة'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Date navigation updates the selected date
  // -------------------------------------------------------------------------
  group('Date navigation', () {
    testWidgets('forward arrow changes date', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      final provider =
          tester.element(find.byType(MaterialApp)).read<SessionProvider>();
      final initialDate = provider.selectedDate;

      final forwardButton = find.byIcon(Icons.arrow_back_ios);
      expect(forwardButton, findsOneWidget);
      await tester.tap(forwardButton);
      await tester.pumpAndSettle(const Duration(seconds: 3));

      final newDate = provider.selectedDate;
      expect(
        newDate.difference(initialDate).inDays,
        equals(1),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 5. Session model serialization/deserialization
  // -------------------------------------------------------------------------
  group('Session model', () {
    test('toMap produces correct keys', () {
      final session = Session(
        courtName: 'محكمة القاهرة',
        circuit: 'الدائرة 3 مدني',
        caseNumber: '1234',
        caseYear: 2026,
        clientName: 'أحمد محمود',
        clientCapacity: 'مدعي',
        opponentName: 'خالد إبراهيم',
        opponentCapacity: 'مدعى عليه',
        previousSession: 'تأجيل',
        decision: 'حجز للحكم',
        notes: 'ملاحظة تجريبية',
        sessionDate: DateTime(2026, 10, 22),
      );

      final map = session.toMap();

      expect(map['court_name'], 'محكمة القاهرة');
      expect(map['circuit'], 'الدائرة 3 مدني');
      expect(map['case_number'], '1234');
      expect(map['case_year'], 2026);
      expect(map['client_name'], 'أحمد محمود');
      expect(map['client_capacity'], 'مدعي');
      expect(map['opponent_name'], 'خالد إبراهيم');
      expect(map['opponent_capacity'], 'مدعى عليه');
      expect(map['previous_session'], 'تأجيل');
      expect(map['decision'], 'حجز للحكم');
      expect(map['notes'], 'ملاحظة تجريبية');
      expect(map['session_date'], isNotNull);
      expect(map['created_at'], isNotNull);
      expect(map['updated_at'], isNotNull);
    });

    test('fromMap reconstructs session correctly', () {
      final now = DateTime.now();
      final map = {
        'id': 42,
        'court_name': 'محكمة الجيزة',
        'circuit': 'الدائرة 1 جنائي',
        'case_number': '5678',
        'case_year': 2025,
        'client_name': 'سعيد حسن',
        'client_capacity': 'متهم',
        'opponent_name': 'النيابة العامة',
        'opponent_capacity': 'سلطة اتهام',
        'previous_session': '',
        'decision': '',
        'notes': '',
        'session_date': now.toIso8601String(),
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      };

      final session = Session.fromMap(map);

      expect(session.id, 42);
      expect(session.courtName, 'محكمة الجيزة');
      expect(session.caseYear, 2025);
      expect(session.clientCapacity, 'متهم');
    });

    test('round-trip serialization preserves all fields', () {
      final original = Session(
        id: 7,
        courtName: 'محكمة شمال القاهرة',
        circuit: 'الدائرة 12 أحوال',
        caseNumber: '999',
        caseYear: 2024,
        clientName: 'فاطمة علي',
        clientCapacity: 'مدعية',
        opponentName: 'محمد عبدالله',
        opponentCapacity: 'مدعى عليه',
        previousSession: 'تأجيل للمستندات',
        decision: 'حكم غيابي',
        notes: 'ملاحظة طويلة جداً تحتوي على نص عربي متعدد الأسطر',
        sessionDate: DateTime(2024, 5, 15),
        createdAt: DateTime(2024, 1, 1),
        updatedAt: DateTime(2024, 5, 15),
      );

      final map = original.toMap();
      final restored = Session.fromMap(map);

      expect(restored.id, original.id);
      expect(restored.courtName, original.courtName);
      expect(restored.circuit, original.circuit);
      expect(restored.caseNumber, original.caseNumber);
      expect(restored.caseYear, original.caseYear);
      expect(restored.clientName, original.clientName);
      expect(restored.clientCapacity, original.clientCapacity);
      expect(restored.opponentName, original.opponentName);
      expect(restored.opponentCapacity, original.opponentCapacity);
      expect(restored.previousSession, original.previousSession);
      expect(restored.decision, original.decision);
      expect(restored.notes, original.notes);
      expect(
        restored.sessionDate.toIso8601String(),
        original.sessionDate.toIso8601String(),
      );
    });

    test('copyWith preserves createdAt and updates updatedAt', () {
      final created = DateTime(2024, 1, 1, 10, 0, 0);
      final original = Session(
        id: 1,
        courtName: 'محكمة',
        circuit: 'دائرة',
        caseNumber: '1',
        caseYear: 2024,
        clientName: 'موكل',
        clientCapacity: 'مدعي',
        opponentName: 'خصم',
        opponentCapacity: 'مدعى عليه',
        previousSession: '',
        decision: '',
        notes: '',
        sessionDate: DateTime(2024, 5, 1),
        createdAt: created,
      );

      final modified = original.copyWith(courtName: 'محكمة أخرى');

      expect(modified.courtName, 'محكمة أخرى');
      expect(modified.createdAt, created);
      expect(
        modified.updatedAt.difference(DateTime.now()).inSeconds.abs(),
        lessThan(2),
      );
    });

    test('fromMap handles null optional fields gracefully', () {
      final map = {
        'id': 1,
        'court_name': 'محكمة',
        'circuit': 'دائرة',
        'case_number': '100',
        'case_year': 2026,
        'client_name': 'اسم',
        'client_capacity': null,
        'opponent_name': 'خصم',
        'opponent_capacity': null,
        'previous_session': null,
        'decision': null,
        'notes': null,
        'session_date': DateTime(2026, 1, 1).toIso8601String(),
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      final session = Session.fromMap(map);
      expect(session.clientCapacity, '');
      expect(session.decision, '');
      expect(session.notes, '');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Session persistence & preservation of existing records
  // -------------------------------------------------------------------------
  group('Session persistence & record preservation', () {
    test('session survives database round-trip and preserves existing records',
        () async {
      final db = await databaseFactoryFfi.openDatabase(
        inMemoryDatabasePath,
        options: OpenDatabaseOptions(
          version: 1,
          onCreate: (db, version) async {
            await db.execute('''
              CREATE TABLE sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                court_name TEXT NOT NULL,
                circuit TEXT NOT NULL,
                case_number TEXT NOT NULL,
                case_year INTEGER NOT NULL,
                client_name TEXT NOT NULL,
                client_capacity TEXT,
                opponent_name TEXT NOT NULL,
                opponent_capacity TEXT,
                previous_session TEXT,
                decision TEXT,
                notes TEXT,
                session_date TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
              )
            ''');
          },
        ),
      );

      final existingSession = Session(
        courtName: 'محكمة الإسكندرية',
        circuit: 'الدائرة 1 مدني',
        caseNumber: '101',
        caseYear: 2025,
        clientName: 'سجل موجود مسبقاً',
        clientCapacity: 'مدعي',
        opponentName: 'خصم أول',
        opponentCapacity: 'مدعى عليه',
        previousSession: '',
        decision: '',
        notes: '',
        sessionDate: DateTime(2026, 10, 22),
      );
      final existingMap = existingSession.toMap()..remove('id');
      final existingId = await db.insert('sessions', existingMap);

      final session = Session(
        courtName: 'محكمة القاهرة',
        circuit: 'الدائرة 5 مدني',
        caseNumber: '2024',
        caseYear: 2026,
        clientName: 'أحمد',
        clientCapacity: 'مدعي',
        opponentName: 'محمد',
        opponentCapacity: 'مدعى عليه',
        previousSession: '',
        decision: '',
        notes: '',
        sessionDate: DateTime(2026, 10, 22),
      );

      final map = session.toMap()..remove('id');
      final id = await db.insert('sessions', map);
      expect(id, greaterThan(existingId));

      // Verify both records exist
      final allRows = await db.query('sessions');
      expect(allRows.length, 2);

      // Update second session
      final restored = Session.fromMap(
        (await db.query('sessions', where: 'id = ?', whereArgs: [id])).first,
      );
      final updatedMap = restored.copyWith(decision: 'حكم').toMap();
      await db.update('sessions', updatedMap, where: 'id = ?', whereArgs: [id]);

      // Delete second session
      await db.delete('sessions', where: 'id = ?', whereArgs: [id]);

      // Verify pre-existing record is still intact
      final remaining = await db.query('sessions');
      expect(remaining.length, 1);
      expect(remaining.first['client_name'], 'سجل موجود مسبقاً');

      await db.close();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Bailiffs screen validation, date rendering, and delete confirmation
  // -------------------------------------------------------------------------
  group('Bailiffs screen', () {
    testWidgets(
        'validates required fields, renders delivery_date and hearing_date, and deletes with confirmation',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Bailiffs section
      await tester.tap(find.text('المحضرين'));
      await tester.pumpAndSettle();

      // Open Add Bailiff Paper dialog
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();
      expect(find.text('إضافة ورقة محضرين'), findsOneWidget);

      // Submit empty form -> should show validation errors
      await tester.tap(find.text('حفظ'));
      await tester.pumpAndSettle();
      expect(find.text('هذا الحقل مطلوب'), findsNWidgets(3));

      // Fill fields including delivery_date and hearing_date
      await tester.enterText(
        find.widgetWithText(TextFormField, 'الرقم'),
        'إعلان 9901',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'قلم المحضرين'),
        'محضري عابدين',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'اسم الموكل'),
        'مصطفى كامل',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'تاريخ التسليم'),
        '2026-10-15',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'تاريخ الجلسة'),
        '2026-11-01',
      );

      await tester.tap(find.text('حفظ'));
      await tester.pumpAndSettle();

      // Verify delivery_date and hearing_date are rendered in the table
      expect(find.text('إعلان 9901'), findsOneWidget);
      expect(find.text('تسليم: 2026-10-15'), findsOneWidget);
      expect(find.text('جلسة: 2026-11-01'), findsOneWidget);

      // Delete the added paper with confirmation
      await tester.tap(find.byIcon(Icons.delete_outline).last);
      await tester.pumpAndSettle();
      expect(find.text('تأكيد الحذف'), findsOneWidget);

      await tester.tap(find.text('حذف'));
      await tester.pumpAndSettle();
      expect(find.text('إعلان 9901'), findsNothing);
    });
  });

  // -------------------------------------------------------------------------
  // 8. Administrative work screen add, edit, completion toggle, and delete
  // -------------------------------------------------------------------------
  group('Administrative work screen', () {
    testWidgets(
        'supports add, edit preserving metadata, completion toggle, and confirmed delete',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Admin Work section
      await tester.tap(find.text('إدارية'));
      await tester.pumpAndSettle();

      // Open Add Note dialog
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();
      expect(find.text('عمل إداري جديد'), findsOneWidget);

      // Validate empty submit
      await tester.tap(find.text('حفظ'));
      await tester.pumpAndSettle();
      expect(find.text('هذا الحقل مطلوب'), findsWidgets);

      // Enter title and content
      await tester.enterText(
        find.widgetWithText(TextFormField, 'العنوان'),
        'استخراج شهادة جدول',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'التفاصيل'),
        'من المحكمة الإدارية العليا',
      );
      await tester.tap(find.text('حفظ'));
      await tester.pumpAndSettle();

      expect(find.text('استخراج شهادة جدول'), findsOneWidget);
      expect(find.text('من المحكمة الإدارية العليا'), findsOneWidget);

      // Toggle completion status
      await tester.tap(find.byIcon(Icons.radio_button_unchecked).last);
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.check_circle), findsWidgets);

      // Tap row to edit note and verify prepopulated fields + preserved completion
      await tester.tap(find.text('استخراج شهادة جدول'));
      await tester.pumpAndSettle();
      expect(find.text('تعديل عمل إداري'), findsOneWidget);

      await tester.enterText(
        find.widgetWithText(TextFormField, 'العنوان'),
        'استخراج شهادة جدول محدثة',
      );
      await tester.tap(find.text('حفظ'));
      await tester.pumpAndSettle();

      expect(find.text('استخراج شهادة جدول محدثة'), findsOneWidget);
      // Completion icon should still be checked
      expect(find.byIcon(Icons.check_circle), findsWidgets);

      // Delete note with confirmation
      await tester.tap(find.byIcon(Icons.delete_outline).last);
      await tester.pumpAndSettle();
      expect(find.text('تأكيد الحذف'), findsOneWidget);

      await tester.tap(find.text('حذف'));
      await tester.pumpAndSettle();
      expect(find.text('استخراج شهادة جدول محدثة'), findsNothing);
    });
  });

  // -------------------------------------------------------------------------
  // 9. Daily Schedule required fields validation
  // -------------------------------------------------------------------------
  group('Form validation', () {
    testWidgets('required fields show validation errors on Add Session screen',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => SessionProvider()),
          ],
          child: const MyApp(),
        ),
      );
      await tester.pumpAndSettle(const Duration(seconds: 3));

      final fab = find.byType(FloatingActionButton);
      await tester.tap(fab.first);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      expect(find.text('إضافة جلسة جديدة'), findsOneWidget);

      await tester.tap(find.text('حفظ الجلسة'));
      await tester.pumpAndSettle();

      expect(find.text('هذا الحقل مطلوب'), findsWidgets);
    });
  });

  // -------------------------------------------------------------------------
  // 10. Gregorian/Hijri formatting follows the documented convention
  // -------------------------------------------------------------------------
  group('Hijri conversion', () {
    test('known Gregorian dates convert to correct Hijri', () {
      final h1 = AppDateUtils.gregorianToHijri(DateTime(2023, 3, 23));
      expect(h1.month, 9);
      expect(h1.day, 1);
      expect(h1.year, 1444);

      final h2 = AppDateUtils.gregorianToHijri(DateTime(2024, 3, 11));
      expect(h2.month, 9);
      expect(h2.day, 1);
      expect(h2.year, 1445);

      final h3 = AppDateUtils.gregorianToHijri(DateTime(2025, 3, 1));
      expect(h3.month, 9);
      expect(h3.day, 1);
      expect(h3.year, 1446);
    });

    test('Hijri month names are in Arabic', () {
      expect(AppDateUtils.hijriMonthNames[0], 'محرم');
      expect(AppDateUtils.hijriMonthNames[8], 'رمضان');
      expect(AppDateUtils.hijriMonthNames[11], 'ذو الحجة');
      expect(AppDateUtils.hijriMonthNames.length, 12);
    });

    test('round-trip conversion preserves date', () {
      final greg = AppDateUtils.hijriToGregorian(1448, 1, 1);
      final hijri = AppDateUtils.gregorianToHijri(greg);
      expect(hijri.year, 1448);
      expect(hijri.month, 1);
      expect(hijri.day, 1);
    });

    test('Hijri leap year detection is correct', () {
      expect(AppDateUtils.isHijriLeapYear(2), isTrue);
      expect(AppDateUtils.isHijriLeapYear(1442), isTrue);
      expect(AppDateUtils.isHijriLeapYear(1), isFalse);
      expect(AppDateUtils.isHijriLeapYear(1441), isFalse);
    });

    test('Hijri month lengths follow documented convention', () {
      expect(AppDateUtils.hijriMonthLength(1448, 1), 30);
      expect(AppDateUtils.hijriMonthLength(1448, 3), 30);
      expect(AppDateUtils.hijriMonthLength(1448, 2), 29);
      expect(AppDateUtils.hijriMonthLength(1448, 4), 29);
      expect(AppDateUtils.hijriMonthLength(1448, 12), 29);
      expect(AppDateUtils.hijriMonthLength(1442, 12), 30);
    });

    test('month boundaries are handled correctly', () {
      final lastMuharram = AppDateUtils.hijriToGregorian(1448, 1, 30);
      final nextDay = lastMuharram.add(const Duration(days: 1));
      final hijriNext = AppDateUtils.gregorianToHijri(nextDay);
      expect(hijriNext.month, 2);
      expect(hijriNext.day, 1);
    });

    test('year boundary is handled correctly', () {
      expect(AppDateUtils.isHijriLeapYear(1447), isTrue);
      final lastDhulHijjah = AppDateUtils.hijriToGregorian(1447, 12, 30);
      final nextDay = lastDhulHijjah.add(const Duration(days: 1));
      final hijriNext = AppDateUtils.gregorianToHijri(nextDay);
      expect(hijriNext.year, 1448);
      expect(hijriNext.month, 1);
      expect(hijriNext.day, 1);
    });

    test('getHijriDay/Month/Year return non-placeholder strings', () {
      final date = DateTime(2026, 10, 22);
      expect(AppDateUtils.getHijriDay(date), isNot('--'));
      expect(AppDateUtils.getHijriMonth(date), isNot('--'));
      expect(AppDateUtils.getHijriYear(date), isNot('--'));

      final hijriYear = int.parse(AppDateUtils.getHijriYear(date));
      expect(hijriYear, lessThan(1500));
      expect(hijriYear, greaterThan(1400));
    });

    test('invalid month throws ArgumentError', () {
      expect(
        () => AppDateUtils.hijriMonthLength(1448, 0),
        throwsArgumentError,
      );
      expect(
        () => AppDateUtils.hijriMonthLength(1448, 13),
        throwsArgumentError,
      );
    });
  });
}
