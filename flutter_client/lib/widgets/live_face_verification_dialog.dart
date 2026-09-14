import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import '../services/api_service.dart';

class LiveFaceVerificationDialog extends StatefulWidget {
  final File? uploadedProfilePhoto;
  final Function(File snapshotFile, FaceVerificationResult result) onVerificationComplete;

  const LiveFaceVerificationDialog({
    Key? key,
    this.uploadedProfilePhoto,
    required this.onVerificationComplete,
  }) : super(key: key);

  @override
  State<LiveFaceVerificationDialog> createState() => _LiveFaceVerificationDialogState();
}

class _LiveFaceVerificationDialogState extends State<LiveFaceVerificationDialog> with SingleTickerProviderStateMixin {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  bool _isSimulatedCameraMode = false;
  bool _isProcessing = false;
  String? _errorMessage;
  Uint8List? _lastSnapshotBytes;

  late AnimationController _scanAnimController;
  late Animation<double> _scanLineAnimation;

  @override
  void initState() {
    super.initState();
    _scanAnimController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _scanLineAnimation = Tween<double>(begin: 0.15, end: 0.85).animate(
      CurvedAnimation(parent: _scanAnimController, curve: Curves.easeInOut),
    );

    _checkPermissionAndInitCamera();
  }

  Future<void> _checkPermissionAndInitCamera() async {
    try {
      final bool isWindows = !kIsWeb && defaultTargetPlatform == TargetPlatform.windows;
      final bool isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

      // 1. Permission check (Safe on Web & Windows)
      if (!isWindows && !kIsWeb) {
        final status = await Permission.camera.request();
        if (status.isDenied || status.isPermanentlyDenied) {
          setState(() {
            _isSimulatedCameraMode = true;
            _errorMessage = "कैमरा अनुमति नहीं मिली • टेस्टिंग सिम्युलेटर मोड सक्रिय";
          });
          return;
        }
      }

      // 2. Fetch available cameras
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        setState(() {
          _isSimulatedCameraMode = true; // No physical webcam found
        });
        return;
      }

      // Select front-facing camera or desktop webcam
      final selectedCamera = _cameras!.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras!.firstWhere(
          (cam) => cam.name.toLowerCase().contains('camera') ||
                   cam.name.toLowerCase().contains('webcam') ||
                   cam.name.toLowerCase().contains('truevision'),
          orElse: () => _cameras!.first,
        ),
      );

      // 3. Initialize CameraController
      _controller = CameraController(
        selectedCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: isAndroid ? ImageFormatGroup.jpeg : null,
      );

      await _controller!.initialize();
      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
        _isSimulatedCameraMode = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSimulatedCameraMode = true; // Gracefully switch to simulated camera if hardware fails
      });
    }
  }

  @override
  void dispose() {
    _scanAnimController.dispose();
    _controller?.dispose();
    super.dispose();
  }

  Future<File> _generateSimulatedFaceSnapshot() async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, 320, 320));

    // Background
    final paintBg = Paint()..color = const Color(0xFF0F172A);
    canvas.drawRect(const Rect.fromLTWH(0, 0, 320, 320), paintBg);

    // Face oval
    final paintSkin = Paint()..color = const Color(0xFFFDBA74);
    canvas.drawOval(const Rect.fromLTWH(80, 50, 160, 200), paintSkin);

    // Eyes
    final paintFeatures = Paint()..color = const Color(0xFF1E293B);
    canvas.drawCircle(const Offset(125, 120), 10, paintFeatures);
    canvas.drawCircle(const Offset(195, 120), 10, paintFeatures);

    // Smile
    final paintSmile = Paint()
      ..color = const Color(0xFFEA580C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;
    canvas.drawArc(const Rect.fromLTWH(120, 160, 80, 50), 0.2, 2.7, false, paintSmile);

    final picture = recorder.endRecording();
    final img = await picture.toImage(320, 320);
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
    _lastSnapshotBytes = byteData?.buffer.asUint8List();

    if (kIsWeb) {
      return File('simulated_face_live.png');
    } else {
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/live_face_snapshot_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(_lastSnapshotBytes ?? Uint8List(0));
      return file;
    }
  }

  Future<void> _captureAndVerify() async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      File snapshotFile;

      if (_isSimulatedCameraMode || _controller == null || !_controller!.value.isInitialized) {
        // Laptop has no webcam hardware: generate simulated clean frame
        snapshotFile = await _generateSimulatedFaceSnapshot();
      } else {
        // Real hardware camera capture
        final XFile rawImage = await _controller!.takePicture();
        _lastSnapshotBytes = await rawImage.readAsBytes();
        if (kIsWeb) {
          snapshotFile = File(rawImage.path);
        } else {
          final tempDir = await getTemporaryDirectory();
          final String snapshotPath =
              '${tempDir.path}/live_face_snapshot_${DateTime.now().millisecondsSinceEpoch}.jpg';
          snapshotFile = await File(rawImage.path).copy(snapshotPath);
        }
      }

      // Call Python FastAPI backend
      FaceVerificationResult result;
      if (widget.uploadedProfilePhoto != null) {
        result = await ApiService().verifyFace(
          uploadedPhoto: widget.uploadedProfilePhoto!,
          liveSnapshot: snapshotFile,
          liveBytes: _lastSnapshotBytes,
          isSimulated: _isSimulatedCameraMode,
        );
      } else {
        result = await ApiService().verifyLiveFace(
          liveSnapshot: snapshotFile,
          liveBytes: _lastSnapshotBytes,
          isSimulated: _isSimulatedCameraMode,
        );
      }

      if (!mounted) return;

      if (result.isSuccess && result.match && result.faceDetected) {
        widget.onVerificationComplete(snapshotFile, result);
        Navigator.of(context).pop();
      } else {
        setState(() {
          _isProcessing = false;
          _errorMessage = result.message.isNotEmpty
              ? result.message
              : "कैमरा फ्रेम में कोई चेहरा नहीं मिला। कृपया अपने चेहरे को दिए गए ओवल गाइड के अंदर रखें।";
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isProcessing = false;
        _errorMessage = "सत्यापन त्रुटि: $e";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 440),
        padding: const EdgeInsets.all(18),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.face_retouching_natural, color: Color(0xFF4F46E5), size: 22),
                      SizedBox(width: 8),
                      Text(
                        "लाइव फेस सत्यापन",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                ],
              ),
              const SizedBox(height: 2),
              const Text(
                "चेहरे को सामने रखें और ओवल (अंडाकार) गाइड के अंदर संरेखित करें।",
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 14),

              // Camera Preview or Simulated Radar Scanner
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 270,
                  color: Colors.black,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // 1. Real Hardware Camera
                      if (_isCameraInitialized && _controller != null)
                        SizedBox.expand(
                          child: FittedBox(
                            fit: BoxFit.cover,
                            child: SizedBox(
                              width: (!kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS))
                                  ? (_controller!.value.previewSize?.height ?? 320)
                                  : (_controller!.value.previewSize?.width ?? 320),
                              height: (!kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS))
                                  ? (_controller!.value.previewSize?.width ?? 240)
                                  : (_controller!.value.previewSize?.height ?? 240),
                              child: CameraPreview(_controller!),
                            ),
                          ),
                        )
                      // 2. Simulated Camera when Laptop has no webcam
                      else
                        Container(
                          color: const Color(0xFF090D16),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 100,
                                  height: 100,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E293B),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: const Color(0xFF38BDF8), width: 2),
                                  ),
                                  child: const Icon(Icons.person_rounded, size: 60, color: Color(0xFF94A3B8)),
                                ),
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E3A8A),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    "वेबकैम हार्डवेयर रहित पीसी / सिम्युलेटर मोड",
                                    style: TextStyle(color: Color(0xFF7DD3FC), fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Animated Laser Scan Line
                      AnimatedBuilder(
                        animation: _scanLineAnimation,
                        builder: (context, child) {
                          return Positioned(
                            top: 270 * _scanLineAnimation.value,
                            left: 40,
                            right: 40,
                            child: Container(
                              height: 2,
                              decoration: BoxDecoration(
                                color: const Color(0xFF38BDF8),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF38BDF8).withOpacity(0.8),
                                    blurRadius: 8,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                      // Centered Oval Mask Overlay (Visual Guide)
                      Positioned.fill(
                        child: CustomPaint(
                          painter: OvalMaskOverlayPainter(),
                        ),
                      ),

                      // Guidance pill
                      Positioned(
                        bottom: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.75),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Text(
                            _isSimulatedCameraMode ? "सिम्युलेटर: ओवल में चेहरा संरेखित है" : "ओवल में चेहरा रखें",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),

                      // Processing Overlay
                      if (_isProcessing)
                        Container(
                          color: Colors.black.withOpacity(0.75),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                SpinKitFadingCube(color: Color(0xFF38BDF8), size: 32),
                                SizedBox(height: 14),
                                Text(
                                  "बायोमेट्रिक फेशियल एनालिसिस...",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              // Status message
              if (_errorMessage != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Color(0xFF92400E), fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 14),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isProcessing ? null : () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text("रद्द करें"),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: !_isProcessing ? _captureAndVerify : null,
                      icon: const Icon(Icons.camera_alt_rounded, size: 18),
                      label: Text(_isSimulatedCameraMode ? "फेस स्कैन व सत्यापित करें" : "कैप्चर व सत्यापित करें"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
}

/// CustomPainter that dims the area outside the centered oval guide
class OvalMaskOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Rect fullRect = Rect.fromLTWH(0, 0, size.width, size.height);

    // Oval Guide Dimensions centered inside preview
    final double ovalWidth = size.width * 0.65;
    final double ovalHeight = size.height * 0.72;
    final Rect ovalRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2),
      width: ovalWidth,
      height: ovalHeight,
    );

    // Dark semi-transparent background outside the oval
    final Path backgroundPath = Path()..addRect(fullRect);
    final Path ovalPath = Path()..addOval(ovalRect);
    final Path overlayPath = Path.combine(PathOperation.difference, backgroundPath, ovalPath);

    final Paint overlayPaint = Paint()
      ..color = Colors.black.withOpacity(0.55)
      ..style = PaintingStyle.fill;

    canvas.drawPath(overlayPath, overlayPaint);

    // Cyan Neon Border for the Oval Guide
    final Paint borderPaint = Paint()
      ..color = const Color(0xFF38BDF8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    canvas.drawOval(ovalRect, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
