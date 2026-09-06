import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConfig {
  /// User-configurable Local LAN IP address for debugging on physical Android/iOS devices
  /// Example: "192.168.1.15" or "192.168.0.101"
  static String physicalDeviceLanIp = "192.168.1.100";

  /// Server Port
  static const int port = 8000;

  /// Smart cross-platform base URL resolver
  static String get baseUrl {
    if (kIsWeb) {
      return "http://localhost:$port";
    }

    if (Platform.isAndroid) {
      // If running on an Android emulator, 10.0.2.2 routes to the host machine
      // Set useEmulator to false when debugging on physical hardware over Wi-Fi
      const bool isEmulator = bool.fromEnvironment('IS_EMULATOR', defaultValue: true);
      if (isEmulator) {
        return "http://10.0.2.2:$port";
      } else {
        return "http://$physicalDeviceLanIp:$port";
      }
    }

    if (Platform.isMacOS || Platform.isWindows || Platform.isLinux) {
      return "http://127.0.0.1:$port";
    }

    if (Platform.isIOS) {
      return "http://localhost:$port";
    }

    return "http://127.0.0.1:$port";
  }

  // Endpoints
  static String get verifyLiveFaceUrl => "$baseUrl/api/verify-live-face";
  static String get verifyFaceUrl => "$baseUrl/api/verify-face";
  static String get verifyAadhaarUrl => "$baseUrl/api/verify-aadhar";
  static String get healthUrl => "$baseUrl/health";
}
