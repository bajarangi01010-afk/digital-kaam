import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/worker_session.dart';
import '../widgets/safe_image.dart';
import '../services/location_service.dart';
import '../controllers/app_theme_controller.dart';
import '../widgets/app_settings_dialog.dart';
import '../services/telephony_service.dart';
import 'customer_profile_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  final String customerName;
  final File? profilePhoto;
  final Uint8List? profilePhotoBytes;
  final String? customerPhone;
  final String? customerAddress;

  const CustomerDashboardScreen({
    super.key,
    required this.customerName,
    this.profilePhoto,
    this.profilePhotoBytes,
    this.customerPhone,
    this.customerAddress,
  });

  @override
  State<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  int _selectedTabIndex = 0; // 0: Home, 1: My Bookings, 2: Payment Report

  late String _currentCustomerName;
  String? _currentCustomerPhone;
  String? _currentCustomerAddress;
  File? _customerPhoto;
  Uint8List? _customerPhotoBytes;

  bool _isLocationOn = true;
  double _selectedRadiusKm = 5.0;
  bool _isLoadingNearby = false;
  Map<String, dynamic>? _liveTrackingData;
  final ImagePicker _picker = ImagePicker();

  // Active Booking & Escrow & Handshake OTP State (Fresh user starts with 0 active bookings)
  bool _hasActiveBooking = false;
  String _activeBookingStatus = "NONE"; // "CONFIRMED", "WORKER_ARRIVED", "IN_PROGRESS", "COMPLETED", "REFUNDED"
  final String _startOtp = "5182";
  final String _completionOtp = "9341";

  // Payment Report & Escrow State (Fresh user starts with 0)
  double _totalSpent = 0.0;
  double _escrowLocked = 0.0;
  double _totalRefunded = 0.0;

  // Active booked worker details
  Map<String, dynamic> _activeWorker = {};

  // List of nearby verified workers (dynamically loaded)
  final List<Map<String, dynamic>> _nearbyWorkers = [];

  // Post Work Modal controllers
  final TextEditingController _workDescriptionController = TextEditingController();
  File? _workImage;

  @override
  void initState() {
    super.initState();
    _currentCustomerName = widget.customerName;
    _currentCustomerPhone = widget.customerPhone;
    _currentCustomerAddress = widget.customerAddress;
    _customerPhoto = widget.profilePhoto ?? WorkerSession.profilePhoto;
    _customerPhotoBytes = widget.profilePhotoBytes ?? WorkerSession.profilePhotoBytes;
    _loadNearbyWorkers();
  }

  Future<void> _loadNearbyWorkers() async {
    setState(() => _isLoadingNearby = true);
    final workers = await LocationService.instance.fetchNearbyWorkers(
      radiusKm: _selectedRadiusKm,
    );
    if (mounted) {
      setState(() {
        _nearbyWorkers.clear();
        _nearbyWorkers.addAll(workers);
        _isLoadingNearby = false;
      });
    }
  }

  @override
  void dispose() {
    _workDescriptionController.dispose();
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

  // 1. Post a Work Flow (Text + Category + Budget + Image)
  void _openPostWorkModal() {
    String selectedCategory = "इलेक्ट्रीशियन (Electrician)";
    final TextEditingController budgetController = TextEditingController(text: "450");
    final List<String> categories = [
      "इलेक्ट्रीशियन (Electrician)",
      "प्लंबर (Plumber)",
      "कारपेंटर (Carpenter)",
      "पेंटर (Painter)",
      "राजमिस्त्री (Mason)",
      "सफाई कर्मचारी (Cleaning)",
      "होम अप्लायंस रिपेयर",
      "अन्य दैनिक कार्य",
    ];

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
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "नया काम पोस्ट करें (Post a Work)",
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF94A3B8)),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  "कार्य की श्रेणी चुनें (Select Category):",
                  style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  height: 36,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: categories.length,
                    itemBuilder: (context, idx) {
                      final cat = categories[idx];
                      final isSelected = cat == selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : const Color(0xFF94A3B8))),
                          selected: isSelected,
                          onSelected: (val) {
                            if (val) setModalState(() => selectedCategory = cat);
                          },
                          selectedColor: const Color(0xFF2563EB),
                          backgroundColor: const Color(0xFF0F172A),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  "काम का विवरण लिखें (Explain the Work):",
                  style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _workDescriptionController,
                  maxLines: 3,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: "उदा. पंखा खराब है, स्विचबोर्ड में स्पार्क हो रहा है...",
                    hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "अनुमानित बजट (Budget ₹):",
                            style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: budgetController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            decoration: InputDecoration(
                              prefixText: "₹ ",
                              prefixStyle: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () async {
                        final XFile? photo = await _picker.pickImage(source: ImageSource.camera, maxWidth: 800, imageQuality: 80);
                        if (photo != null) {
                          setModalState(() {
                            _workImage = File(photo.path);
                          });
                        }
                      },
                      icon: const Icon(Icons.camera_alt_rounded, size: 18),
                      label: const Text("फोटो खींचें", style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF38BDF8),
                        side: const BorderSide(color: Color(0xFF0284C7)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton.icon(
                      onPressed: () async {
                        final XFile? galleryImage = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 80);
                        if (galleryImage != null) {
                          setModalState(() {
                            _workImage = File(galleryImage.path);
                          });
                        }
                      },
                      icon: const Icon(Icons.photo_library_rounded, size: 18),
                      label: const Text("गैलरी से चुनें", style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF38BDF8),
                        side: const BorderSide(color: Color(0xFF0284C7)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
                if (_workImage != null) ...[
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SafeImage(file: _workImage, height: 120, width: double.infinity, fit: BoxFit.cover),
                  ),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    final desc = _workDescriptionController.text.trim();
                    if (desc.isEmpty) {
                      _showToast("कृपया काम का विवरण लिखें!", isSuccess: false);
                      return;
                    }
                    final int parsedBudget = int.tryParse(budgetController.text.trim()) ?? 450;
                    Navigator.of(ctx).pop();

                    final String customerName = _currentCustomerName.isNotEmpty ? _currentCustomerName : "सत्यापित ग्राहक";
                    final String customerPhone = _currentCustomerPhone ?? "+91 98765 43210";
                    final String customerAddr = _currentCustomerAddress ?? (WorkerSession.address.isNotEmpty ? WorkerSession.address : "पटना, बिहार (GPS Live)");

                    // Post to real-time backend so it reaches worker feed immediately
                    await LocationService.instance.postJob(
                      title: desc.length > 50 ? "${desc.substring(0, 47)}..." : desc,
                      category: selectedCategory,
                      description: desc,
                      budget: parsedBudget,
                      customerName: customerName,
                      customerPhone: customerPhone,
                      customerAddress: customerAddr,
                    );

                    _showToast("आपका काम लाइव रडार पर पोस्ट हो चुका है! पास के सभी कारीगरों के फीड में पहुंच गया।", isSuccess: true);
                    _workDescriptionController.clear();
                    _workImage = null;
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("काम सबमिट करें (Post Request)", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // 2. Direct Call Worker (Master Idea: Gated by Active Escrow Booking)
  void _directCallWorker(Map<String, dynamic> worker) {
    final bool isBooked = worker["isBooked"] == true;
    if (!isBooked) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.lock_rounded, color: Color(0xFFF59E0B)),
              SizedBox(width: 8),
              Expanded(
                child: Text("कॉल अनलॉक करने के लिए विज़िट बुक करें", style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "कारीगर: ${worker["name"]}\nनंबर: +91 98112 ••••• (सुरक्षित लॉक)",
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                ),
                child: const Text(
                  "कारीगर का समय और आपका पैसा सुरक्षित रखने के लिए, डायरेक्ट कॉल से पहले विज़िट शुल्क प्लेटफ़ॉर्म के सुरक्षित एस्क्रो में जमा होना अनिवार्य है। बुकिंग होते ही कॉल तुरंत अनलॉक हो जाएगी!",
                  style: TextStyle(color: Color(0xFFFEF3C7), fontSize: 12, height: 1.4),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text("रद्द करें", style: TextStyle(color: Color(0xFF94A3B8))),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(ctx).pop();
                _bookWorker(worker);
              },
              icon: const Icon(Icons.payment_rounded, size: 16),
              label: Text("${worker["visitCharge"] ?? "विज़िट"} एस्क्रो जमा कर बुक करें"),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      );
      return;
    }

    // If booked, proceed with unlocked call
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.phone_in_talk_rounded, color: Color(0xFF10B981)),
            SizedBox(width: 8),
            Text("कारीगर से डायरेक्ट कॉल (सक्रिय)", style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "${worker["name"]} को डायल किया जा रहा है:\n${worker["phone"] ?? "+91 98765 43210"}\n\n✓ एस्क्रो सुरक्षित बुकिंग सक्रिय है।",
              style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF065F46).withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF10B981)),
              ),
              child: Row(
                children: const [
                  Icon(Icons.lock_open_rounded, color: Color(0xFF34D399), size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "डायरेक्ट कॉल ब्रिज अनलॉक! आप कारीगर से सीधे बात कर सकते हैं।",
                      style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("बंद करें", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton.icon(
            onPressed: () {
              TelephonyService.makePhoneCall(worker["phone"] ?? "+91 98765 43210");
            },
            icon: const Icon(Icons.call, size: 16),
            label: const Text("फ़ोन डायलर में खोलें"),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  // 3. Direct Book with Payment & Auto-Refund Protection
  void _bookWorker(Map<String, dynamic> worker) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.shield_rounded, color: Color(0xFF38BDF8)),
            SizedBox(width: 10),
            Text("सुरक्षित बुकिंग व अग्रिम भुगतान", style: TextStyle(color: Colors.white, fontSize: 15)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("कारीगर: ${worker["name"]} (${worker["skill"]})", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              Text("विजिट शुल्क: ${worker["visitCharge"]}", style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 14, fontWeight: FontWeight.bold)),
              const Divider(color: Color(0xFF334155), height: 20),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF059669)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.security_update_good_rounded, color: Color(0xFF10B981), size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "100% ऑटो-रिफंड गारंटी: यदि कारीगर नहीं पहुंचता, तो पूरी राशि स्वतः तुरंत आपके खाते में रिफंड हो जाएगी।",
                        style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, height: 1.4),
                      ),
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
            child: const Text("रद्द करें", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final String bookingId = "DK-BK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}";
              final tracking = await LocationService.instance.createBookingTracking(
                bookingId: bookingId,
                customerName: widget.customerName.isNotEmpty ? widget.customerName : "ग्राहक",
                customerPhone: "+91 99999 88888",
                workerId: worker["workerId"] ?? worker["id"] ?? "W-101",
                serviceName: worker["skill"] ?? "दैनिक कारीगर",
                visitingFee: worker["visitingFeeInt"] ?? 199,
              );
              if (!mounted) return;
              setState(() {
                worker["isBooked"] = true;
                _hasActiveBooking = true;
                _activeBookingStatus = "ON_THE_WAY";
                _liveTrackingData = tracking;
                _activeWorker = {
                  "name": worker["name"],
                  "skill": worker["skill"],
                  "phone": worker["phone"],
                  "amount": worker["visitCharge"],
                  "bookingId": bookingId,
                  "time": "अभी",
                  "photoUrl": worker["photoUrl"] ?? "",
                };
                _selectedTabIndex = 1; // Auto jump to My Bookings tab
              });
              _showToast("बुकिंग सफल! ${worker["visitCharge"]} एस्क्रो सुरक्षित। लाइव ट्रैकिंग चालू हुई।", isSuccess: true);
              _openLiveTrackingSheet();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
            ),
            child: const Text("भुगतान व पुष्टि करें", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // 3b. Real-Time Live Worker Tracking Modal
  void _openLiveTrackingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sheetCtx, setSheetState) {
            final tracking = _liveTrackingData;
            final String status = tracking?["status"] ?? _activeBookingStatus;
            final double distanceKm = (tracking?["distance_km"] as num?)?.toDouble() ?? 1.0;
            final int etaMins = (tracking?["eta_minutes"] as num?)?.toInt() ?? 5;
            final String startOtp = tracking?["start_otp"] ?? _startOtp;
            final double progress = (tracking?["step_progress"] as num?)?.toDouble() ?? 0.35;
            final bool isReached = status == "REACHED" || distanceKm <= 0.2;

            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                border: Border(top: BorderSide(color: Color(0xFF38BDF8), width: 2)),
              ),
              child: Column(
                children: [
                  // Handle bar
                  Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(color: const Color(0xFF475569), borderRadius: BorderRadius.circular(3)),
                  ),

                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Color(0xFF0284C7),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.radar_rounded, color: Colors.white, size: 18),
                            ),
                            const SizedBox(width: 10),
                            const Text("लाइव ट्रैकिंग रडार", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF10B981)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              CircleAvatar(radius: 4, backgroundColor: Color(0xFF10B981)),
                              SizedBox(width: 6),
                              Text("S2 Geometry Active", style: TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: Color(0xFF1E293B)),

                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Worker Profile Card
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 26,
                                  backgroundColor: const Color(0xFF2563EB),
                                  backgroundImage: WorkerSession.profilePhotoBytes != null && WorkerSession.profilePhotoBytes!.isNotEmpty
                                      ? MemoryImage(WorkerSession.profilePhotoBytes!)
                                      : null,
                                  child: WorkerSession.profilePhotoBytes == null
                                      ? const Icon(Icons.person, color: Colors.white, size: 28)
                                      : null,
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(_activeWorker["name"] ?? "वेरिफाइड कारीगर", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                      Text(_activeWorker["skill"] ?? "इलेक्ट्रीशियन", style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12)),
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(color: const Color(0xFF065F46), borderRadius: BorderRadius.circular(6)),
                                        child: const Text("✓ आधार व फेस सत्यापित", style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 10, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton.filled(
                                  onPressed: () => _directCallWorker(_activeWorker),
                                  icon: const Icon(Icons.call, color: Colors.white, size: 20),
                                  style: IconButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 2. Big Live Metrics Card (Distance & ETA)
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isReached
                                    ? [const Color(0xFF065F46), const Color(0xFF047857)]
                                    : [const Color(0xFF0C4A6E), const Color(0xFF0369A1)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: (isReached ? const Color(0xFF10B981) : const Color(0xFF0284C7)).withValues(alpha: 0.3),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                Column(
                                  children: [
                                    const Text("दूरी (Distance)", style: TextStyle(color: Color(0xFFBAE6FD), fontSize: 11)),
                                    const SizedBox(height: 4),
                                    Text(
                                      isReached ? "पहुंच चुके हैं" : "${distanceKm.toStringAsFixed(2)} km",
                                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                                    ),
                                  ],
                                ),
                                Container(width: 1, height: 40, color: Colors.white.withValues(alpha: 0.2)),
                                Column(
                                  children: [
                                    const Text("पहुंचने का समय (ETA)", style: TextStyle(color: Color(0xFFBAE6FD), fontSize: 11)),
                                    const SizedBox(height: 4),
                                    Text(
                                      isReached ? "द्वार पर" : "$etaMins मिनट",
                                      style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 22, fontWeight: FontWeight.w900),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 18),

                          // 3. Status Milestones Progress Bar
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      isReached ? "स्थिति: कारीगर आपके द्वार पर है" : "स्थिति: कारीगर रास्ते में है (22 km/h गति)",
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                    Text("${(progress * 100).toInt()}%", style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: LinearProgressIndicator(
                                    value: progress,
                                    minHeight: 8,
                                    backgroundColor: const Color(0xFF0F172A),
                                    valueColor: AlwaysStoppedAnimation<Color>(isReached ? const Color(0xFF10B981) : const Color(0xFF38BDF8)),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: const [
                                    Text("बुकिंग कन्फर्म", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                                    Text("रास्ते में", style: TextStyle(color: Color(0xFF38BDF8), fontSize: 10, fontWeight: FontWeight.bold)),
                                    Text("द्वार पर", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                                    Text("काम शुरू", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 18),

                          // 4. Secure Start Handshake OTP Card
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: const [
                                    Icon(Icons.lock_person_rounded, color: Color(0xFFF59E0B), size: 20),
                                    SizedBox(width: 8),
                                    Text("स्टार्ट सुरक्षा कोड (Start Handshake OTP)", style: TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.bold, fontSize: 13)),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E293B),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFD97706)),
                                  ),
                                  child: Text(
                                    startOtp,
                                    style: const TextStyle(
                                      color: Color(0xFFFBBF24),
                                      fontSize: 32,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 10,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                const Text(
                                  "कारीगर के आपके घर पहुंचने के बाद यह OTP बताएं। OTP डालने पर ही काम शुरू होगा और लाइव ट्रैकिंग संपन्न होगी।",
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, height: 1.4),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // 5. Smart Simulation Advance Button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                final bookingId = _activeWorker["bookingId"] ?? "BK-1001";
                                final updated = await LocationService.instance.updateTrackingStep(bookingId);
                                if (updated != null) {
                                  setState(() {
                                    _liveTrackingData = updated;
                                    if (updated["status"] == "REACHED") {
                                      _activeBookingStatus = "WORKER_ARRIVED";
                                    }
                                  });
                                  setSheetState(() {});
                                  _showToast(
                                    updated["status"] == "REACHED"
                                        ? "कारीगर आपके पते पर पहुंच चुका है!"
                                        : "कारीगर ${updated["distance_km"]} km दूर है (${updated["eta_minutes"]} मिनट)",
                                    isSuccess: true,
                                  );
                                }
                              },
                              icon: const Icon(Icons.fast_forward_rounded, size: 18),
                              label: const Text("सिमुलेट करें: कारीगर आगे बढ़ा (Advance GPS)", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0284C7),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
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
      },
    );
  }

  // 4. Strict Auto-Refund Claim for No-Show
  void _claimNoShowRefund() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 24),
            SizedBox(width: 8),
            Text("कारीगर नहीं आया? (100% Refund)", style: TextStyle(color: Colors.white, fontSize: 15)),
          ],
        ),
        content: const Text(
          "क्या आप पुष्टि करते हैं कि कारीगर निर्धारित समय पर नहीं पहुंचा?\n\nप्लेटफॉर्म एस्क्रो से आपकी पूरी राशि (100%) तत्काल आपके मूल भुगतान खाते में स्वतः क्रेडिट कर दी जाएगी।",
          style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("इंतजार करें", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              setState(() {
                _activeBookingStatus = "REFUNDED";
                _hasActiveBooking = false;
                _totalRefunded += _escrowLocked;
                _escrowLocked = 0.0;
              });
              _showToast("100% रिफंड सफल! ₹350 तत्काल आपके खाते में वापस क्रेडिट कर दिए गए हैं।", isSuccess: true);
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), foregroundColor: Colors.white),
            child: const Text("हाँ, तुरंत रिफंड प्राप्त करें", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // 5. Interactive Worker ID Scanner & Full Verified Details Display on Customer Phone
  void _openWorkerIdScanner() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF38BDF8)),
            SizedBox(width: 8),
            Text("कारीगर QR स्कैनर (Live Scan)", style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF0284C7), width: 1.5),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.qr_code_2_rounded, size: 90, color: Color(0xFF38BDF8)),
                        SizedBox(height: 6),
                        Text("कारीगर का ID कार्ड QR कोड फ्रेम में लाएं", textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        Text("सत्यापित डिजिटल काम ID", style: TextStyle(color: Color(0xFF64748B), fontSize: 10)),
                      ],
                    ),
                    // Animated Scanner Line graphic
                    Positioned(
                      top: 40,
                      left: 30,
                      right: 30,
                      child: Container(
                        height: 2,
                        decoration: BoxDecoration(
                          color: const Color(0xFF38BDF8),
                          boxShadow: [
                            BoxShadow(color: const Color(0xFF38BDF8).withValues(alpha: 0.8), blurRadius: 10, spreadRadius: 2),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                "QR स्कैन होते ही कारीगर की लाइव फेस फोटो, आधार सत्यापन, रेटिंग व विजिट फीस आपके फोन पर दिखेगी।",
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, height: 1.4),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    _showScannedWorkerModal();
                  },
                  icon: const Icon(Icons.document_scanner_rounded, size: 18),
                  label: const Text("📷 QR कोड स्कैन करें (Scan Live)", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("बंद करें", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
        ],
      ),
    );
  }

  // 6. Show Scanned Worker Complete Profile & Credentials on Customer Phone
  void _showScannedWorkerModal() {
    final String workerName = WorkerSession.name.isNotEmpty ? WorkerSession.name : "annu kumar (अन्नू कुमार)";
    final String workerSkill = WorkerSession.primarySkill.isNotEmpty ? WorkerSession.primarySkill : "इलेक्ट्रीशियन (Electrician)";
    final String workerPhone = WorkerSession.phone;
    final int visitPrice = WorkerSession.customVisitPrice;
    final Uint8List? photoBytes = WorkerSession.profilePhotoBytes;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
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
                      Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 24),
                      SizedBox(width: 8),
                      Text("सत्यापित कारीगर विवरण (Verified ID)", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Color(0xFF94A3B8)),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Worker Profile Card with Live Photo
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFF10B981), width: 1.5),
                ),
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        photoBytes != null && photoBytes.isNotEmpty
                            ? CircleAvatar(
                                radius: 44,
                                backgroundColor: const Color(0xFF2563EB),
                                backgroundImage: MemoryImage(photoBytes),
                              )
                            : const CircleAvatar(
                                radius: 44,
                                backgroundColor: Color(0xFF2563EB),
                                child: Icon(Icons.person, color: Colors.white, size: 50),
                              ),
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                          child: const Icon(Icons.verified, color: Colors.white, size: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      workerName,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      workerSkill,
                      style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: const Color(0xFF065F46), borderRadius: BorderRadius.circular(8)),
                      child: const Text("✓ 100% आधार बायोमेट्रिक व लाइव फेस सत्यापित", style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(6)),
                          child: const Text("आईडी: DK-VERIFIED-9842", style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(6)),
                          child: const Text("4.9 ★ (14 सफल काम)", style: TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Fee & Escrow Protection details
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("तयशुदा विजिट फीस:", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                        Text("₹$visitPrice", style: const TextStyle(color: Color(0xFF10B981), fontSize: 18, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const Divider(color: Color(0xFF334155), height: 18),
                    Row(
                      children: const [
                        Icon(Icons.shield_rounded, color: Color(0xFF38BDF8), size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "100% प्लेटफॉर्म एस्क्रो सुरक्षा: आपका भुगतान सुरक्षित रहेगा। काम से पूरी संतुष्टि के बाद Completion OTP देने पर ही कारीगर को मिलेगा।",
                            style: TextStyle(color: Color(0xFFBAE6FD), fontSize: 11, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Action Buttons on Customer Phone
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _directCallWorker({
                          "name": workerName,
                          "phone": workerPhone,
                        });
                      },
                      icon: const Icon(Icons.call_rounded, size: 16),
                      label: const Text("कॉल करें", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF38BDF8),
                        side: const BorderSide(color: Color(0xFF0284C7)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _bookWorker({
                          "name": workerName,
                          "skill": workerSkill,
                          "phone": workerPhone,
                          "visitCharge": "₹$visitPrice",
                          "isBooked": true,
                        });
                      },
                      icon: const Icon(Icons.bookmark_add_rounded, size: 16),
                      label: const Text("डायरेक्ट बुक करें", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  // Tab 0: Home Tab (Spacious & Clean, Zero Congestion)
  Widget _buildHomeTab() {
    final theme = AppThemeController.instance;
    return RefreshIndicator(
      onRefresh: _loadNearbyWorkers,
      color: theme.brandBlue,
      backgroundColor: const Color(0xFF1E293B),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          // Customer Welcome Header with Live Photo & Verified Pill
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: const Color(0xFF2563EB),
                  backgroundImage: (_customerPhotoBytes != null && _customerPhotoBytes!.isNotEmpty)
                      ? MemoryImage(_customerPhotoBytes!)
                      : (_customerPhoto != null ? FileImage(_customerPhoto!) : null) as ImageProvider?,
                  child: (_customerPhotoBytes == null && _customerPhoto == null)
                      ? const Icon(Icons.person, color: Colors.white, size: 24)
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              "नमस्ते, ${widget.customerName.isNotEmpty ? widget.customerName : 'ग्राहक'}!",
                              style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFF065F46), borderRadius: BorderRadius.circular(6)),
                            child: const Text("✓ सत्यापित", style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 9, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.customerAddress ?? (WorkerSession.address.isNotEmpty ? WorkerSession.address : "पटना, बिहार (GPS Live)"),
                        style: TextStyle(color: theme.textSecondary, fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 1. Post a Work Hero Card (Spacious, Uncluttered)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1D4ED8), Color(0xFF0284C7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: theme.elevatedShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "घर या दुकान का कोई काम?",
                      style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        "त्वरित सेवा",
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  "सत्यापित कारीगर तुरंत बुलाएं • 100% सुरक्षित एस्क्रो भुगतान",
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _openPostWorkModal,
                  icon: const Icon(Icons.add_task_rounded, size: 18),
                  label: const Text("नया काम पोस्ट करें", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1D4ED8),
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 2. Location Radar Toggle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.border),
              boxShadow: theme.cardShadow,
            ),
            child: Row(
              children: [
                Icon(Icons.location_searching_rounded, color: _isLocationOn ? theme.brandBlue : theme.textMuted, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "नज़दीकी रडार (Nearby Radar)",
                        style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _isLocationOn ? "5 किमी के सत्यापित कारीगर दिख रहे हैं" : "रडार बंद है",
                        style: TextStyle(color: theme.textSecondary, fontSize: 12),
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
          if (_isLocationOn) ...[
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  Text("दायरा: ", style: TextStyle(color: theme.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 6),
                  ...[2.0, 5.0, 10.0].map((radius) {
                    final bool isSel = _selectedRadiusKm == radius;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          "${radius.toInt()} km ${radius == 5.0 ? '(मानक)' : ''}",
                          style: TextStyle(
                            color: isSel ? Colors.white : theme.textSecondary,
                            fontSize: 12,
                            fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        selected: isSel,
                        onSelected: (val) {
                          if (val) {
                            setState(() => _selectedRadiusKm = radius);
                            _loadNearbyWorkers();
                          }
                        },
                        selectedColor: theme.brandBlue,
                        backgroundColor: theme.cardSub,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    );
                  }),
                  if (_isLoadingNearby) ...[
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: theme.brandBlue),
                    ),
                  ],
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),

          // 3. Nearby Verified Workers List Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "सत्यापित कारीगर (Nearby Workers)",
                style: TextStyle(color: theme.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.brandBlue.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "${_nearbyWorkers.length} उपलब्ध",
                  style: TextStyle(color: theme.brandBlue, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          if (_nearbyWorkers.isEmpty)
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
                  Icon(Icons.person_search_rounded, size: 52, color: theme.textMuted),
                  const SizedBox(height: 12),
                  Text("अभी आपके क्षेत्र में कोई कारीगर उपलब्ध नहीं है", textAlign: TextAlign.center, style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text("जैसे ही नए कारीगर रजिस्टर होंगे, वे यहाँ दिखाई देंगे", textAlign: TextAlign.center, style: TextStyle(color: theme.textSecondary, fontSize: 12)),
                ],
              ),
            )
          else
            ..._nearbyWorkers.map((worker) {
              final Uint8List? photoBytes = worker["photoBytes"] as Uint8List?;

            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: theme.border),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      photoBytes != null && photoBytes.isNotEmpty
                          ? CircleAvatar(
                              radius: 24,
                              backgroundColor: const Color(0xFF2563EB),
                              backgroundImage: MemoryImage(photoBytes),
                            )
                          : const CircleAvatar(
                              radius: 24,
                              backgroundColor: Color(0xFF2563EB),
                              child: Icon(Icons.person, color: Colors.white, size: 26),
                            ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              worker["name"],
                              style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              worker["skill"],
                              style: TextStyle(color: theme.brandBlue, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
                                        worker["rating"].toString().replaceAll('★', '').trim(),
                                        style: TextStyle(color: theme.amberGold, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  "•  ${worker["distance"]}",
                                  style: TextStyle(color: theme.textSecondary, fontSize: 12),
                                ),
                              ],
                            ),
                            if (worker["address"] != null && worker["address"].toString().isNotEmpty) ...[
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  Icon(Icons.location_pin, size: 11, color: theme.brandBlue),
                                  const SizedBox(width: 2),
                                  Expanded(
                                    child: Text(
                                      worker["address"].toString(),
                                      style: TextStyle(color: theme.textMuted, fontSize: 10),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            worker["visitCharge"],
                            style: TextStyle(color: theme.emeraldGreen, fontSize: 18, fontWeight: FontWeight.w900),
                          ),
                          Text("विजिट शुल्क", style: TextStyle(color: theme.textMuted, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified, color: theme.emeraldGreen, size: 13),
                            const SizedBox(width: 4),
                            Text(
                              "KYC सत्यापित",
                              style: TextStyle(color: theme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      InkWell(
                        onTap: _openWorkerIdScanner,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                          child: Row(
                            children: [
                              Icon(Icons.qr_code_rounded, size: 15, color: theme.brandBlue),
                              const SizedBox(width: 4),
                              Text("ID QR", style: TextStyle(color: theme.brandBlue, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Action Buttons: Direct Call & Direct Book (Comfortable Spacing)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _directCallWorker(worker),
                          icon: const Icon(Icons.call_rounded, size: 17),
                          label: const Text("कॉल करें", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: theme.brandBlue,
                            side: BorderSide(color: theme.brandBlue),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _bookWorker(worker),
                          icon: const Icon(Icons.bookmark_add_rounded, size: 17),
                          label: const Text("बुक करें", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    ),
  );
}

  // Tab 1: My Bookings Tab (Airy, Handshake Dual-OTP & Strict No-Show Refund)
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
              Text(
                "आपकी बुकिंग्स व सक्रिय काम",
                style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Icon(Icons.handshake_rounded, color: theme.brandBlue, size: 22),
            ],
          ),
          const SizedBox(height: 14),

          if (_hasActiveBooking) ...[
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
                        child: Text(
                          _activeBookingStatus == "WORKER_ARRIVED"
                              ? "कारीगर द्वार पर है"
                              : _activeBookingStatus == "IN_PROGRESS"
                                  ? "काम प्रगति पर है"
                                  : "बुकिंग कन्फर्म",
                          style: TextStyle(color: theme.brandBlue, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: theme.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          "${_activeWorker["amount"]} सुरक्षित",
                          style: TextStyle(color: theme.emeraldGreen, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _activeWorker["name"],
                    style: TextStyle(color: theme.textPrimary, fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "${_activeWorker["skill"]} • ID: ${_activeWorker["bookingId"]}",
                    style: TextStyle(color: theme.brandBlue, fontSize: 12),
                  ),
                  const SizedBox(height: 14),

                  // Radar tracking bar
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: theme.cardSub,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: theme.border),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.radar_rounded, color: theme.brandBlue, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _activeBookingStatus == "ON_THE_WAY" ? "🔴 कारीगर रास्ते में है (Live)" : "📍 कारीगर पहुंच गया है",
                                style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "${_liveTrackingData?["distance_km"] ?? "1.0"} km • ${_liveTrackingData?["eta_minutes"] ?? "5"} मिनट",
                                style: TextStyle(color: theme.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: _openLiveTrackingSheet,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.brandBlue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: const Text("ट्रैक करें", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Escrow Security Badge (Single Clean Line)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: theme.brandBlue.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.shield_rounded, color: theme.brandBlue, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "एस्क्रो सुरक्षा: काम से संतुष्ट होने पर ही समाप्ति OTP दें।",
                            style: TextStyle(color: theme.brandBlue, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Handshake OTP Section (Spacious Two-Column Box)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.cardSub,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: theme.border),
                    ),
                    child: Row(
                      children: [
                        // Start OTP
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Start OTP (शुरुआत):", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                              const SizedBox(height: 4),
                              Text(
                                _startOtp,
                                style: TextStyle(color: theme.brandBlue, fontSize: 24, letterSpacing: 4, fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(height: 2),
                              Text("कारीगर को बताएं", style: TextStyle(color: theme.textMuted, fontSize: 10)),
                            ],
                          ),
                        ),
                        Container(width: 1, height: 48, color: theme.border),
                        const SizedBox(width: 14),
                        // End OTP
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("End OTP (समाप्ति):", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                              const SizedBox(height: 4),
                              Text(
                                _completionOtp,
                                style: TextStyle(color: theme.emeraldGreen, fontSize: 24, letterSpacing: 4, fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(height: 2),
                              Text("काम पूरा होने पर दें", style: TextStyle(color: theme.emeraldGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Emergency / No-Show Auto Refund Trigger
                  Center(
                    child: TextButton.icon(
                      onPressed: _claimNoShowRefund,
                      icon: const Icon(Icons.report_problem_rounded, color: Color(0xFFEF4444), size: 16),
                      label: const Text("कारीगर नहीं आया? (100% रिफंड लें)", style: TextStyle(color: Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
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
                  Text("कोई सक्रिय बुकिंग नहीं है", style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text("पास के किसी भी कारीगर को होम स्क्रीन से तुरंत बुक करें", textAlign: TextAlign.center, style: TextStyle(color: theme.textSecondary, fontSize: 12)),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),
          Text(
            "पिछली बुकिंग्स (Past Bookings)",
            style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
          ),
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
                Text("अभी तक कोई पिछली बुकिंग नहीं है", style: TextStyle(color: theme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPastCustomerJobCard(String worker, String title, String amount, String status) {
    final theme = AppThemeController.instance;
    final bool isRefund = status.contains("रिफंड");
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
              Text(title, style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 3),
              Text("कारीगर: $worker", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
              const SizedBox(height: 3),
              Text(
                status,
                style: TextStyle(
                  color: isRefund ? const Color(0xFFEF4444) : theme.emeraldGreen,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Text(
            amount,
            style: TextStyle(
              color: isRefund ? const Color(0xFFEF4444) : theme.textPrimary,
              fontWeight: FontWeight.w900,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  // Tab 2: Payment & Escrow Report Tab
  Widget _buildPaymentReportTab() {
    final theme = AppThemeController.instance;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("भुगतान व एस्क्रो रिपोर्ट", style: TextStyle(color: theme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),

          // Total Spent Overview Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1D4ED8), Color(0xFF0F766E)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: theme.elevatedShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("कुल खर्च (Total Spent)", style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 6),
                Text(
                  "₹${_totalSpent.toStringAsFixed(0)}",
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
                            const Text("एस्क्रो में सुरक्षित", style: TextStyle(color: Colors.white70, fontSize: 11)),
                            const SizedBox(height: 2),
                            Text("₹${_escrowLocked.toStringAsFixed(0)}", style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 16)),
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
                            const Text("कुल रिफंड प्राप्त", style: TextStyle(color: Colors.white70, fontSize: 11)),
                            const SizedBox(height: 2),
                            Text("₹${_totalRefunded.toStringAsFixed(0)}", style: const TextStyle(color: Color(0xFF6EE7B7), fontWeight: FontWeight.bold, fontSize: 16)),
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

          // Payment Protection Rules
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: theme.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.border),
              boxShadow: theme.cardShadow,
            ),
            child: Row(
              children: [
                Icon(Icons.verified_user_rounded, color: theme.brandBlue, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "डिजिटल काम एस्क्रो: काम पूरा व सत्यापित होने के बाद ही राशि कारीगर को मिलती है।",
                    style: TextStyle(color: theme.textSecondary, fontSize: 12, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Detailed Transaction Logs
          Text("लेनदेन इतिहास (History)", style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          _buildPaymentLogItem(theme, "विजिट बुकिंग (annu kumar)", "₹350.00", "आज, 4:15 PM", "एस्क्रो में लॉक", theme.brandBlue),
          _buildPaymentLogItem(theme, "ऑटो-रिफंड (दिनेश प्लंबर नो-शो)", "+₹380.00", "3 सितंबर, 2:10 PM", "खाते में क्रेडिट", theme.emeraldGreen),
          _buildPaymentLogItem(theme, "सफल कार्य भुगतान (महेश शर्मा)", "₹400.00", "28 अगस्त, 6:30 PM", "ट्रांसफर पूर्ण", theme.textMuted),
          _buildPaymentLogItem(theme, "विजिट बुकिंग (संजय पेंटर)", "₹850.00", "15 अगस्त, 11:00 AM", "ट्रांसफर पूर्ण", theme.textMuted),
        ],
      ),
    );
  }

  Widget _buildPaymentLogItem(AppThemeController theme, String title, String amount, String date, String status, Color statusColor) {
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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 3),
              Text("$date • $status", style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
          Text(amount, style: TextStyle(color: theme.textPrimary, fontWeight: FontWeight.w900, fontSize: 15)),
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
                  "नमस्ते, $_currentCustomerName",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: theme.appBarText),
                ),
                Row(
                  children: [
                    Text(
                      "ग्राहक खाता",
                      style: TextStyle(fontSize: 11, color: theme.brandBlue),
                    ),
                    const SizedBox(width: 6),
                    Icon(Icons.verified_user, color: theme.emeraldGreen, size: 12),
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
                tooltip: "कारीगर पहचान पत्र सत्यापन",
                onPressed: _openWorkerIdScanner,
              ),
              // Top Corner Profile Button
              IconButton(
                icon: CircleAvatar(
                  radius: 14,
                  backgroundColor: const Color(0xFF2563EB),
                  backgroundImage: (_customerPhotoBytes != null && _customerPhotoBytes!.isNotEmpty)
                      ? MemoryImage(_customerPhotoBytes!)
                      : (_customerPhoto != null ? FileImage(_customerPhoto!) : null) as ImageProvider?,
                  child: (_customerPhotoBytes == null && _customerPhoto == null)
                      ? const Icon(Icons.person, color: Colors.white, size: 16)
                      : null,
                ),
                tooltip: "प्रोफाइल देखें / बदलें",
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CustomerProfileScreen(
                        customerName: _currentCustomerName,
                        customerPhoto: _customerPhoto,
                        customerBytes: _customerPhotoBytes,
                        customerPhone: _currentCustomerPhone,
                        customerAddress: _currentCustomerAddress,
                        onProfileUpdated: (newName, newPhone, newAddress, newPhoto, newBytes) {
                          setState(() {
                            _currentCustomerName = newName;
                            _currentCustomerPhone = newPhone;
                            _currentCustomerAddress = newAddress;
                            _customerPhoto = newPhoto;
                            _customerPhotoBytes = newBytes;
                          });
                        },
                      ),
                    ),
                  );
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
              _buildPaymentReportTab(),
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
                  icon: Icon(Icons.receipt_long_rounded),
                  label: "भुगतान रिपोर्ट",
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
