import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

class DocumentCameraScannerDialog extends StatefulWidget {
  final String title;
  final String subtitle;
  final Function(File capturedFile, Uint8List capturedBytes) onCaptured;

  const DocumentCameraScannerDialog({
    super.key,
    this.title = "आधार कार्ड लाइव कैमरा स्कैनर",
    this.subtitle = "आधार कार्ड को आयताकार गाइड के अंदर सीधा रखें और स्पष्ट फोटो खींचें",
    required this.onCaptured,
  });

  @override
  State<DocumentCameraScannerDialog> createState() => _DocumentCameraScannerDialogState();
}

class _DocumentCameraScannerDialogState extends State<DocumentCameraScannerDialog>
    with SingleTickerProviderStateMixin {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  bool _isCapturing = false;
  String? _errorMessage;

  XFile? _capturedImage;
  Uint8List? _capturedBytes;

  late AnimationController _animController;
  late Animation<double> _scanLineAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _scanLineAnimation = Tween<double>(begin: 0.1, end: 0.9).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        if (!mounted) return;
        setState(() {
          _errorMessage = "कोई कैमरा डिवाइस नहीं मिला। कृपया वेबकैम कनेक्ट करें या गैलरी विकल्प चुनें।";
        });
        return;
      }

      // Choose back/world-facing or first available webcam
      CameraDescription selectedCam = _cameras!.first;
      for (final cam in _cameras!) {
        if (cam.lensDirection == CameraLensDirection.back ||
            cam.name.toLowerCase().contains('webcam') ||
            cam.name.toLowerCase().contains('camera') ||
            cam.name.toLowerCase().contains('truevision')) {
          selectedCam = cam;
          break;
        }
      }

      _controller = CameraController(
        selectedCam,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _controller!.initialize();
      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = "कैमरा खोलने में असमर्थ ($e)। कृपया डिवाइस अनुमतियां जांचें।";
      });
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _takeSnapshot() async {
    if (_controller == null || !_controller!.value.isInitialized || _isCapturing) return;

    setState(() {
      _isCapturing = true;
    });

    try {
      final XFile image = await _controller!.takePicture();
      final Uint8List bytes = await image.readAsBytes();

      if (!mounted) return;
      setState(() {
        _capturedImage = image;
        _capturedBytes = bytes;
        _isCapturing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = "फोटो खींचने में समस्या: $e";
        _isCapturing = false;
      });
    }
  }

  Future<void> _confirmAndUsePhoto() async {
    if (_capturedImage == null || _capturedBytes == null) return;

    File finalFile;
    if (kIsWeb) {
      finalFile = File(_capturedImage!.path);
    } else {
      final tempDir = await getTemporaryDirectory();
      final String targetPath =
          '${tempDir.path}/aadhaar_cam_${DateTime.now().millisecondsSinceEpoch}.jpg';
      finalFile = await File(_capturedImage!.path).copy(targetPath);
    }

    widget.onCaptured(finalFile, _capturedBytes!);
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  void _retakePhoto() {
    setState(() {
      _capturedImage = null;
      _capturedBytes = null;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF0F172A),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFF334155), width: 1.5),
      ),
      child: Container(
        width: 600,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0284C7).withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.document_scanner_rounded, color: Color(0xFF38BDF8), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        widget.subtitle,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Camera Viewfinder or Captured Preview
            Container(
              height: 320,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF0284C7), width: 2),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // 1. Live Feed or Captured Preview
                  if (_capturedBytes != null)
                    Image.memory(_capturedBytes!, fit: BoxFit.contain)
                  else if (_isCameraInitialized && _controller != null)
                    CameraPreview(_controller!)
                  else if (_errorMessage != null)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.videocam_off_rounded, color: Color(0xFFF87171), size: 48),
                            const SizedBox(height: 12),
                            Text(
                              _errorMessage!,
                              style: const TextStyle(color: Color(0xFFF87171), fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SpinKitFadingCube(color: Color(0xFF38BDF8), size: 36),
                          SizedBox(height: 16),
                          Text(
                            "डेस्कटॉप कैमरा प्रारंभ हो रहा है...",
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          ),
                        ],
                      ),
                    ),

                  // 2. Rectangular Aadhaar Card Guide Frame (when live)
                  if (_capturedBytes == null && _isCameraInitialized)
                    LayoutBuilder(
                      builder: (ctx, constraints) {
                        return Stack(
                          children: [
                            // Shaded outer borders with clear center card
                            Center(
                              child: Container(
                                width: constraints.maxWidth * 0.85,
                                height: constraints.maxHeight * 0.75,
                                decoration: BoxDecoration(
                                  border: Border.all(color: const Color(0xFF38BDF8), width: 2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),

                            // Corner accents
                            Center(
                              child: SizedBox(
                                width: constraints.maxWidth * 0.85,
                                height: constraints.maxHeight * 0.75,
                                child: Stack(
                                  children: [
                                    // Top-left
                                    Positioned(
                                      top: 0,
                                      left: 0,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: const BoxDecoration(
                                          border: Border(
                                            top: BorderSide(color: Color(0xFF10B981), width: 4),
                                            left: BorderSide(color: Color(0xFF10B981), width: 4),
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Top-right
                                    Positioned(
                                      top: 0,
                                      right: 0,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: const BoxDecoration(
                                          border: Border(
                                            top: BorderSide(color: Color(0xFF10B981), width: 4),
                                            right: BorderSide(color: Color(0xFF10B981), width: 4),
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Bottom-left
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: const BoxDecoration(
                                          border: Border(
                                            bottom: BorderSide(color: Color(0xFF10B981), width: 4),
                                            left: BorderSide(color: Color(0xFF10B981), width: 4),
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Bottom-right
                                    Positioned(
                                      bottom: 0,
                                      right: 0,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: const BoxDecoration(
                                          border: Border(
                                            bottom: BorderSide(color: Color(0xFF10B981), width: 4),
                                            right: BorderSide(color: Color(0xFF10B981), width: 4),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Laser scan animation line
                            AnimatedBuilder(
                              animation: _scanLineAnimation,
                              builder: (ctx, child) {
                                return Positioned(
                                  top: constraints.maxHeight * _scanLineAnimation.value,
                                  left: constraints.maxWidth * 0.08,
                                  right: constraints.maxWidth * 0.08,
                                  child: Container(
                                    height: 2.5,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF38BDF8),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF38BDF8).withValues(alpha: 0.8),
                                          blurRadius: 10,
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),

                            // Guide text
                            Positioned(
                              bottom: 12,
                              left: 0,
                              right: 0,
                              child: Center(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.7),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Text(
                                    "कार्ड का नाम और आधार नंबर फ्रेम में सीधा रखें",
                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Controls
            if (_capturedBytes != null) ...[
              // Confirm or Retake row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF64748B)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 18),
                      label: const Text("फिर से खींचें", style: TextStyle(color: Colors.white)),
                      onPressed: _retakePhoto,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0284C7),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.check_circle_rounded, size: 20),
                      label: const Text(
                        "पुष्टि करें व OCR स्कैन करें",
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      onPressed: _confirmAndUsePhoto,
                    ),
                  ),
                ],
              ),
            ] else ...[
              // Capture button row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF475569)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text("रद्द करें", style: TextStyle(color: Color(0xFF94A3B8))),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isCameraInitialized ? const Color(0xFF10B981) : const Color(0xFF334155),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: _isCapturing
                          ? const SpinKitThreeBounce(color: Colors.white, size: 16)
                          : const Icon(Icons.camera_alt_rounded, size: 20),
                      label: Text(
                        _isCapturing ? "कैप्चर हो रहा है..." : "आधार फोटो खींचें (Capture)",
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      onPressed: _isCameraInitialized && !_isCapturing ? _takeSnapshot : null,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
