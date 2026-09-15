import 'package:flutter/material.dart';
import 'worker_registration_screen.dart';
import 'customer_registration_screen.dart';
import 'worker_dashboard_screen.dart';
import 'customer_dashboard_screen.dart';
import '../models/worker_session.dart';
import '../controllers/app_theme_controller.dart';

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
                                  // Quick Language Toggle (Cycles: hi -> hinglish -> en -> hi)
                                  InkWell(
                                    onTap: () {
                                      final next = theme.currentLanguage == 'hi'
                                          ? 'hinglish'
                                          : (theme.currentLanguage == 'hinglish' ? 'en' : 'hi');
                                      theme.setLanguage(next);
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
                                          Icon(Icons.language_rounded, color: theme.brandBlue, size: 16),
                                          const SizedBox(width: 6),
                                          Text(
                                            theme.currentLanguage == 'hi'
                                                ? 'हिन्दी'
                                                : (theme.currentLanguage == 'hinglish' ? 'Hinglish' : 'English'),
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
                          const SizedBox(height: 20),

                          // Active Persistent Session Banner (Auto-Resume)
                          if (WorkerSession.isLoggedIn) ...[
                            Container(
                              width: double.infinity,
                              margin: const EdgeInsets.only(bottom: 18),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.6), width: 1.5),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                    blurRadius: 14,
                                    offset: const Offset(0, 4),
                                  )
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF10B981),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            isHindi ? "सक्रिय खाता उपलब्ध ✓" : "Active Account ✓",
                                            style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          WorkerSession.role == "WORKER" ? (isHindi ? "कारीगर" : "Worker") : (isHindi ? "ग्राहक" : "Customer"),
                                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    "${WorkerSession.name}",
                                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    isHindi
                                        ? "आपका खाता पहले से सत्यापित है। दोबारा पंजीकरण की जरूरत नहीं है।"
                                        : "Your account is already verified. No need to register again.",
                                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () {
                                            if (WorkerSession.role == "CUSTOMER") {
                                              Navigator.of(context).pushAndRemoveUntil(
                                                MaterialPageRoute(
                                                  builder: (_) => CustomerDashboardScreen(
                                                    customerName: WorkerSession.name,
                                                    customerPhone: WorkerSession.phone,
                                                    customerAddress: WorkerSession.address,
                                                    profilePhoto: WorkerSession.profilePhoto,
                                                    profilePhotoBytes: WorkerSession.profilePhotoBytes,
                                                  ),
                                                ),
                                                (route) => false,
                                              );
                                            } else {
                                              Navigator.of(context).pushAndRemoveUntil(
                                                MaterialPageRoute(
                                                  builder: (_) => WorkerDashboardScreen(
                                                    workerName: WorkerSession.name,
                                                    primarySkill: WorkerSession.primarySkill,
                                                    profilePhoto: WorkerSession.profilePhoto,
                                                    profilePhotoBytes: WorkerSession.profilePhotoBytes,
                                                  ),
                                                ),
                                                (route) => false,
                                              );
                                            }
                                          },
                                          icon: const Icon(Icons.dashboard_rounded, size: 16),
                                          label: Text(
                                            isHindi ? "सीधे डैशबोर्ड खोलें" : "Open Dashboard",
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                          ),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF2563EB),
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        onPressed: () async {
                                          await WorkerSession.clearSession();
                                          setState(() {});
                                        },
                                        child: Text(
                                          isHindi ? "खाता बदलें" : "Switch",
                                          style: const TextStyle(fontSize: 12, color: Color(0xFFF87171)),
                                        ),
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Color(0xFFEF4444)),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],

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
                              if (WorkerSession.isLoggedIn && WorkerSession.role == "WORKER") {
                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute(
                                    builder: (_) => WorkerDashboardScreen(
                                      workerName: WorkerSession.name,
                                      primarySkill: WorkerSession.primarySkill,
                                      profilePhoto: WorkerSession.profilePhoto,
                                      profilePhotoBytes: WorkerSession.profilePhotoBytes,
                                    ),
                                  ),
                                  (route) => false,
                                );
                              } else {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (ctx) => const WorkerRegistrationScreen()),
                                );
                              }
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
                              if (WorkerSession.isLoggedIn && WorkerSession.role == "CUSTOMER") {
                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute(
                                    builder: (_) => CustomerDashboardScreen(
                                      customerName: WorkerSession.name,
                                      customerPhone: WorkerSession.phone,
                                      customerAddress: WorkerSession.address,
                                      profilePhoto: WorkerSession.profilePhoto,
                                      profilePhotoBytes: WorkerSession.profilePhotoBytes,
                                    ),
                                  ),
                                  (route) => false,
                                );
                              } else {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (ctx) => const CustomerRegistrationScreen()),
                                );
                              }
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
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _showFeaturesGuideDialog(context, theme.currentLanguage),
            backgroundColor: const Color(0xFF2563EB),
            icon: const Icon(Icons.auto_awesome, color: Color(0xFFFDE047), size: 18),
            label: Text(
              theme.currentLanguage == 'hi'
                  ? "ऐप फीचर्स"
                  : (theme.currentLanguage == 'hinglish' ? "App Features" : "Features Guide"),
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
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

  void _showFeaturesGuideDialog(BuildContext context, String initialLang) {
    showDialog(
      context: context,
      builder: (ctx) {
        String selectedLang = initialLang;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final isHi = selectedLang == 'hi';
            final isHinglish = selectedLang == 'hinglish';

            final features = [
              {
                "title": isHi
                    ? "100% एस्क्रो सुरक्षा (Escrow Vault)"
                    : (isHinglish ? "100% Escrow Security" : "100% Escrow Vault Security"),
                "desc": isHi
                    ? "विजिटिंग फीस सुरक्षित एस्क्रो में रहती है। जब तक आप संतुष्ट होकर End OTP नहीं देते, भुगतान रिलीज नहीं होता।"
                    : (isHinglish
                        ? "Visiting fee safe escrow mein hold rehti hai. End OTP dene ke baad hi payment release hota hai."
                        : "Visiting fee remains locked in escrow and is only released after you inspect work and share End OTP."),
                "icon": Icons.lock_outline_rounded,
                "color": const Color(0xFFF59E0B),
              },
              {
                "title": isHi
                    ? "डबल-ओटीपी सुरक्षा (Dual-OTP)"
                    : (isHinglish ? "Dual-OTP Handshake" : "Dual-OTP Security Handshake"),
                "desc": isHi
                    ? "1. Start OTP: कारीगर के घर पहुंचने पर। 2. End OTP: कार्य संतोषजनक पूरा होने पर। शून्य फर्जीवाड़ा।"
                    : (isHinglish
                        ? "1. Start OTP: Ghar aane par. 2. End OTP: Kaam pura hone par. Zero fake bookings."
                        : "Start OTP upon arrival, End OTP upon work completion. Prevents premature payouts."),
                "icon": Icons.security_rounded,
                "color": const Color(0xFF10B981),
              },
              {
                "title": isHi
                    ? "लाइव फेस व आधार OCR सत्यापन"
                    : (isHinglish ? "Live Face & Aadhaar KYC" : "Biometric Face & Aadhaar KYC"),
                "desc": isHi
                    ? "प्रत्येक कारीगर और ग्राहक का असली आधार कार्ड OCR और लाइव सेल्फी द्वारा 100% सत्यापन।"
                    : (isHinglish
                        ? "Har karigar aur customer ka real Aadhaar OCR aur live camera selfie verify hota hai."
                        : "Mandatory optical recognition on Aadhaar and live camera selfie liveness validation."),
                "icon": Icons.verified_user_rounded,
                "color": const Color(0xFF6366F1),
              },
              {
                "title": isHi
                    ? "Google S2 5km रडार"
                    : (isHinglish ? "Google S2 5km Radar" : "Google S2 5km Radar"),
                "desc": isHi
                    ? "सटीक GPS द्वारा 5 किमी के भीतर उपलब्ध कारीगरों की तत्काल खोज व मैप डिस्प्ले।"
                    : (isHinglish
                        ? "Real GPS se 5km radius ke verified workers instant radar par show hote hain."
                        : "Level 13 spatial cell indexing finds closest skilled technicians within 5km in under 0.5ms."),
                "icon": Icons.radar_rounded,
                "color": const Color(0xFF0284C7),
              },
              {
                "title": isHi
                    ? "100% तुरंत रिफंड गारंटी"
                    : (isHinglish ? "Instant 100% Refund" : "100% Instant Source Refund"),
                "desc": isHi
                    ? "कारीगर न आने या कैंसल होने पर पूरी राशि तुरंत आपके मूल बैंक / UPI खाते में रिफंड।"
                    : (isHinglish
                        ? "Cancel hone par 1-click mein pura paisa seedhe UPI ya bank mein refund."
                        : "Instant source-route refunds directly to customer bank account if booking is cancelled."),
                "icon": Icons.replay_rounded,
                "color": const Color(0xFFEF4444),
              },
              {
                "title": isHi
                    ? "पारदर्शी 90/10 स्प्लिट मैथ"
                    : (isHinglish ? "90/10 Split Math" : "Fair 90/10 Earnings Split"),
                "desc": isHi
                    ? "कारीगर को 90% सीधे बैंक में, 10% न्यूनतम प्लेटफॉर्म संचालन शुल्क। शून्य छिपा शुल्क।"
                    : (isHinglish
                        ? "Worker ko 90% payout, platform ko 10% maintenance charge. Zero hidden fees."
                        : "Technicians receive 90% direct payout, platform retains minimal 10% maintenance fee."),
                "icon": Icons.payments_rounded,
                "color": const Color(0xFF8B5CF6),
              },
            ];

            return Dialog(
              backgroundColor: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: const BorderSide(color: Color(0xFF334155))),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480, maxHeight: 600),
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.3)),
                          ),
                          child: const Icon(Icons.auto_awesome, color: Color(0xFFFDE047), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isHi
                                    ? "प्लेटफॉर्म फीचर्स व सुरक्षा गाइड"
                                    : (isHinglish ? "App Features & Safety Guide" : "App Features & Safety Guide"),
                                style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                isHi
                                    ? "डिजिटल काम की सभी प्रमुख खूबियाँ"
                                    : "All key features & trust safeguards",
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Color(0xFF94A3B8), size: 20),
                          onPressed: () => Navigator.of(ctx).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Language Switcher Chips
                    Row(
                      children: [
                        const Text("भाषा / Lang: ", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                        const Spacer(),
                        _buildLangChip("हिंदी", "hi", selectedLang, (l) => setDialogState(() => selectedLang = l)),
                        const SizedBox(width: 6),
                        _buildLangChip("Hinglish", "hinglish", selectedLang, (l) => setDialogState(() => selectedLang = l)),
                        const SizedBox(width: 6),
                        _buildLangChip("English", "en", selectedLang, (l) => setDialogState(() => selectedLang = l)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(color: Color(0xFF334155), height: 1),
                    const SizedBox(height: 8),
                    Expanded(
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: features.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final f = features[index];
                          final color = f["color"] as Color;
                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(f["icon"] as IconData, color: color, size: 18),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        f["title"] as String,
                                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        f["desc"] as String,
                                        style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.35),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          isHi ? "समझ गया (Got it)" : "Close Guide",
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  static Widget _buildLangChip(String label, String code, String current, Function(String) onSelect) {
    final active = code == current;
    return InkWell(
      onTap: () => onSelect(code),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF2563EB) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: active ? const Color(0xFF38BDF8) : const Color(0xFF334155)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : const Color(0xFF94A3B8),
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
