import 'package:flutter_test/flutter_test.dart';
import 'package:digital_kaam_flutter/main.dart';

void main() {
  testWidgets('Digital Kaam app loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const DigitalKaamApp());
    expect(find.byType(DigitalKaamApp), findsOneWidget);
  });
}
