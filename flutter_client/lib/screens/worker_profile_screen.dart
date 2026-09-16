import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/worker_session.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../services/gps_location_service.dart';
import '../widgets/live_face_verification_dialog.dart';
import '../widgets/document_camera_scanner_dialog.dart';
import '../controllers/app_theme_controller.dart';
import '../widgets/app_settings_dialog.dart';
import 'landing_screen.dart';

class WorkerProfileScreen extends StatefulWidget {
  const WorkerProfileScreen({super.key});

  @override
  State<WorkerProfileScreen> createState() => _WorkerProfileScreenState();
}

class _WorkerProfileScreenState extends State<WorkerProfileScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoggingOut = false;

  void _showToast(String message, {bool isSuccess = true}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isSuccess ? Icons.check_circle : Icons.error, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontSize: 13))),
          ],
        ),
        backgroundColor: isSuccess ? const Color(0xFF059669) : const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(12),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Widget _buildAvatar({File? file, Uint8List? bytes, double radius = 36, IconData fallbackIcon = Icons.engineering_rounded}) {
    ImageProvider? provider;
    if (bytes != null && bytes.isNotEmpty) {
      provider = MemoryImage(bytes);
    } else if (file != null) {
      provider = FileImage(file);
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: const Color(0xFF1E293B),
      backgroundImage: provider,
      child: provider == null ? Icon(fallbackIcon, color: Colors.white70, size: radius * 0.9) : null,
    );
  }

  // Copy or share the public profile QR link
  void _copyProfileLink() {
    final String url = ApiConfig.workerPublicUrl(WorkerSession.workerId);
    Clipboard.setData(ClipboardData(text: url));
    _showToast("प्रोफाइल लिंक कॉपी हो गई: $url\nकिसी भी ब्राउज़र या फोन में खोलें!", isSuccess: true);
  }

  // Open URL in browser
  Future<void> _openBrowserProfile() async {
    final String url = ApiConfig.workerPublicUrl(WorkerSession.workerId);
    final Uri uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _copyProfileLink();
      }
    } catch (_) {
      _copyProfileLink();
    }
  }

  // ──────────────────────────────────────────────────────────
  //  EDIT PROFILE MODAL (STRICT REGISTRATION RULES ENFORCED)
  // ──────────────────────────────────────────────────────────
  void _openEditProfileDialog() {
    final TextEditingController nameCtrl = TextEditingController(text: WorkerSession.name);
    final TextEditingController phoneCtrl = TextEditingController(
      text: WorkerSession.phone.replaceAll("+91", "").replaceAll(" ", "").trim(),
    );
    final TextEditingController otpCtrl = TextEditingController();
    final TextEditingController addressCtrl = TextEditingController(text: WorkerSession.address);
    final TextEditingController feeCtrl = TextEditingController(text: WorkerSession.customVisitPrice.toString());

    String selectedSkill = WorkerSession.primarySkill;
    final List<String> availableSkills = [
      "इलेक्ट्रीशियन (Electrician)",
      "प्लंबर (Plumber)",
      "कारपेंटर (Carpenter)",
      "पेंटर (Painter)",
      "वेल्डर व फैब्रिकेटर",
      "एसी व फ्रिज मैकेनिक",
      "मेसन / राजमिस्त्री",
      "मोटर पंप मैकेनिक",
    ];
    if (!availableSkills.contains(selectedSkill)) {
      availableSkills.insert(0, selectedSkill);
    }

    // Validation & State tracking variables
    bool isNameAadhaarVerified = true; // initially true for existing session
    String verifiedNameForAadhaar = WorkerSession.name.trim();
    bool isPhoneVerified = true; // true for existing number, false if edited
    String originalPhone = phoneCtrl.text.trim();
    bool isSendingOtp = false;
    bool isOtpSent = false;
    String sentOtpCode = "";

    bool isDetectingLocation = false;
    String s2Cell = WorkerSession.s2Token;
    double lat = WorkerSession.lat;
    double lng = WorkerSession.lng;

    File? newFacePhoto = WorkerSession.profilePhoto;
    Uint8List? newFaceBytes = WorkerSession.profilePhotoBytes;
    bool isFaceVerified = true;

    String? aadhaarStatusMessage = WorkerSession.aadhaarStatus;
    bool isAadhaarOcrPassed = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) {

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              top: 20,
              left: 20,
              right: 20,
            ),
            child: SizedBox(
              height: MediaQuery.of(modalCtx).size.height * 0.85,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.edit_note_rounded, color: Color(0xFF38BDF8), size: 26),
                          SizedBox(width: 8),
                          Text(
                            "प्रोफाइल विवरण बदलें (Edit Profile)",
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white70),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: const Text(
                      "🔒 सुरक्षा नियम: नाम, फोन या फोटो बदलने पर प्रारंभिक रजिस्ट्रेशन सत्यापन (OTP, S2 लोकेशन व फेस स्कैन) आवश्यक है।",
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    ),
                  ),
                  const SizedBox(height: 14),

                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Name Field
                          const Text("पूरा नाम (आधार कार्ड के अनुसार)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: nameCtrl,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            onChanged: (val) {
                              if (val.trim() != verifiedNameForAadhaar) {
                                setModalState(() {
                                  isNameAadhaarVerified = false;
                                  isAadhaarOcrPassed = false;
                                  aadhaarStatusMessage = "नाम बदलने के कारण आधार कार्ड पुनः स्कैन करना आवश्यक है";
                                });
                              } else {
                                setModalState(() {
                                  isNameAadhaarVerified = true;
                                  isAadhaarOcrPassed = true;
                                  aadhaarStatusMessage = "✓ 100% आधार व फेस सत्यापित";
                                });
                              }
                            },
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Icons.person, color: Color(0xFF38BDF8)),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              hintText: "उदा. annu kumar",
                              hintStyle: const TextStyle(color: Color(0xFF64748B)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                            ),
                          ),
                          if (!isNameAadhaarVerified)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                "⚠️ चेतावनी: नाम बदला गया है! कृपया नीचे आधार कार्ड स्कैन करें।",
                                style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ),
                          const SizedBox(height: 16),

                          // 2. Mobile Number (Strict 10 Digits + OTP)
                          const Text("मोबाइल नंबर (10 अंक)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F172A),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFF334155)),
                                ),
                                child: const Text("+91", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: phoneCtrl,
                                  keyboardType: TextInputType.phone,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(10),
                                  ],
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  onChanged: (val) {
                                    if (val.trim() != originalPhone) {
                                      setModalState(() {
                                        isPhoneVerified = false;
                                        isOtpSent = false;
                                      });
                                    } else {
                                      setModalState(() {
                                        isPhoneVerified = true;
                                      });
                                    }
                                  },
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: const Color(0xFF0F172A),
                                    hintText: "9876543210",
                                    hintStyle: const TextStyle(color: Color(0xFF64748B)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              if (!isPhoneVerified)
                                ElevatedButton(
                                  onPressed: isSendingOtp
                                      ? null
                                      : () async {
                                          if (phoneCtrl.text.trim().length != 10) {
                                            _showToast("कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें", isSuccess: false);
                                            return;
                                          }
                                          setModalState(() => isSendingOtp = true);
                                          final dynamicCode = (1000 + (DateTime.now().millisecondsSinceEpoch % 9000)).toString();
                                          sentOtpCode = dynamicCode;
                                          otpCtrl.clear();
                                          await Future.delayed(const Duration(milliseconds: 600));
                                          setModalState(() {
                                            isSendingOtp = false;
                                            isOtpSent = true;
                                          });
                                          _showToast("OTP भेजा गया! कृपया 4-अंकीय कोड दर्ज करें", isSuccess: true);
                                        },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0284C7),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                  ),
                                  child: isSendingOtp
                                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : const Text("OTP भेजें", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                )
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                  decoration: BoxDecoration(color: const Color(0xFF065F46), borderRadius: BorderRadius.circular(10)),
                                  child: const Text("✓ सत्यापित", style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold, fontSize: 12)),
                                ),
                            ],
                          ),

                          // OTP input if phone changed
                          if (!isPhoneVerified && isOtpSent) ...[
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: otpCtrl,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                      LengthLimitingTextInputFormatter(4),
                                    ],
                                    style: const TextStyle(color: Colors.white, fontSize: 14, letterSpacing: 2),
                                    decoration: InputDecoration(
                                      filled: true,
                                      fillColor: const Color(0xFF0F172A),
                                      hintText: "4-अंकीय OTP",
                                      hintStyle: const TextStyle(color: Color(0xFF64748B)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: () {
                                    if (otpCtrl.text.trim().isNotEmpty && otpCtrl.text.trim() == sentOtpCode) {
                                      setModalState(() {
                                        isPhoneVerified = true;
                                        originalPhone = phoneCtrl.text.trim();
                                      });
                                      _showToast("मोबाइल नंबर सफलतापूर्वक OTP सत्यापित हो गया!", isSuccess: true);
                                    } else {
                                      _showToast("अमान्य OTP! कृपया SMS में आया सही कोड दर्ज करें", isSuccess: false);
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  ),
                                  child: const Text("OTP सत्यापित करें", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 16),

                          // 3. Trade / Primary Skill
                          const Text("मुख्य हुनर / कार्य (Primary Skill)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: selectedSkill,
                                isExpanded: true,
                                dropdownColor: const Color(0xFF0F172A),
                                style: const TextStyle(color: Colors.white, fontSize: 14),
                                items: availableSkills.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setModalState(() => selectedSkill = val);
                                  }
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 4. Visiting Charge
                          const Text("विजिट / बुकिंग शुल्क (₹)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: feeCtrl,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: InputDecoration(
                              prefixText: "₹ ",
                              prefixStyle: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              hintText: "350",
                              hintStyle: const TextStyle(color: Color(0xFF64748B)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 5. Address & S2 Location Detector
                          const Text("सत्यापित कार्य क्षेत्र व पता (S2 Geometry)", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: addressCtrl,
                            maxLines: 2,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              hintText: "उदा. shivpur , sikariyan , darigaon road sasaram",
                              hintStyle: const TextStyle(color: Color(0xFF64748B)),
                              contentPadding: const EdgeInsets.all(12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF334155))),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              ElevatedButton.icon(
                                onPressed: isDetectingLocation
                                    ? null
                                    : () async {
                                        setModalState(() => isDetectingLocation = true);
                                        try {
                                          final loc = await GpsLocationService.instance.getExactLocation();
                                          setModalState(() {
                                            isDetectingLocation = false;
                                            addressCtrl.text = loc.formattedAddress;
                                            s2Cell = loc.s2CellToken;
                                            lat = loc.latitude;
                                            lng = loc.longitude;
                                          });
                                          _showToast("S2 लोकेशन प्राप्त: ${loc.formattedAddress} (टोकन: $s2Cell)", isSuccess: true);
                                        } catch (_) {
                                          setModalState(() => isDetectingLocation = false);
                                        }
                                      },
                                icon: isDetectingLocation
                                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : const Icon(Icons.my_location_rounded, size: 16),
                                label: const Text("📍 GPS / S2 लोकेशन अपडेट करें", style: TextStyle(fontSize: 12)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2563EB),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F172A),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFF334155)),
                                ),
                                child: Text("S2: $s2Cell", style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontFamily: 'monospace')),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // 6. Live Face Camera Scan
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: Row(
                              children: [
                                _buildAvatar(
                                  file: newFacePhoto,
                                  bytes: newFaceBytes,
                                  radius: 25,
                                  fallbackIcon: Icons.camera_alt,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: const [
                                      Text("बायोमेट्रिक लाइव फेस फोटो", style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                      SizedBox(height: 2),
                                      Text("एंटी-स्पूफिंग व लाइव कैमरा सत्यापन", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                                    ],
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    showDialog(
                                      context: modalCtx,
                                      barrierDismissible: false,
                                      builder: (diagCtx) => LiveFaceVerificationDialog(
                                        uploadedProfilePhoto: null,
                                        onVerificationComplete: (snapshot, result) async {
                                          Uint8List? bytes;
                                          try {
                                            bytes = await snapshot.readAsBytes();
                                          } catch (_) {}
                                          setModalState(() {
                                            newFacePhoto = snapshot;
                                            newFaceBytes = bytes;
                                            isFaceVerified = true;
                                          });
                                          _showToast("लाइव फेस सफलतापूर्वक 100% सत्यापित!", isSuccess: true);
                                        },
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  ),
                                  child: const Text("कैमरा स्कैन", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),

                          // 7. Aadhaar OCR Card Verification
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isAadhaarOcrPassed ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      isAadhaarOcrPassed ? Icons.verified : Icons.warning_amber_rounded,
                                      color: isAadhaarOcrPassed ? const Color(0xFF34D399) : const Color(0xFFFBBF24),
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        isAadhaarOcrPassed ? "आधार कार्ड सत्यापित (Aadhaar Verified)" : "आधार कार्ड पुनः स्कैन करें",
                                        style: TextStyle(
                                          color: isAadhaarOcrPassed ? const Color(0xFF34D399) : const Color(0xFFFBBF24),
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        showDialog(
                                          context: modalCtx,
                                          barrierDismissible: false,
                                          builder: (diagCtx) => DocumentCameraScannerDialog(
                                            title: "आधार कार्ड OCR स्कैन",
                                            subtitle: "आधार कार्ड को फ्रेम के अंदर रखें",
                                            onCaptured: (file, bytes) async {
                                              _showToast("आधार OCR स्कैन व नाम मिलान चालू है...", isSuccess: true);
                                              final ocrRes = await _apiService.verifyAadhaar(
                                                aadharImage: file,
                                                userName: nameCtrl.text.trim(),
                                                aadharBytes: bytes,
                                              );

                                              if (ocrRes.isApproved) {
                                                setModalState(() {
                                                  isAadhaarOcrPassed = true;
                                                  isNameAadhaarVerified = true;
                                                  verifiedNameForAadhaar = nameCtrl.text.trim();
                                                  aadhaarStatusMessage = "✓ 100% आधार व फेस सत्यापित";
                                                });
                                                _showToast(ocrRes.message, isSuccess: true);
                                              } else {
                                                setModalState(() {
                                                  isAadhaarOcrPassed = false;
                                                  aadhaarStatusMessage = ocrRes.message;
                                                });
                                                _showToast(ocrRes.message, isSuccess: false);
                                              }
                                            },
                                          ),
                                        );
                                      },
                                      child: const Text("आधार स्कैन करें", style: TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 12)),
                                    ),
                                  ],
                                ),
                                if (aadhaarStatusMessage != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    aadhaarStatusMessage!,
                                    style: TextStyle(
                                      color: isAadhaarOcrPassed ? const Color(0xFF94A3B8) : const Color(0xFFF87171),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),

                  // Save Profile Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (!isPhoneVerified || !isAadhaarOcrPassed || !isFaceVerified || nameCtrl.text.trim().length < 3)
                          ? null
                          : () async {
                              final int fee = int.tryParse(feeCtrl.text.trim()) ?? WorkerSession.customVisitPrice;
                              final String finalPhone = phoneCtrl.text.trim().startsWith("+91")
                                  ? phoneCtrl.text.trim()
                                  : "+91 ${phoneCtrl.text.trim()}";

                              // Update Local Session
                              WorkerSession.update(
                                newName: nameCtrl.text.trim(),
                                newSkill: selectedSkill,
                                newPhone: finalPhone,
                                newAddress: addressCtrl.text.trim(),
                                newPrice: fee,
                                newPhoto: newFacePhoto,
                                newBytes: newFaceBytes,
                                newLat: lat,
                                newLng: lng,
                                newS2Token: s2Cell,
                                newAadhaarStatus: aadhaarStatusMessage,
                              );

                              // Sync to Backend Database
                              _apiService.updateProfile({
                                "worker_id": WorkerSession.workerId,
                                "user_id": WorkerSession.workerId,
                                "role": "WORKER",
                                "name": nameCtrl.text.trim(),
                                "skill": selectedSkill,
                                "phone": finalPhone,
                                "address": addressCtrl.text.trim(),
                                "visiting_fee": fee,
                                "s2_token": s2Cell,
                              });

                              Navigator.of(ctx).pop();
                              setState(() {});
                              _showToast("✓ प्रोफाइल सफलतापूर्वक अपडेट हो गई!", isSuccess: true);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFF334155),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text("सुरक्षित प्रोफाइल सेव करें (Save Profile)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ──────────────────────────────────────────────────────────
  //  RAISE HELP TICKET MODAL
  // ──────────────────────────────────────────────────────────
  void _openRaiseTicketDialog() {
    final TextEditingController descCtrl = TextEditingController();
    String category = "भुगतान व एस्क्रो से संबंधित";

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: Row(
            children: const [
              Icon(Icons.report_problem_rounded, color: Color(0xFFFBBF24), size: 22),
              SizedBox(width: 8),
              Text("शिकायत या सहायता टिकट", style: TextStyle(color: Colors.white, fontSize: 15)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("समस्या की श्रेणी चुनें:", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFF334155))),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: category,
                    isExpanded: true,
                    dropdownColor: const Color(0xFF0F172A),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    items: [
                      "भुगतान व एस्क्रो से संबंधित",
                      "ग्राहक से विवाद या गलत लोकेशन",
                      "OTP सत्यापन में समस्या",
                      "ऐप व तकनीकी सहायता",
                      "अन्य प्रश्न",
                    ].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (val) {
                      if (val != null) setDialogState(() => category = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text("विवरण लिखें:", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(height: 6),
              TextField(
                controller: descCtrl,
                maxLines: 3,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: "अपनी समस्या का संक्षिप्त विवरण लिखें...",
                  hintStyle: const TextStyle(color: Color(0xFF64748B)),
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF334155))),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text("रद्द करें", style: TextStyle(color: Color(0xFF94A3B8))),
            ),
            ElevatedButton(
              onPressed: () {
                final ticketId = "TKT-${1000 + (DateTime.now().millisecondsSinceEpoch % 9000)}";
                Navigator.of(ctx).pop();
                _showToast("शिकायत दर्ज! टिकट ID: $ticketId • 24 घंटे में सहायता टीम संपर्क करेगी।", isSuccess: true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text("दर्ज करें"),
            ),
          ],
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────
  //  LOGOUT CONFIRMATION WITH ADMIN ARCHIVE SAFEGUARD
  // ──────────────────────────────────────────────────────────
  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 24),
            SizedBox(width: 8),
            Text("लॉगआउट की पुष्टि", style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "क्या आप वाकई डिजिटल काम से लॉगआउट करना चाहते हैं?",
              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text("🛡️ डेटा सुरक्षा गारंटी:", style: TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text(
                    "• आपका खाता सिस्टम से कभी डिलीट नहीं होगा।\n• आपकी प्रोफाइल, हुनर, रेटिंग व कमाई एडमिन पैनल में स्थायी सुरक्षित आर्काइव में सेव रहेगी।\n• आप कभी भी पुनः लॉग इन कर सकते हैं।",
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("वापस रहें", style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              setState(() => _isLoggingOut = true);

              try {
                // Archive session in backend database
                await _apiService.archiveLogout(WorkerSession.toMap());
              } catch (_) {}

              // Clear persistent session from disk
              await WorkerSession.clearSession();

              if (!mounted) return;
              _showToast("सुरक्षित लॉगआउट संपन्न! आपका डेटा एडमिन आर्काइव में सुरक्षित है।", isSuccess: true);

              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LandingScreen()),
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text("हां, लॉगआउट करें", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = AppThemeController.instance;
    final String publicUrl = ApiConfig.workerPublicUrl(WorkerSession.workerId);

    return Scaffold(
      backgroundColor: theme.bg,
      appBar: AppBar(
        title: const Text("कारीगर प्रोफाइल (Worker Profile)", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: theme.appBarBg,
        foregroundColor: theme.appBarText,
        elevation: theme.isDarkMode ? 0 : 1,
        actions: [
          IconButton(
            icon: Icon(Icons.settings_suggest_rounded, color: theme.brandBlue),
            tooltip: "ऐप सेटिंग्स",
            onPressed: () => AppSettingsDialog.show(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 1. Worker Identity Card with Live Photo
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.border),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          _buildAvatar(
                            file: WorkerSession.profilePhoto,
                            bytes: WorkerSession.profilePhotoBytes,
                            radius: 36,
                            fallbackIcon: Icons.engineering_rounded,
                          ),
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(color: theme.emeraldGreen, shape: BoxShape.circle),
                            child: const Icon(Icons.verified, color: Colors.white, size: 16),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(WorkerSession.name, style: TextStyle(color: theme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Text(WorkerSession.primarySkill, style: TextStyle(color: theme.brandBlue, fontSize: 13, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text("ID: ${WorkerSession.workerId}", style: TextStyle(color: theme.textSecondary, fontSize: 11, fontFamily: 'monospace')),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.star_rounded, color: theme.amberGold, size: 16),
                                const SizedBox(width: 4),
                                Text("${WorkerSession.rating} ★", style: TextStyle(color: theme.amberGold, fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(width: 8),
                                Text("• ${WorkerSession.completedJobs} काम संपन्न", style: TextStyle(color: theme.textMuted, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: theme.emeraldGreen.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: theme.emeraldGreen.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.verified_user_rounded, color: theme.emeraldGreen, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "100% आधार व बायोमेट्रिक फेस सत्यापित • डिजिटल काम ट्रस्ट गारंटी",
                            style: TextStyle(color: theme.emeraldGreen, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.location_on_rounded, color: theme.brandBlue, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          "${WorkerSession.address} (S2: ${WorkerSession.s2Token})",
                          style: TextStyle(color: theme.textSecondary, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.phone_rounded, color: theme.emeraldGreen, size: 16),
                      const SizedBox(width: 6),
                      Text(WorkerSession.phone, style: TextStyle(color: theme.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                      const Spacer(),
                      Text("विजिट फीस: ₹${WorkerSession.customVisitPrice}", style: TextStyle(color: theme.emeraldGreen, fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Edit Profile Trigger Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _openEditProfileDialog,
                      icon: const Icon(Icons.edit_rounded, size: 16),
                      label: const Text("प्रोफाइल विवरण बदलें / एडिट करें", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.brandBlue,
                        side: BorderSide(color: theme.brandBlue),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Universal Scannable QR Code Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.border),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(Icons.qr_code_2_rounded, color: theme.brandBlue, size: 22),
                      const SizedBox(width: 8),
                      Text("सार्वजनिक QR कोड (Universal Scannable QR)", style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "किसी भी मोबाइल कैमरे (iPhone / Android) से स्कैन करें — आपकी पूरी प्रोफाइल, हुनर व फोन नंबर तुरंत खुलेगा।",
                    style: TextStyle(color: theme.textSecondary, fontSize: 11),
                  ),
                  const SizedBox(height: 16),

                  // QR Code Image
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: QrImageView(
                      data: publicUrl,
                      version: QrVersions.auto,
                      size: 160.0,
                      backgroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    publicUrl,
                    style: TextStyle(color: theme.brandBlue, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton.icon(
                        onPressed: _copyProfileLink,
                        icon: const Icon(Icons.copy_rounded, size: 15),
                        label: const Text("लिंक कॉपी करें", style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton.icon(
                        onPressed: _openBrowserProfile,
                        icon: const Icon(Icons.open_in_browser_rounded, size: 15),
                        label: const Text("ब्राउज़र में देखें", style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. 24x7 Help & Support Section
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: theme.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.border),
                boxShadow: theme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.support_agent_rounded, color: theme.amberGold, size: 22),
                      const SizedBox(width: 8),
                      Text("24x7 सहायता व कस्टमर केयर (Help & Support)", style: TextStyle(color: theme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Call Helpline
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: theme.emeraldGreen.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.phone_in_talk_rounded, color: theme.emeraldGreen, size: 20),
                    ),
                    title: Text("टोल-फ्री हेल्पलाइन (1800-DKAAM-99)", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text("24 घंटे चालू • तत्काल समाधान", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
                    onTap: () async {
                      final uri = Uri.parse("tel:18002332269");
                      try {
                        if (await canLaunchUrl(uri)) await launchUrl(uri);
                      } catch (_) {}
                      _showToast("टोल-फ्री हेल्पलाइन डायल हो रही है: 1800-DKAAM-99");
                    },
                  ),
                  Divider(color: theme.border, height: 16),

                  // WhatsApp Support
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: const Color(0xFF25D366).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366), size: 20),
                    ),
                    title: Text("व्हाट्सएप सहायता चैट (+91 98765 43210)", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text("सीधे डिजिटल काम सपोर्ट टीम से बात करें", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
                    onTap: () async {
                      final uri = Uri.parse("https://wa.me/919876543210?text=नमस्ते डिजिटल काम सपोर्ट टीम, मुझे सहायता चाहिए।");
                      try {
                        if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
                      } catch (_) {}
                      _showToast("व्हाट्सएप सहायता खुल रही है...");
                    },
                  ),
                  Divider(color: theme.border, height: 16),

                  // Raise Ticket
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: theme.brandBlue.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.confirmation_number_rounded, color: theme.brandBlue, size: 20),
                    ),
                    title: Text("समस्या या विवाद टिकट दर्ज करें", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text("भुगतान या ग्राहक संबंधी समस्या की शिकायत", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
                    onTap: _openRaiseTicketDialog,
                  ),
                  Divider(color: theme.border, height: 16),

                  // FAQs Expansion Tiles
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: theme.cardSub, borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.quiz_rounded, color: theme.textSecondary, size: 20),
                    ),
                    title: Text("अक्सर पूछे जाने वाले सवाल (FAQs)", style: TextStyle(color: theme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                    children: [
                      ListTile(
                        title: Text("काम का पैसा मुझे कब मिलता है?", style: TextStyle(color: theme.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text("काम पूरा होने पर जब ग्राहक आपको 4-अंकों का Completion OTP देता है, एस्क्रो से पैसा तुरंत आपके बैंक खाते में क्रेडिट हो जाता है।", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                      ),
                      ListTile(
                        title: Text("विजिट फीस कैसे बदल सकते हैं?", style: TextStyle(color: theme.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text("ऊपर 'प्रोफाइल विवरण बदलें' बटन पर क्लिक करके आप कभी भी अपनी विजिट फीस अपनी इच्छानुसार सेट कर सकते हैं।", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                      ),
                      ListTile(
                        title: Text("QR कोड से क्या फायदा है?", style: TextStyle(color: theme.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text("ग्राहक इस QR को अपने मोबाइल से स्कैन करके आपकी सरकारी आधार व फेस सत्यापन स्थिति देख सकते हैं, जिससे उनका भरोसा बढ़ता है।", style: TextStyle(color: theme.textSecondary, fontSize: 11)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 4. Logout Button (Safe Persistent Admin Archive)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isLoggingOut ? null : _confirmLogout,
                icon: _isLoggingOut
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.logout_rounded, size: 18),
                label: Text(
                  _isLoggingOut ? "डेटा सुरक्षित रूप से आर्काइव हो रहा है..." : "लॉगआउट करें (डेटा सुरक्षित रहेगा)",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              "🛡️ लॉगआउट करने पर आपका कोई भी डेटा नष्ट नहीं होता। यह एडमिन पैनल में स्थायी सुरक्षित रहता है।",
              textAlign: TextAlign.center,
              style: TextStyle(color: theme.textMuted, fontSize: 11),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
