import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConfig {
  /// User-configurable Local LAN IP address for debugging on physical Android/iOS devices
  /// Example: "192.168.1.15" or "192.168.0.101"
  static String physicalDeviceLanIp = "192.168.1.100";

  /// Server Port
  static const int port = 8000;

  /// Production Deployed Cloud Backend
  static const String cloudBackendUrl = "https://digital-kaam-bakend.onrender.com";

  /// Smart cross-platform base URL resolver
  static String get baseUrl {
    if (kIsWeb) {
      return "https://digital-kaam-bakend.onrender.com";
    }

    if (Platform.isAndroid || Platform.isIOS) {
      // Direct live cloud backend access anywhere via 4G/5G/WiFi
      return cloudBackendUrl;
    }

    if (Platform.isMacOS || Platform.isWindows || Platform.isLinux) {
      return cloudBackendUrl;
    }

    return cloudBackendUrl;
  }

  // Endpoints
  static String get verifyLiveFaceUrl => "$baseUrl/api/verify-live-face";
  static String get verifyFaceUrl => "$baseUrl/api/verify-face";
  static String get verifyAadhaarUrl => "$baseUrl/api/verify-aadhar";
  static String get healthUrl => "$baseUrl/health";
  static String get logoutUrl => "$baseUrl/api/user/logout";
  static String get updateProfileUrl => "$baseUrl/api/user/update-profile";
  static String get sendOtpUrl => "$baseUrl/api/auth/send-registration-otp";

  /// Local network LAN IP for scannable QR Code that any phone can open
  static String get lanHost => "10.72.72.227";
  static String get publicProfileBaseUrl => "http://$lanHost:$port";
  static String workerPublicUrl(String workerId) => "http://$lanHost:$port/w/$workerId";
  static String customerPublicUrl(String customerId) => "http://$lanHost:$port/c/$customerId";
}
