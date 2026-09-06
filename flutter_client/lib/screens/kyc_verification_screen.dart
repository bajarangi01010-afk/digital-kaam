import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import '../services/api_service.dart';
import '../widgets/live_face_verification_dialog.dart';
import '../widgets/safe_image.dart';

enum UserKycRole { worker, customer }

class KycVerificationScreen extends StatefulWidget {
  final UserKycRole role;

  const KycVerificationScreen({
    Key? key,
    this.role = UserKycRole.worker,
  }) : super(key: key);

  @override
  State<KycVerificationScreen> createState() => _KycVerificationScreenState();
}

class _KycVerificationScreenState extends State<KycVerificationScreen> {
  final TextEditingController _nameController = TextEditingController(text: "राम कुमार (Ram Kumar)");
  final ImagePicker _picker = ImagePicker();

  // Aadhaar OCR State
  File? _aadhaarImage;
  bool _isOcrScanning = false;
  AadhaarOcrResult? _ocrResult;
  bool get _isAadhaarApproved => _ocrResult?.isApproved ?? false;

  // Profile Photo & Biometric Face Verification State
  File? _uploadedProfilePhoto;
  File? _verifiedLiveSnapshot;
  FaceVerificationResult? _faceResult;
  bool get _isFaceVerified => _faceResult?.match ?? false;

  // Final Form State Lock: Must have valid name + Aadhaar score >= 85% + Biometric face match
  bool get _isKycReadyToSubmit {
    final hasValidName = _nameController.text.trim().length >= 3;
    return hasValidName && _isAadhaarApproved && _isFaceVerified;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  // 1. Pick Aadhaar Image and Trigger EasyOCR & Fuzzy Matching
  Future<void> _pickAndVerifyAadhaar() async {
    final String currentName = _nameController.text.trim();
    if (currentName.isEmpty) {
      _showSnackbar("कृपया पहले अपना पूरा नाम दर्ज करें", isError: true);
      return;
    }

    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1600,
        maxHeight: 1200,
        imageQuality: 90,
      );

      if (pickedFile == null) return;

      final File file = File(pickedFile.path);
      setState(() {
        _aadhaarImage = file;
        _isOcrScanning = true;
        _ocrResult = null;
      });

      // Call Python FastAPI /api/verify-aadhar
      final result = await ApiService().verifyAadhaar(
        aadharImage: file,
        userName: currentName,
      );

      if (!mounted) return;

      setState(() {
        _isOcrScanning = false;
        _ocrResult = result;
      });

      if (result.isApproved) {
        _showSnackbar("आधार नाम सत्यापित (स्कोर: ${result.score}% ≥ 85%)", isError: false);
      } else {
        _showSnackbar(result.message, isError: true);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isOcrScanning = false;
      });
      _showSnackbar("आधार अपलोड त्रुटि: $e", isError: true);
    }
  }

  // 2. Pick Profile Photo & Intercept with Mandatory Live Face Popup
  Future<void> _pickProfilePhotoAndVerifyFace() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      final File profileFile = File(pickedFile.path);
      setState(() {
        _uploadedProfilePhoto = profileFile;
      });

      // Open Cross-Platform Live Face Verification Dialog
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => LiveFaceVerificationDialog(
          uploadedProfilePhoto: profileFile,
          onVerificationComplete: (snapshot, result) {
            setState(() {
              _verifiedLiveSnapshot = snapshot;
              _faceResult = result;
            });
            _showSnackbar("बायोमेट्रिक लाइव फेस 100% सत्यापित!", isError: false);
          },
        ),
      );
    } catch (e) {
      _showSnackbar("फोटो पिकर त्रुटि: $e", isError: true);
    }
  }

  void _showSnackbar(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? const Color(0xFFE11D48) : const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _handleFinalSubmit() {
    if (!_isKycReadyToSubmit) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.verified_user_rounded, color: Color(0xFF059669)),
            SizedBox(width: 8),
            Text("KYC सफलतापूर्वक स्वीकृत", style: TextStyle(fontSize: 16)),
          ],
        ),
        content: Text(
          "बधाई हो ${_nameController.text}! आपका आधार कार्ड और लाइव बायोमेट्रिक चेहरा दोनों सुरक्षित रूप से सत्यापित हो चुके हैं।",
          style: const TextStyle(fontSize: 13),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
            child: const Text("डैशबोर्ड पर जाएं", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isWorker = widget.role == UserKycRole.worker;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          isWorker ? "कारीगर अनिवार्य KYC (Worker)" : "ग्राहक अनिवार्य KYC (Customer)",
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0.5,
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFC7D2FE)),
            ),
            child: const Text(
              "Dual-Trust KYC",
              style: TextStyle(
                color: Color(0xFF4338CA),
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 580),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 20,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Badge & Heading
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.shield_rounded, color: Color(0xFF4F46E5), size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            "पहचान व सुरक्षा सत्यापन (MANDATORY)",
                            style: TextStyle(
                              color: Color(0xFF4F46E5),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            "आधार OCR व लाइव फेस मैच",
                            style: TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 1. Full Name Input
                const Text(
                  "आधार कार्ड पर दर्ज पूरा नाम (Full Name) *",
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF334155),
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.person_outline, size: 20),
                    hintText: "उदा. राम कुमार",
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // 2. Aadhaar Card Upload & OCR Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.badge_outlined, color: Color(0xFF4F46E5), size: 18),
                              SizedBox(width: 6),
                              Text(
                                "आधार कार्ड अपलोड व OCR *",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                          if (_isAadhaarApproved)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.check_circle, color: Color(0xFF059669), size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    "मैच: ${_ocrResult!.score}% ✓",
                                    style: const TextStyle(
                                      color: Color(0xFF065F46),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Upload Button
                      ElevatedButton.icon(
                        onPressed: _isOcrScanning ? null : _pickAndVerifyAadhaar,
                        icon: _isOcrScanning
                            ? const SpinKitRing(color: Colors.white, size: 16, lineWidth: 2)
                            : const Icon(Icons.upload_file_rounded, size: 18),
                        label: Text(
                          _aadhaarImage != null ? "नया आधार कार्ड चुनें" : "आधार कार्ड फोटो अपलोड करें",
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF334155),
                          elevation: 0,
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),

                      // OCR Status Message
                      if (_isOcrScanning) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: const [
                            SpinKitThreeBounce(color: Color(0xFF4F46E5), size: 18),
                            SizedBox(width: 10),
                            Text(
                              "EasyOCR व FuzzyWuzzy नाम स्कैनिंग प्रगति पर...",
                              style: TextStyle(fontSize: 12, color: Color(0xFF4F46E5)),
                            ),
                          ],
                        ),
                      ] else if (_ocrResult != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _ocrResult!.isApproved
                                ? const Color(0xFFECFDF5)
                                : const Color(0xFFFFF1F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: _ocrResult!.isApproved
                                  ? const Color(0xFFA7F3D0)
                                  : const Color(0xFFFECDD3),
                            ),
                          ),
                          child: Text(
                            _ocrResult!.message,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: _ocrResult!.isApproved
                                  ? const Color(0xFF065F46)
                                  : const Color(0xFFBE123C),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 3. Mandatory Live Camera Face Verification Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.camera_enhance_rounded, color: Color(0xFF4F46E5), size: 18),
                              SizedBox(width: 6),
                              Text(
                                "अनिवार्य लाइव फेस डिटेक्शन *",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                          if (_isFaceVerified)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: const Text(
                                "फेस 100% सत्यापित ✓",
                                style: TextStyle(
                                  color: Color(0xFF065F46),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          // Photo Avatar preview
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: _isFaceVerified ? const Color(0xFF059669) : const Color(0xFFCBD5E1),
                                width: 2,
                              ),
                              image: (_verifiedLiveSnapshot ?? _uploadedProfilePhoto) != null
                                  ? DecorationImage(
                                      image: getSafeFileImageProvider((_verifiedLiveSnapshot ?? _uploadedProfilePhoto)!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: (_verifiedLiveSnapshot ?? _uploadedProfilePhoto) == null
                                ? const Icon(Icons.person, color: Color(0xFF94A3B8), size: 32)
                                : null,
                          ),
                          const SizedBox(width: 14),

                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ElevatedButton.icon(
                                  onPressed: _pickProfilePhotoAndVerifyFace,
                                  icon: const Icon(Icons.camera_alt, size: 16),
                                  label: Text(
                                    _isFaceVerified ? "दोबारा लाइव स्कैन करें" : "फोटो चुनें व लाइव फेस स्कैन करें",
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF4F46E5),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  "कैमरा परमिशन के साथ लाइव ओवल गाइड में फेस स्कैन होगा।",
                                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Submit Button (State Locked until Aadhaar OCR >= 85% and Face Verified)
                ElevatedButton(
                  onPressed: _isKycReadyToSubmit ? _handleFinalSubmit : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFFE2E8F0),
                    disabledForegroundColor: const Color(0xFF94A3B8),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: _isKycReadyToSubmit ? 4 : 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _isKycReadyToSubmit ? Icons.verified_rounded : Icons.lock_outline_rounded,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _isKycReadyToSubmit
                            ? "सत्यापित प्रोफाइल जमा करें"
                            : "आधार व फेस सत्यापन के बाद अनलॉक होगा",
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
