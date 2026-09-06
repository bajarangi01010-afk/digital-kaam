import 'package:flutter/material.dart';

/// Global Theme & Settings Controller (Lightweight, Reactive, Zero-Dependency)
class AppThemeController extends ChangeNotifier {
  static final AppThemeController _instance = AppThemeController._internal();
  static AppThemeController get instance => _instance;

  AppThemeController._internal();

  // Settings State
  bool _isDarkMode = false; // Default: Frosty White (Light mode)
  String _currentLanguage = "hi"; // "hi" (Hindi), "en" (English), "hinglish" (Hinglish)
  bool _soundAlerts = true;
  bool _hapticFeedback = true;
  bool _highPrecisionGps = true;

  // Getters
  bool get isDarkMode => _isDarkMode;
  String get currentLanguage => _currentLanguage;
  bool get soundAlerts => _soundAlerts;
  bool get hapticFeedback => _hapticFeedback;
  bool get highPrecisionGps => _highPrecisionGps;

  // Actions
  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  void setThemeMode(bool dark) {
    if (_isDarkMode != dark) {
      _isDarkMode = dark;
      notifyListeners();
    }
  }

  void setLanguage(String lang) {
    _currentLanguage = lang;
    notifyListeners();
  }

  void toggleSoundAlerts(bool val) {
    _soundAlerts = val;
    notifyListeners();
  }

  void toggleHaptic(bool val) {
    _hapticFeedback = val;
    notifyListeners();
  }

  void toggleHighPrecisionGps(bool val) {
    _highPrecisionGps = val;
    notifyListeners();
  }

  // ──────────────────────────────────────────────────────────
  //  CSS-INSPIRED PROFESSIONAL DESIGN TOKENS
  // ──────────────────────────────────────────────────────────

  // Backgrounds
  Color get bg => _isDarkMode ? const Color(0xFF090D16) : const Color(0xFFF8FAFC);
  Color get card => _isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFFFFFFF);
  Color get cardSub => _isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9);
  Color get cardModal => _isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF);

  // Borders
  Color get border => _isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
  Color get borderSubtle => _isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFCBD5E1);

  // Typography
  Color get textPrimary => _isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
  Color get textSecondary => _isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
  Color get textMuted => _isDarkMode ? const Color(0xFF64748B) : const Color(0xFF94A3B8);

  // Brand Accents
  Color get brandBlue => _isDarkMode ? const Color(0xFF38BDF8) : const Color(0xFF0284C7);
  Color get brandBlueDark => const Color(0xFF2563EB);
  Color get emeraldGreen => _isDarkMode ? const Color(0xFF10B981) : const Color(0xFF059669);
  Color get emeraldLight => _isDarkMode ? const Color(0xFF065F46) : const Color(0xFFD1FAE5);
  Color get amberGold => _isDarkMode ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
  Color get amberLight => _isDarkMode ? const Color(0xFF78350F) : const Color(0xFFFEF3C7);
  Color get roseRed => _isDarkMode ? const Color(0xFFF87171) : const Color(0xFFDC2626);

  // App Bar & Navigation
  Color get appBarBg => _isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFFFFFFF);
  Color get appBarText => _isDarkMode ? Colors.white : const Color(0xFF0F172A);
  Color get bottomNavBg => _isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF);
  Color get bottomNavBorder => _isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);

  // CSS-like Card BoxShadows
  List<BoxShadow> get cardShadow => _isDarkMode
      ? [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ]
      : [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.03),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ];

  List<BoxShadow> get elevatedShadow => _isDarkMode
      ? [
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ]
      : [
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.15),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ];
}
