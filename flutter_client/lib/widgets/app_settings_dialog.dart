import 'package:flutter/material.dart';
import '../controllers/app_theme_controller.dart';

class AppSettingsDialog extends StatefulWidget {
  const AppSettingsDialog({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AppSettingsDialog(),
    );
  }

  @override
  State<AppSettingsDialog> createState() => _AppSettingsDialogState();
}

class _AppSettingsDialogState extends State<AppSettingsDialog> {
  final AppThemeController _theme = AppThemeController.instance;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _theme,
      builder: (context, _) {
        final bool isDark = _theme.isDarkMode;

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: _theme.cardModal,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(top: BorderSide(color: _theme.brandBlue, width: 2)),
            boxShadow: _theme.elevatedShadow,
          ),
          child: Column(
            children: [
              // Top Handle Bar
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 6),
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _theme.brandBlue.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.settings_suggest_rounded, color: _theme.brandBlue, size: 22),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "ऐप सेटिंग्स (App Settings)",
                              style: TextStyle(color: _theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              "थीम, भाषा व अलर्ट कस्टमाइज़ करें",
                              style: TextStyle(color: _theme.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded, color: _theme.textSecondary),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              Divider(color: _theme.border, height: 1),

              // Content List
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. THEME MODE TOGGLE
                      _buildSectionLabel("1. थीम चयन (Appearance Theme)"),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          // Frosty White Card
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _theme.setThemeMode(false),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: !isDark ? const Color(0xFFF0FDF4) : _theme.cardSub,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: !isDark ? const Color(0xFF10B981) : _theme.border,
                                    width: !isDark ? 2 : 1,
                                  ),
                                  boxShadow: !isDark ? _theme.cardShadow : null,
                                ),
                                child: Column(
                                  children: [
                                    const Text("❄️", style: TextStyle(fontSize: 28)),
                                    const SizedBox(height: 6),
                                    Text(
                                      "फ्रॉस्टी व्हाइट",
                                      style: TextStyle(
                                        color: !isDark ? const Color(0xFF0F172A) : _theme.textPrimary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "धूप में साफ (Frosty)",
                                      style: TextStyle(
                                        color: !isDark ? const Color(0xFF059669) : _theme.textSecondary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    if (!isDark) ...[
                                      const SizedBox(height: 6),
                                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),

                          // Midnight Dark Card
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _theme.setThemeMode(true),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1E293B) : _theme.cardSub,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF38BDF8) : _theme.border,
                                    width: isDark ? 2 : 1,
                                  ),
                                  boxShadow: isDark ? _theme.cardShadow : null,
                                ),
                                child: Column(
                                  children: [
                                    const Text("🌙", style: TextStyle(fontSize: 28)),
                                    const SizedBox(height: 6),
                                    Text(
                                      "मिडनाइट डार्क",
                                      style: TextStyle(
                                        color: isDark ? Colors.white : _theme.textPrimary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "आंखों को आराम (Dark)",
                                      style: TextStyle(
                                        color: isDark ? const Color(0xFF38BDF8) : _theme.textSecondary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    if (isDark) ...[
                                      const SizedBox(height: 6),
                                      const Icon(Icons.check_circle_rounded, color: Color(0xFF38BDF8), size: 16),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),

                      // 2. LANGUAGE SELECTION
                      _buildSectionLabel("2. ऐप की भाषा (Language)"),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _theme.cardSub,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _theme.border),
                        ),
                        child: Row(
                          children: [
                            _buildLanguageChip("hi", "🇮🇳 हिन्दी"),
                            const SizedBox(width: 8),
                            _buildLanguageChip("hinglish", "हिंग्लिश"),
                            const SizedBox(width: 8),
                            _buildLanguageChip("en", "English"),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),

                      // 3. SOUND & ALERTS
                      _buildSectionLabel("3. सूचनाएं व ध्वनि (Alerts & Sound)"),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: _theme.cardSub,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _theme.border),
                        ),
                        child: Column(
                          children: [
                            SwitchListTile(
                              contentPadding: EdgeInsets.zero,
                              value: _theme.soundAlerts,
                              onChanged: _theme.toggleSoundAlerts,
                              title: Text("नया काम व बुकिंग साउंड अलर्ट", style: TextStyle(color: _theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                              subtitle: Text("नया काम मिलने पर लाउड सायरन / घंटी बजेगी", style: TextStyle(color: _theme.textSecondary, fontSize: 11)),
                              activeThumbColor: _theme.brandBlue,
                            ),
                            Divider(color: _theme.border, height: 1),
                            SwitchListTile(
                              contentPadding: EdgeInsets.zero,
                              value: _theme.hapticFeedback,
                              onChanged: _theme.toggleHaptic,
                              title: Text("मोबाइल कंपन (Haptic Vibration)", style: TextStyle(color: _theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                              subtitle: Text("बटन दबाने व अलर्ट पर हल्का कंपन", style: TextStyle(color: _theme.textSecondary, fontSize: 11)),
                              activeThumbColor: _theme.brandBlue,
                            ),
                            Divider(color: _theme.border, height: 1),
                            SwitchListTile(
                              contentPadding: EdgeInsets.zero,
                              value: _theme.highPrecisionGps,
                              onChanged: _theme.toggleHighPrecisionGps,
                              title: Text("Google S2 5km रडार प्रेसिजन", style: TextStyle(color: _theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                              subtitle: Text("नज़दीकी कारीगरों के लिए 64-bit सेल एक्यूरेसी", style: TextStyle(color: _theme.textSecondary, fontSize: 11)),
                              activeThumbColor: _theme.brandBlue,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),

                      // 4. SECURITY & PRIVACY BADGE
                      _buildSectionLabel("4. सुरक्षा व प्राइवेसी स्थिति (Security)"),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: _theme.emeraldGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _theme.emeraldGreen.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.shield_rounded, color: _theme.emeraldGreen, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("100% आधार व बायोमेट्रिक सुरक्षित", style: TextStyle(color: _theme.emeraldGreen, fontWeight: FontWeight.bold, fontSize: 13)),
                                  const SizedBox(height: 2),
                                  Text(
                                    "आपका डेटा AES-256 बिट सुरक्षित है। फोन नंबर केवल मास्क्ड कॉल द्वारा जुड़ता है।",
                                    style: TextStyle(color: _theme.textSecondary, fontSize: 11, height: 1.3),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),

                      // 5. HELP & SUPPORT
                      _buildSectionLabel("5. सहायता व संपर्क (24x7 Support)"),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text("हेल्पलाइन डायल की जा रही है: 1800-120-KAAM (Toll-Free)")),
                                );
                              },
                              icon: const Icon(Icons.call_rounded, size: 16),
                              label: const Text("हेल्पलाइन कॉल", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _theme.brandBlue,
                                side: BorderSide(color: _theme.brandBlue),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text("व्हाट्सएप सहायता चैट खोली जा रही है...")),
                                );
                              },
                              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                              label: const Text("व्हाट्सएप सपोर्ट", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // App Version Info
                      Center(
                        child: Text(
                          "Digital Kaam • वर्जन 1.0.0 (Frosty Pro Build)",
                          style: TextStyle(color: _theme.textMuted, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: TextStyle(
        color: _theme.textPrimary,
        fontSize: 13,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.2,
      ),
    );
  }

  Widget _buildLanguageChip(String code, String label) {
    final bool isSelected = _theme.currentLanguage == code;
    return Expanded(
      child: GestureDetector(
        onTap: () => _theme.setLanguage(code),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? _theme.brandBlue : _theme.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? _theme.brandBlue : _theme.border,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : _theme.textPrimary,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
