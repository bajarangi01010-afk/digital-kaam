import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

/// Telephony & Direct Call Bridge for Digital Kaam (Android & iOS)
class TelephonyService {
  /// Opens the native phone dialer with the worker or customer's phone number
  static Future<bool> makePhoneCall(String rawPhoneNumber) async {
    try {
      HapticFeedback.lightImpact();
      // Sanitize: strip spaces, dashes, parentheses
      final clean = rawPhoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
      final Uri uri = Uri.parse('tel:$clean');

      if (await canLaunchUrl(uri)) {
        return await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        // Fallback: copy to clipboard if dialer intent cannot be launched
        await Clipboard.setData(ClipboardData(text: clean));
        return false;
      }
    } catch (_) {
      return false;
    }
  }
}
