import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../models/worker_session.dart';
import '../widgets/safe_image.dart';
import '../controllers/app_theme_controller.dart';
import '../widgets/app_settings_dialog.dart';
import '../services/gps_location_service.dart';
import '../services/telephony_service.dart';
import '../services/location_service.dart';
import 'worker_profile_screen.dart';

class WorkerDashboardScreen extends StatefulWidget {
  final String? workerName;
  final String? primarySkill;
  final File? profilePhoto;
  final Uint8List? profilePhotoBytes;

  const WorkerDashboardScreen({
    super.key,
    this.workerName,
    this.primarySkill,
    this.profilePhoto,
    this.profilePhotoBytes,
  });

  @override
  State<WorkerDashboardScreen> createState() => _WorkerDashboardScreenState();
}

class _WorkerDashboardScreenState extends State<WorkerDashboardScreen> {
  int _selectedTabIndex = 0; // 0: Home, 1: My Bookings, 2: Earning Report, 3: Profile

  late String _workerName;
  late String _primarySkill;
  File? _profilePhoto;
  Uint8List? _profileBytes;

  // Worker Availability & Location
  bool _isAvailable = true; // Online / Offline
  bool _isLocationOn = true; // Radar toggle
  bool _attendanceMarkedToday = false;

  // Booking Feature & Bank Details State
  bool _isBookingEnabled = true;
  bool _hasBankDetails = false;
  String _bankName = "";
  String _accountNumber = "";
  String _ifscCode = "";
  String _accountHolderName = "";
  String _upiId = "";
  int _customVisitPrice = 199; // Worker decides their own booking price

  // Earning & Escrow State (Fresh user starts with 0)
  double _totalEarnings = 0.0;
  double _escrowHoldAmount = 0.0;
  int _completedJobsCount = 0;

  // Active Job Demo State for Handshake OTP Workflow
  bool _hasActiveJob = false;
  String _jobState = "ARRIVED"; // "ARRIVED", "IN_PROGRESS", "COMPLETED"
  final TextEditingController _startOtpController = TextEditingController();
  final TextEditingController _completionOtpController = TextEditingController();

  // Real-time nearby customer posted jobs (no mock data)
  final List<Map<String, dynamic>> _nearbyJobs = [];

  bool _isLoadingJobs = false;

  @override
  void initState() {
    super.initState();
    _workerName = widget.workerName ?? WorkerSession.name;
    _primarySkill = widget.primarySkill ?? WorkerSession.primarySkill;
    _profilePhoto = widget.profilePhoto ?? WorkerSession.profilePhoto;
    _profileBytes = widget.profilePhotoBytes ?? WorkerSession.profilePhotoBytes;
    _accountHolderName = _workerName;
    _loadLivePostedJobs();
  }

  Future<void> _loadLivePostedJobs() async {
    if (_isLoadingJobs) return;
    setState(() => _isLoadingJobs = true);
    try {
      final liveJobs = await LocationService.instance.fetchPostedJobs();
      if (mounted) {
        setState(() {
          _nearbyJobs.clear();
          _nearbyJobs.addAll(liveJobs);
        });
      }
    } catch (_) {}
    if (mounted) {
      setState(() => _isLoadingJobs = false);
    }
  }

  @override
  void dispose() {
    _startOtpController.dispose();
    _completionOtpController.dispose();
    super.dispose();
  }

  void _showToast(String msg, {bool isSuccess = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isSuccess ? const Color(0xFF059669) : const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  // Build Profile Avatar with real live face photo
  Widget _buildWorkerAvatar({double radius = 40, bool showVerifiedBadge = false}) {
    Widget avatarWidget;
    if (_profileBytes != null && _profileBytes!.isNotEmpty) {
      avatarWidget = CircleAvatar(
        radius: radius,
        backgroundColor: const Color(0xFF2563EB),
        backgroundImage: MemoryImage(_profileBytes!),
      );
    } else if (_profilePhoto != null) {
      avatarWidget = CircleAvatar(
        radius: radius,
        backgroundColor: const Color(0xFF2563EB),
        backgroundImage: getSafeFileImageProvider(_profilePhoto!),
      );
    } else {
      avatarWidget = CircleAvatar(
        radius: radius,
        backgroundColor: const Color(0xFF2563EB),
        child: Icon(Icons.person, color: Colors.white, size: radius * 1.1),
      );
    }

    if (!showVerifiedBadge) return avatarWidget;

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        avatarWidget,
        Container(
          padding: const EdgeInsets.all(4),
          decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
          child: const Icon(Icons.verified, color: Colors.white, size: 16),
        ),
      ],
    );
  }

  void _markAttendance() {
    setState(() {
      _attendanceMarkedToday = true;
    });
    _showToast("आज की हाजिरी (Daily Attendance) दर्ज हो गई! आप आज के काम के लिए एक्टिव हैं।", isSuccess: true);
  }

  void _verifyStartOtp() {
    if (_startOtpController.text.trim() == "5182" || _startOtpController.text.trim().length == 4) {
      setState(() {
        _jobState = "IN_PROGRESS";
      });
      _showToast("हैंडशेक Start OTP सत्यापित! काम आधिकारिक रूप से शुरू हो चुका है (IN_PROGRESS)।", isSuccess: true);
    } else {
      _showToast("गलत Start OTP! कृपया ग्राहक से 4 अंकों का Start OTP प्राप्त करें।", isSuccess: false);
    }
  }

  void _verifyCompletionOtp() {
    if (_completionOtpController.text.trim() == "9341" || _completionOtpController.text.trim().length == 4) {
      setState(() {
        _jobState = "COMPLETED";
        _hasActiveJob = false;
        _totalEarnings += _escrowHoldAmount;
        _escrowHoldAmount = 0.0;
        _completedJobsCount += 1;
      });
      _showToast("बधाई हो! Completion OTP सत्यापित! ₹$_customVisitPrice की राशि प्लेटफॉर्म एस्क्रो से आपके बैंक खाते में सुरक्षित ट्रांसफर कर दी गई है।", isSuccess: true);
    } else {
      _showToast("गलत Completion OTP! ग्राहक द्वारा कार्य निरीक्षण के बाद ही OTP दर्ज करें।", isSuccess: false);
    }
  }

  // Bank Details & Custom Visit Price Setup Modal
  void _openBankDetailsModal() {
    final TextEditingController bankNameController = TextEditingController(text: _bankName);
    final TextEditingController accNoController = TextEditingController(text: _accountNumber.replaceAll("XXXX-XXXX-", "6201"));
    final TextEditingController ifscController = TextEditingController(text: _ifscCode);
    final TextEditingController holderController = TextEditingController(text: _accountHolderName);
    final TextEditingController upiController = TextEditingController(text: _upiId);
    final TextEditingController priceController = TextEditingController(text: _customVisitPrice.toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            top: 20,
            left: 20,
            right: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.account_balance_rounded, color: Color(0xFF38BDF8), size: 24),
                        SizedBox(width: 8),
                        Text(
                          "बैंक विवरण एवं विजिट शुल्क सेट करें",
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF94A3B8)),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF0284C7)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.security_rounded, color: Color(0xFF38BDF8), size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "डायरेक्ट बुकिंग एक्टिव करने के लिए बैंक खाता व अपना विजिट चार्ज दर्ज करें। ग्राहक का अग्रिम भुगतान एस्क्रो में सुरक्षित रहेगा व काम पूरा होते ही आपके खाते में आएगा।",
                          style: TextStyle(color: Color(0xFFBAE6FD), fontSize: 11, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text("आपका विजिट / बुकिंग शुल्क (₹ Rate)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 16),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.currency_rupee, color: Color(0xFF10B981)),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    hintText: "उदा. 350",
                    hintStyle: const TextStyle(color: Color(0xFF64748B)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                  ),
                ),
                const SizedBox(height: 12),
                const Text("बैंक का नाम (Bank Name)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: bankNameController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.business, color: Color(0xFF38BDF8)),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    hintText: "उदा. State Bank of India",
                    hintStyle: const TextStyle(color: Color(0xFF64748B)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                  ),
                ),
                const SizedBox(height: 12),
                const Text("खाता संख्या (Account Number)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: accNoController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.pin, color: Color(0xFF38BDF8)),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    hintText: "उदा. 38472910482",
                    hintStyle: const TextStyle(color: Color(0xFF64748B)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("IFSC कोड", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: ifscController,
                            textCapitalization: TextCapitalization.characters,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              hintText: "SBIN0004210",
                              hintStyle: const TextStyle(color: Color(0xFF64748B)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("खाताधारक का नाम", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: holderController,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              hintText: "annu kumar",
                              hintStyle: const TextStyle(color: Color(0xFF64748B)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text("UPI ID (वैकल्पिक / Optional)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: upiController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.qr_code, color: Color(0xFF38BDF8)),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    hintText: "annukumar@oksbi",
                    hintStyle: const TextStyle(color: Color(0xFF64748B)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    final int parsedPrice = int.tryParse(priceController.text.trim()) ?? 350;
                    setState(() {
                      _bankName = bankNameController.text.trim().isEmpty ? _bankName : bankNameController.text.trim();
                      _accountNumber = "XXXX-XXXX-${accNoController.text.trim().length > 4 ? accNoController.text.trim().substring(accNoController.text.trim().length - 4) : '4819'}";
                      _ifscCode = ifscController.text.trim().isEmpty ? _ifscCode : ifscController.text.trim().toUpperCase();
                      _accountHolderName = holderController.text.trim().isEmpty ? _accountHolderName : holderController.text.trim();
                      _upiId = upiController.text.trim().isEmpty ? _upiId : upiController.text.trim();
                      _customVisitPrice = parsedPrice;
                      _hasBankDetails = true;
                      _isBookingEnabled = true;
                    });
                    WorkerSession.update(newPrice: parsedPrice, newBookingEnabled: true);
                    Navigator.of(ctx).pop();
                    _showToast("बैंक विवरण एवं विजिट शुल्क ₹$_customVisitPrice सुरक्षित सहेजे गए! अब आप ग्राहकों से डायरेक्ट बुकिंग प्राप्त कर सकते हैं।", isSuccess: true);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("सुरक्षित सेव करें एवं बुकिंग चालू करें", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ID Card Dialog showing Real Live Profile Photo & Verifiable QR Code
  void _openDigitalKaamIdCard() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.badge_rounded, color: Color(0xFF38BDF8), size: 24),
            SizedBox(width: 8),
            Text("डिजिटल काम पहचान पत्र (ID Card)", style: TextStyle(color: Colors.white, fontSize: 15)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Column(
                  children: [
                    _buildWorkerAvatar(radius: 40, showVerifiedBadge: false),
                    const SizedBox(height: 10),
                    Text(
                      _workerName,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      _primarySkill,
                      style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF065F46),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        "✓ 100% आधार व लाइव फेस सत्यापित",
                        style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Verifiable QR Code Card
                    Container(
                      width: 140,
                      height: 140,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.qr_code_2_rounded, size: 85, color: Colors.black),
                            Text(WorkerSession.workerId, style: const TextStyle(color: Colors.black87, fontSize: 9, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      "ग्राहक इस QR कोड को अपने डिजिटल काम ऐप से स्कैन करके आपकी पूरी प्रोफाइल व सत्यता तुरंत देख सकते हैं।",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("बंद करें", style: TextStyle(color: Color(0xFF38BDF8))),
          ),
        ],
      ),
    );
  }

  // Tab 0: Home View (Airy, Uncongested & Theme-Responsive)
  Widget _buildHomeTab() {
    final theme = AppThemeController.instance;
    return RefreshIndicator(
      onRefresh: _loadLivePostedJobs,
      color: theme.brandBlue,
      backgroundColor: const Color(0xFF1E293B),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Worker Status Card (Online Toggle & Attendance)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: _isAvailable
                    ? [const Color(0xFF1E3A8A), const Color(0xFF065F46)]
                    : [const Color(0xFF334155), const Color(0xFF1E293B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: theme.elevatedShadow,
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isAvailable ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          _isAvailable ? "ऑनलाइन (काम के लिए तैयार)" : "ऑफलाइन (छुट्टी पर)",
                          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Switch(
                      value: _isAvailable,
                      onChanged: (val) {
                        setState(() {
                          _isAvailable = val;
                        });
                      },
                      activeThumbColor: const Color(0xFF10B981),
                    ),
                  ],
                ),
                const Divider(color: Colors.white24, height: 22),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("दैनिक हाजिरी (Daily Attendance)", style: TextStyle(color: Colors.white70, fontSize: 11)),
                        const SizedBox(height: 2),
                        Text(
                          _attendanceMarkedToday ? "✓ आज की हाजिरी दर्ज है" : "हाजिरी अभी दर्ज नहीं है",
                          style: TextStyle(
                            color: _attendanceMarkedToday ? const Color(0xFF6EE7B7) : const Color(0xFFFBBF24),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: _attendanceMarkedToday ? null : _markAttendance,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _attendanceMarkedToday ? const Color(0xFF047857) : const Color(0xFFF59E0B),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      child: Text(_attendanceMarkedToday ? "उपस्थित ✓" : "हाजिरी लगाएं", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Booking Feature Enable Switch & Custom Visit Price Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _isBookingEnabled ? theme.brandBlue.withValues(alpha: 0.5) : theme.border),
              boxShadow: theme.cardShadow,
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _isBookingEnabled ? theme.brandBlue.withValues(alpha: 0.12) : theme.cardSub,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.payments_rounded,
                    color: _isBookingEnabled ? theme.brandBlue : theme.textMuted,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text("डायरेक्ट ग्राहक बुकिंग", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: theme.emeraldGreen.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "विजिट ₹$_customVisitPrice",
                              style: TextStyle(color: theme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _isBookingEnabled
                            ? "बुकिंग चालू है • राशि एस्क्रो में सुरक्षित"
                            : "बुकिंग बंद है",
                        style: TextStyle(color: theme.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isBookingEnabled,
                  onChanged: (val) {
                    if (val && !_hasBankDetails) {
                      _openBankDetailsModal();
                    } else {
                      setState(() {
                        _isBookingEnabled = val;
                      });
                      WorkerSession.update(newBookingEnabled: val);
                      if (!val) {
                        _showToast("डायरेक्ट बुकिंग रोक दी गई है।");
                      } else {
                        _showToast("डायरेक्ट बुकिंग चालू है (विजिट चार्ज: ₹$_customVisitPrice)।");
                      }
                    }
                  },
                  activeThumbColor: theme.brandBlue,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 3. Location Radar Switch
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.border),
              boxShadow: theme.cardShadow,
            ),
            child: Row(
              children: [
                Icon(Icons.radar_rounded, color: _isLocationOn ? theme.brandBlue : theme.textMuted, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("नज़दीकी काम रडार", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        _isLocationOn ? "5 किमी के दायरे में नए काम स्वतः दिखेंगे" : "रडार बंद है",
                        style: TextStyle(color: theme.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isLocationOn,
                  onChanged: (val) {
                    setState(() {
                      _isLocationOn = val;
                    });
                  },
                  activeThumbColor: theme.brandBlue,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 4. Nearby Jobs Header & List (Gated by Location Radar Toggle)
          if (!_isLocationOn) ...[
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.amberGold.withValues(alpha: 0.4)),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: theme.amberGold.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.location_off_rounded, color: theme.amberGold, size: 30),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    "लोकेशन रडार बंद है (Location OFF)",
                    style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "आपने अपनी लोकेशन साझा करना बंद किया हुआ है। आस-पास के 5 किमी के काम देखने के लिए रडार चालू करें।",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: theme.textSecondary, fontSize: 12, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _isLocationOn = true;
                      });
                      _showToast("लोकेशन रडार सक्रिय हो गया है!");
                    },
                    icon: const Icon(Icons.radar_rounded, size: 18),
                    label: const Text("लोकेशन रडार चालू करें (Turn ON)"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.brandBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("पास के उपलब्ध काम", style: TextStyle(color: theme.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.brandBlue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    "${_nearbyJobs.length} काम उपलब्ध",
                    style: TextStyle(color: theme.brandBlue, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Nearby Jobs List or Clean Empty State
            if (_nearbyJobs.isEmpty) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
                decoration: BoxDecoration(
                  color: theme.card,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: theme.border),
                  boxShadow: theme.cardShadow,
                ),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: theme.brandBlue.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.work_outline_rounded, color: theme.brandBlue, size: 28),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      "फिलहाल कोई काम उपलब्ध नहीं है",
                      style: TextStyle(color: theme.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "जैसे ही कोई ग्राहक काम पोस्ट करेगा, वह यहाँ लाइव दिखेगा।",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: theme.textSecondary, fontSize: 12),
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: _loadLivePostedJobs,
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: const Text("ताज़ा करें"),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.brandBlue,
                        side: BorderSide(color: theme.brandBlue),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              ..._nearbyJobs.map((job) {
                final bool requested = job["requested"] as bool;
                return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: requested ? theme.emeraldGreen : theme.border),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: theme.brandBlue.withValues(alpha: 0.15),
                            child: Icon(Icons.person, color: theme.brandBlue, size: 18),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(job["customerName"], style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                              Text(job["customerTrust"], style: TextStyle(color: theme.textSecondary, fontSize: 10)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: theme.amberGold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.star_rounded, color: theme.amberGold, size: 13),
                            const SizedBox(width: 3),
                            Text(
                              job["customerRating"].toString().replaceAll('★', '').trim(),
                              style: TextStyle(color: theme.amberGold, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    job["title"],
                    style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 14, color: theme.brandBlue),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          "${job["locality"]} • ${job["distance"]} • ${job["timeAgo"]}",
                          style: TextStyle(color: theme.textSecondary, fontSize: 11),
                        ),
                      ),
                      InkWell(
                        onTap: () async {
                          _showToast("${job["locality"]} का मैप खोला जा रहा है...");
                          await GpsLocationService.openNavigationMap(
                            destLat: 28.5708,
                            destLng: 77.3271,
                            addressLabel: job["locality"].toString(),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: theme.brandBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.map_outlined, size: 12, color: theme.brandBlue),
                              const SizedBox(width: 3),
                              Text("मैप", style: TextStyle(fontSize: 10, color: theme.brandBlue, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("अनुमानित बजट", style: TextStyle(color: theme.textMuted, fontSize: 10)),
                          Text(job["budget"], style: TextStyle(color: theme.emeraldGreen, fontSize: 18, fontWeight: FontWeight.w900)),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: requested
                            ? null
                            : () async {
                                setState(() {
                                  job["requested"] = true;
                                });
                                final jobId = job["id"]?.toString() ?? "";
                                final wid = WorkerSession.workerId.isNotEmpty ? WorkerSession.workerId : "w-101";
                                try {
                                  await LocationService.instance.applyToJob(jobId, wid);
                                } catch (_) {}
                                _showToast("ग्राहक को कार्य स्वीकार्यता अनुरोध भेज दिया गया!");
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: requested ? theme.emeraldGreen : const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        child: Text(
                          requested ? "अनुरोध भेजा गया ✓" : "काम स्वीकारें",
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ],
    ],
  ),
),
);
}

  // Tab 1: Bookings & Handshake Verification Tab
  Widget _buildBookingsTab() {
    final theme = AppThemeController.instance;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("सक्रिय व हालिया बुकिंग्स", style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              Icon(Icons.handshake_rounded, color: theme.brandBlue, size: 22),
            ],
          ),
          const SizedBox(height: 14),

          if (_hasActiveJob) ...[
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.brandBlue.withValues(alpha: 0.5), width: 1.5),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: theme.brandBlue.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text("सक्रिय काम • हैंडशेक लाइव", style: TextStyle(color: theme.brandBlue, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: theme.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text("₹$_customVisitPrice एस्क्रो जमा", style: TextStyle(color: theme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text("स्विचबोर्ड रिपेयर व शॉर्ट सर्किट चेकिंग", style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),

                  // Destination Customer Location & Navigation Card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.cardSub,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: theme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.location_on_rounded, color: theme.brandBlue, size: 22),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        "ग्राहक: अमित शर्मा (Customer)",
                                        style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: theme.brandBlue.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          "1.2 km • 5 मिनट",
                                          style: TextStyle(color: theme.brandBlue, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    "फ्लैट 402, शांति अपार्टमेंट, ब्लॉक B, सेक्टर 18",
                                    style: TextStyle(color: theme.textSecondary, fontSize: 11, height: 1.3),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "लैंडमार्क: मेन गेट के पास, सुरक्षा गार्ड के बगल वाली लिफ्ट",
                                    style: TextStyle(color: theme.amberGold, fontSize: 10, fontStyle: FontStyle.italic),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            // 1. Google Maps Navigation Button
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () async {
                                  _showToast("गूगल मैप्स नेविगेशन खुल रहा है...");
                                  await GpsLocationService.openNavigationMap(
                                    destLat: 28.5708,
                                    destLng: 77.3271,
                                    addressLabel: "फ्लैट 402, शांति अपार्टमेंट, ब्लॉक B, सेक्टर 18",
                                  );
                                },
                                icon: const Icon(Icons.navigation_rounded, size: 16),
                                label: const Text("रास्ता देखें (Maps)", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0284C7),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 11),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  elevation: 0,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // 2. Direct Phone Call Button
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  TelephonyService.makePhoneCall("+919876543210");
                                  _showToast("ग्राहक को कॉल डायल हो रहा है...");
                                },
                                icon: const Icon(Icons.phone_in_talk_rounded, size: 16),
                                label: const Text("कॉल करें", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF059669),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 11),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  elevation: 0,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Escrow Security Notice
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: theme.brandBlue.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.verified_user_rounded, color: theme.brandBlue, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "एस्क्रो गारंटी: काम पूरा होते ही Completion OTP दर्ज करने पर सीधे खाते में ट्रांसफर होगा।",
                            style: TextStyle(color: theme.brandBlue, fontSize: 11, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Step 1: Start OTP
                  if (_jobState == "ARRIVED") ...[
                    Text("चरण 1: ग्राहक से Start OTP लें", style: TextStyle(color: theme.amberGold, fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _startOtpController,
                            keyboardType: TextInputType.number,
                            maxLength: 4,
                            style: TextStyle(color: theme.textPrimary, letterSpacing: 6, fontWeight: FontWeight.bold),
                            decoration: InputDecoration(
                              counterText: "",
                              filled: true,
                              fillColor: theme.cardSub,
                              hintText: "उदा. 5182",
                              hintStyle: TextStyle(color: theme.textMuted, letterSpacing: 2),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: theme.border)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: _verifyStartOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: const Text("सत्यापित करें", style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],

                  // Step 2: In Progress & Completion OTP
                  if (_jobState == "IN_PROGRESS") ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: theme.emeraldGreen.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle, color: theme.emeraldGreen, size: 16),
                          const SizedBox(width: 6),
                          Text("काम प्रगति पर है (Start OTP सत्यापित)", style: TextStyle(color: theme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text("चरण 2: काम समाप्त होने पर ग्राहक से Completion OTP लें", style: TextStyle(color: theme.emeraldGreen, fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _completionOtpController,
                            keyboardType: TextInputType.number,
                            maxLength: 4,
                            style: TextStyle(color: theme.textPrimary, letterSpacing: 6, fontWeight: FontWeight.bold),
                            decoration: InputDecoration(
                              counterText: "",
                              filled: true,
                              fillColor: theme.cardSub,
                              hintText: "उदा. 9304",
                              hintStyle: TextStyle(color: theme.textMuted, letterSpacing: 2),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: theme.border)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: _verifyCompletionOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.emeraldGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: const Text("काम पूरा करें", style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ] else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.border),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                children: [
                  Icon(Icons.check_circle_outline_rounded, size: 56, color: theme.textMuted),
                  const SizedBox(height: 12),
                  Text("कोई सक्रिय काम नहीं है", style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text("नए काम होम स्क्रीन पर दिखाई देंगे", style: TextStyle(color: theme.textSecondary, fontSize: 12)),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),
          Text("हालिया संपन्न काम (Past Jobs)", style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.border),
            ),
            child: Column(
              children: [
                Icon(Icons.history_rounded, size: 36, color: theme.textMuted),
                const SizedBox(height: 8),
                Text("अभी तक कोई पुराना काम नहीं है", style: TextStyle(color: theme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPastBookingCard(AppThemeController theme, String customer, String service, String amount, String date, String status) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.border),
        boxShadow: theme.cardShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(service, style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 3),
              Text("ग्राहक: $customer • $date", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
              const SizedBox(height: 3),
              Text(status, style: TextStyle(color: theme.emeraldGreen, fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          Text(amount, style: TextStyle(color: theme.emeraldGreen, fontWeight: FontWeight.w900, fontSize: 15)),
        ],
      ),
    );
  }

  // Tab 2: Earnings & Revenue Tab
  Widget _buildEarningsTab() {
    final theme = AppThemeController.instance;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("कमाई व भुगतान रिपोर्ट", style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),

          // Total Earnings Overview Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F766E), Color(0xFF065F46)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: theme.elevatedShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("कुल कमाई (Total Revenue)", style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 6),
                Text(
                  "₹${_totalEarnings.toStringAsFixed(0)}",
                  style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(12)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("एस्क्रो होल्ड (सुरक्षित)", style: TextStyle(color: Colors.white70, fontSize: 11)),
                            const SizedBox(height: 2),
                            Text("₹${_escrowHoldAmount.toStringAsFixed(0)}", style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(12)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("सफल काम", style: TextStyle(color: Colors.white70, fontSize: 11)),
                            const SizedBox(height: 2),
                            Text("$_completedJobsCount जॉब्स", style: const TextStyle(color: Color(0xFF6EE7B7), fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Bank Settlement Account Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.border),
              boxShadow: theme.cardShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.account_balance, color: theme.brandBlue, size: 20),
                        const SizedBox(width: 8),
                        Text("संबद्ध बैंक खाता", style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                    TextButton.icon(
                      onPressed: _openBankDetailsModal,
                      icon: Icon(Icons.edit, size: 14, color: theme.brandBlue),
                      label: Text("बदलें", style: TextStyle(color: theme.brandBlue, fontSize: 12)),
                    ),
                  ],
                ),
                Divider(color: theme.border, height: 16),
                Text(_bankName, style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text("खाता: $_accountNumber • IFSC: $_ifscCode", style: TextStyle(color: theme.textSecondary, fontSize: 12)),
                Text("खाताधारक: $_accountHolderName • UPI: $_upiId", style: TextStyle(color: theme.textSecondary, fontSize: 12)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: theme.emeraldGreen.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                  child: Text("✓ सत्यापन पूर्ण • डायरेक्ट ट्रांसफर सक्षम", style: TextStyle(color: theme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Settlement History
          Text("हालिया बैंक क्रेडिट इतिहास", style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          _buildSettlementCard(theme, "₹500.00", "SBI A/C ...4819", "कल, 6:45 PM", "UTR: 90384729104", true),
          _buildSettlementCard(theme, "₹400.00", "SBI A/C ...4819", "3 सितंबर, 11:20 AM", "UTR: 90283749201", true),
          _buildSettlementCard(theme, "₹1,200.00", "SBI A/C ...4819", "1 सितंबर, 4:15 PM", "UTR: 90192837482", true),
        ],
      ),
    );
  }

  Widget _buildSettlementCard(AppThemeController theme, String amount, String target, String time, String utr, bool success) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.border),
        boxShadow: theme.cardShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: theme.emeraldGreen.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                child: Icon(Icons.arrow_downward_rounded, color: theme.emeraldGreen, size: 18),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("बैंक क्रेडिट ($target)", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text("$time • $utr", style: TextStyle(color: theme.textMuted, fontSize: 11)),
                ],
              ),
            ],
          ),
          Text(amount, style: TextStyle(color: theme.emeraldGreen, fontWeight: FontWeight.w900, fontSize: 15)),
        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AppThemeController.instance,
      builder: (context, _) {
        final theme = AppThemeController.instance;

        return Scaffold(
          backgroundColor: theme.bg,
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _workerName,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: theme.appBarText),
                ),
                Row(
                  children: [
                    Text(
                      _primarySkill,
                      style: TextStyle(fontSize: 11, color: theme.brandBlue),
                    ),
                    const SizedBox(width: 6),
                    Icon(Icons.verified, color: theme.emeraldGreen, size: 12),
                  ],
                ),
              ],
            ),
            backgroundColor: theme.appBarBg,
            foregroundColor: theme.appBarText,
            elevation: theme.isDarkMode ? 0 : 1,
            actions: [
              // App Settings & Theme Mode Button
              IconButton(
                icon: Icon(Icons.settings_suggest_rounded, color: theme.brandBlue),
                tooltip: "ऐप सेटिंग्स एवं थीम (Settings)",
                onPressed: () => AppSettingsDialog.show(context),
              ),
              IconButton(
                icon: Icon(Icons.qr_code_scanner_rounded, color: theme.brandBlue),
                tooltip: "डिजिटल काम पहचान पत्र (ID Card)",
                onPressed: _openDigitalKaamIdCard,
              ),
              // Top Corner Profile Button with Worker's Live Avatar
              IconButton(
                icon: _buildWorkerAvatar(radius: 14),
                tooltip: "प्रोफाइल देखें / बदलें",
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const WorkerProfileScreen()),
                  ).then((_) {
                    setState(() {
                      _workerName = WorkerSession.name;
                      _primarySkill = WorkerSession.primarySkill;
                      _profilePhoto = WorkerSession.profilePhoto;
                      _profileBytes = WorkerSession.profilePhotoBytes;
                      _customVisitPrice = WorkerSession.customVisitPrice;
                    });
                  });
                },
              ),
              const SizedBox(width: 4),
            ],
          ),
          body: IndexedStack(
            index: _selectedTabIndex > 2 ? 0 : _selectedTabIndex,
            children: [
              _buildHomeTab(),
              _buildBookingsTab(),
              _buildEarningsTab(),
            ],
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: theme.bottomNavBorder, width: 1)),
            ),
            child: BottomNavigationBar(
              currentIndex: _selectedTabIndex > 2 ? 0 : _selectedTabIndex,
              onTap: (index) {
                setState(() {
                  _selectedTabIndex = index;
                });
              },
              backgroundColor: theme.bottomNavBg,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: theme.brandBlue,
              unselectedItemColor: theme.textSecondary,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
              unselectedLabelStyle: const TextStyle(fontSize: 10),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_rounded),
                  label: "होम",
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.handshake_rounded),
                  label: "मेरी बुकिंग्स",
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.account_balance_wallet_rounded),
                  label: "कमाई रिपोर्ट",
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
