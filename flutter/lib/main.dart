import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'controllers/app_theme_controller.dart';
import 'models/worker_session.dart';
import 'screens/landing_screen.dart';
import 'screens/worker_registration_screen.dart';
import 'screens/worker_dashboard_screen.dart';
import 'screens/customer_registration_screen.dart';
import 'screens/customer_dashboard_screen.dart';
import 'screens/kyc_verification_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final hasSession = await WorkerSession.loadFromDisk();
  runApp(DigitalKaamApp(hasSession: hasSession));
}

class DigitalKaamApp extends StatelessWidget {
  final bool hasSession;
  const DigitalKaamApp({Key? key, this.hasSession = false}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AppThemeController.instance,
      builder: (context, _) {
        final theme = AppThemeController.instance;

        return MaterialApp(
          title: 'Digital Kaam - Kaam Aasan',
          debugShowCheckedModeBanner: false,
          themeMode: theme.isDarkMode ? ThemeMode.dark : ThemeMode.light,

          // ❄️ Frosty White Theme (Clean, High-Contrast, Daylight Friendly)
          theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.light,
            scaffoldBackgroundColor: const Color(0xFFF8FAFC),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.white,
              foregroundColor: Color(0xFF0F172A),
              elevation: 0,
            ),
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF0284C7),
              secondary: Color(0xFF059669),
              surface: Colors.white,
            ),
            textTheme: GoogleFonts.notoSansDevanagariTextTheme(
              ThemeData.light().textTheme,
            ),
          ),

          // 🌙 Midnight Dark Theme (Eye-Care Night Mode)
          darkTheme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.dark,
            scaffoldBackgroundColor: const Color(0xFF090D16),
            appBarTheme: const AppBarTheme(
              backgroundColor: Color(0xFF1E293B),
              foregroundColor: Colors.white,
              elevation: 0,
            ),
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF2563EB),
              secondary: Color(0xFF38BDF8),
              surface: Color(0xFF1E293B),
            ),
            textTheme: GoogleFonts.notoSansDevanagariTextTheme(
              ThemeData.dark().textTheme,
            ),
          ),

          home: hasSession && WorkerSession.isLoggedIn
              ? (WorkerSession.role == "CUSTOMER"
                  ? CustomerDashboardScreen(
                      customerName: WorkerSession.name,
                      customerPhone: WorkerSession.phone,
                      customerAddress: WorkerSession.address,
                      profilePhoto: WorkerSession.profilePhoto,
                      profilePhotoBytes: WorkerSession.profilePhotoBytes,
                    )
                  : WorkerDashboardScreen(
                      workerName: WorkerSession.name,
                      primarySkill: WorkerSession.primarySkill,
                      profilePhoto: WorkerSession.profilePhoto,
                      profilePhotoBytes: WorkerSession.profilePhotoBytes,
                    ))
              : const LandingScreen(),
          routes: {
            '/landing': (context) => const LandingScreen(),
            '/worker-register': (context) => const WorkerRegistrationScreen(),
            '/worker-dashboard': (context) => WorkerDashboardScreen(
                  workerName: WorkerSession.name,
                  primarySkill: WorkerSession.primarySkill,
                  profilePhoto: WorkerSession.profilePhoto,
                  profilePhotoBytes: WorkerSession.profilePhotoBytes,
                ),
            '/customer-register': (context) => const CustomerRegistrationScreen(),
            '/customer-dashboard': (context) => CustomerDashboardScreen(
                  customerName: WorkerSession.name,
                  customerPhone: WorkerSession.phone,
                  customerAddress: WorkerSession.address,
                  profilePhoto: WorkerSession.profilePhoto,
                  profilePhotoBytes: WorkerSession.profilePhotoBytes,
                ),
            '/standalone-kyc': (context) => const KycVerificationScreen(role: UserKycRole.worker),
          },
        );
      },
    );
  }
}
