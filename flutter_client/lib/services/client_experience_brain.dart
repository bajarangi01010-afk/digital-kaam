import 'dart:io';
import 'package:flutter/foundation.dart';
import 'gps_location_service.dart';
import 'telephony_service.dart';
import 'api_service.dart';
import '../config/api_config.dart';

/// Brain 1: The Client Experience & Edge Intelligence Brain.
/// Handles edge face validation, real-time S2 proximity calculation,
/// intelligent calling/navigation triggers, and seamless backend handshake.
class ClientExperienceBrain {
  static final ClientExperienceBrain _instance = ClientExperienceBrain._internal();
  static ClientExperienceBrain get instance => _instance;

  ClientExperienceBrain._internal();

  final GpsLocationService _gpsService = GpsLocationService.instance;
  final ApiService _apiService = ApiService();

  /// Edge Geolocation & S2 Token Resolution:
  /// Acquires exact GPS coordinates and produces Google S2 Cell Token.
  Future<GpsLocationResult> acquireS2Location() async {
    return await _gpsService.getExactLocation();
  }

  /// STRICT RULE 1: Phone must be 10 digits before initiating call
  bool isValidIndianPhone(String phoneNumber) {
    final clean = phoneNumber.replaceAll(RegExp(r'[^0-9]'), '');
    return clean.length == 10 || (clean.length == 12 && clean.startsWith('91'));
  }

  /// Interactive One-Tap Customer Calling with Native Telephony Handshake
  Future<bool> initiateCustomerCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.trim().replaceAll(RegExp(r'\s+'), '');
    if (!isValidIndianPhone(cleanPhone)) return false;
    return await TelephonyService.makePhoneCall(cleanPhone);
  }

  /// Native Turn-by-Turn GPS Navigation Launcher
  Future<bool> launchNavigationRoute({
    required double destLat,
    required double destLng,
    String? destName,
  }) async {
    if (destLat == 0.0 || destLng == 0.0) return false;
    return await GpsLocationService.openNavigationMap(
      destLat: destLat,
      destLng: destLng,
      addressLabel: destName,
    );
  }

  /// STRICT RULE 2: Face Snapshot must physically exist and exceed 5KB before uploading
  Future<FaceVerificationResult> verifyWorkerBiometrics(File faceImage) async {
    if (!await faceImage.exists() || await faceImage.length() < 5120) {
      return FaceVerificationResult.error("अमान्य कैमरा स्नैपशॉट: कृपया लाइव कैमरा से साफ़ फोटो लें।");
    }
    return await _apiService.verifyLiveFace(liveSnapshot: faceImage);
  }

  /// STRICT RULE 3: Aadhaar image must exist and worker name cannot be empty
  Future<AadhaarOcrResult> verifyWorkerAadhaar(File docImage, String workerName) async {
    if (!await docImage.exists() || workerName.trim().isEmpty) {
      return AadhaarOcrResult.error("आधार कार्ड फोटो और कारीगर का नाम अनिवार्य है।");
    }
    return await _apiService.verifyAadhaar(aadharImage: docImage, userName: workerName.trim());
  }

  /// STRICT RULE 4: Progressive Lazy Asset Loading & Memory Constraint
  /// Decodes and downsamples camera snapshots to prevent Out-Of-Memory.
  Map<String, int> getOptimalImageMemoryBounds(double? renderWidth, double? renderHeight) {
    final w = renderWidth != null ? (renderWidth * 2).round().clamp(100, 800) : 600;
    final h = renderHeight != null ? (renderHeight * 2).round().clamp(100, 800) : 600;
    return {"cacheWidth": w, "cacheHeight": h};
  }

  /// STRICT RULE 5: Viewport Batching (Page size budget: 15 workers per chunk)
  int get maxLazyChunkPageSize => 15;

  /// Returns Client Experience Brain Status with Lazy Loading Metrics
  Map<String, dynamic> getBrainStatus() {
    return {
      "brain": "ClientExperienceBrain (Brain 1)",
      "edge_s2_active": true,
      "biometrics_ready": true,
      "telephony_ready": true,
      "lazy_loading_enabled": true,
      "cache_downsampling_active": true,
      "chunk_page_budget": maxLazyChunkPageSize,
      "backend_url": ApiConfig.baseUrl,
      "platform": kIsWeb
          ? "Web"
          : Platform.isAndroid
              ? "Android"
              : Platform.isWindows
                  ? "Windows Desktop"
                  : Platform.operatingSystem,
    };
  }
}
