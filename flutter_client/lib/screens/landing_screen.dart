import 'package:flutter/material.dart';
import 'worker_registration_screen.dart';
import 'customer_registration_screen.dart';
import '../controllers/app_theme_controller.dart';
import '../widgets/app_settings_dialog.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.97, end: 1.03).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AppThemeController.instance,
      builder: (context, _) {
        final theme = AppThemeController.instance;
        final bool isHindi = theme.currentLanguage != 'en';

        return Scaffold(
          backgroundColor: theme.bg,
          body: SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight - 36),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // 1. Top Bar: Trust Status & Actions (Settings + Lang)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                decoration: BoxDecoration(
                                  color: theme.cardSub,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: theme.border),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: theme.emeraldGreen,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      isHindi ? 'सत्यापित नेटवर्क' : 'Verified Network',
                                      style: TextStyle(
                                        color: theme.textSecondary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  // Theme & Settings Dialog Button
                                  IconButton(
                                    icon: Icon(Icons.settings_suggest_rounded, color: theme.brandBlue, size: 22),
                                    tooltip: 'सेटिंग्स (Settings)',
                                    onPressed: () => AppSettingsDialog.show(context),
                                  ),
                                  const SizedBox(width: 4),
                                  // Quick Language Toggle
                                  InkWell(
                                    onTap: () {
                                      theme.setLanguage(isHindi ? 'en' : 'hi');
                                    },
                                    borderRadius: BorderRadius.circular(20),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                      decoration: BoxDecoration(
                                        color: theme.cardSub,
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: theme.border),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(Icons.language, color: theme.brandBlue, size: 15),
                                          const SizedBox(width: 6),
                                          Text(
                                            isHindi ? 'English' : 'हिंदी',
                                            style: TextStyle(
                                              color: theme.textPrimary,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),

                          const SizedBox(height: 28),

                          // 2. Animated Brand Logo Box
                          ScaleTransition(
                            scale: _scaleAnimation,
                            child: Container(
                              width: 88,
                              height: 88,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF2563EB), Color(0xFF0284C7)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: theme.elevatedShadow,
                              ),
                              child: const Center(
                                child: Text(
                                  'DK',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 34,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -1,
                                  ),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 20),

                          // 3. Title & Punchy Tagline
                          Text(
                            isHindi ? 'डिजिटल काम' : 'Digital Kaam',
                            style: TextStyle(
                              color: theme.textPrimary,
                              fontSize: 30,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.3,
                            ),
                          ),

                          const SizedBox(height: 6),

                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                            decoration: BoxDecoration(
                              color: theme.brandBlue.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              isHindi ? 'काम आसान • सुरक्षित भुगतान' : 'Work Made Easy • Safe Payments',
                              style: TextStyle(
                                color: theme.brandBlue,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Crisp 1-line mission
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              isHindi
                                  ? 'कारीगर और ग्राहक का सीधा, पारदर्शी और भरोसेमंद मंच'
                                  : 'Direct, transparent and trusted connection for local services',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: theme.textSecondary,
                                fontSize: 13,
                                height: 1.4,
                              ),
                            ),
                          ),

                          const SizedBox(height: 22),

                          // 4. Feature Trust Badges (Spacious Pills)
                          Wrap(
                            alignment: WrapAlignment.center,
                            spacing: 10,
                            runSpacing: 10,
                            children: [
                              _buildPill(theme, Icons.verified_user, isHindi ? 'आधार KYC' : 'Aadhaar KYC'),
                              _buildPill(theme, Icons.security_rounded, isHindi ? 'एस्क्रो सुरक्षा' : 'Escrow Safe'),
                              _buildPill(theme, Icons.lock_clock_rounded, isHindi ? 'Dual-OTP' : 'Dual-OTP'),
                            ],
                          ),

                          const Spacer(),
                          const SizedBox(height: 28),

                          // 5. Role Selection Section (Airy, Uncongested Cards)
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Padding(
                              padding: const EdgeInsets.only(left: 4, bottom: 12),
                              child: Text(
                                isHindi ? 'आगे बढ़ने के लिए चुनें:' : 'Choose your role:',
                                style: TextStyle(
                                  color: theme.textMuted,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),

                          // Role 1: Worker Card
                          InkWell(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (ctx) => const WorkerRegistrationScreen()),
                              );
                            },
                            borderRadius: BorderRadius.circular(18),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF1D4ED8), Color(0xFF2563EB)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(18),
                                boxShadow: theme.elevatedShadow,
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(Icons.handyman_rounded, color: Colors.white, size: 26),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          isHindi ? 'कारीगर (Worker)' : 'Worker',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 17,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          isHindi ? 'काम पाएं और सीधे पैसे कमाएं' : 'Find jobs & earn safely',
                                          style: TextStyle(
                                            color: Colors.white.withValues(alpha: 0.85),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 18),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          // Role 2: Customer Card
                          InkWell(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (ctx) => const CustomerRegistrationScreen()),
                              );
                            },
                            borderRadius: BorderRadius.circular(18),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                              decoration: BoxDecoration(
                                color: theme.card,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: theme.border, width: 1.5),
                                boxShadow: theme.cardShadow,
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: theme.brandBlue.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Icon(Icons.person_pin_circle_rounded, color: theme.brandBlue, size: 26),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          isHindi ? 'ग्राहक (Customer)' : 'Customer',
                                          style: TextStyle(
                                            color: theme.textPrimary,
                                            fontSize: 17,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          isHindi ? 'पास के सत्यापित कारीगर खोजें' : 'Find verified local workers',
                                          style: TextStyle(
                                            color: theme.textSecondary,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(Icons.arrow_forward_ios_rounded, color: theme.textMuted, size: 18),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildPill(AppThemeController theme, IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: theme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.border),
        boxShadow: theme.cardShadow,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: theme.brandBlue, size: 14),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: theme.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
