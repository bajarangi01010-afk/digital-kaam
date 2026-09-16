import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

class WorkerSession {
  // Session Identity & Role
  static bool isLoggedIn = false;
  static String role = "WORKER"; // "WORKER" or "CUSTOMER"

  // User Profile Attributes (Clean defaults - no hardcoded mock user)
  static String name = "";
  static String primarySkill = "";
  static String phone = "";
  static String address = "";
  static File? profilePhoto;
  static Uint8List? profilePhotoBytes;
  static String workerId = "";
  static String aadhaarStatus = "सत्यापन लंबित";
  static double rating = 5.0;
  static int completedJobs = 0;
  static int customVisitPrice = 199;
  static bool isBookingEnabled = true;
  static double lat = 28.6139;
  static double lng = 77.2090;
  static String s2Token = "";
  static String photoUrl = "";

  static void update({
    String? newRole,
    bool? newIsLoggedIn,
    String? newName,
    String? newSkill,
    String? newPhone,
    String? newAddress,
    File? newPhoto,
    Uint8List? newBytes,
    int? newPrice,
    bool? newBookingEnabled,
    double? newLat,
    double? newLng,
    String? newS2Token,
    String? newAadhaarStatus,
    String? newWorkerId,
    String? newPhotoUrl,
    double? newRating,
    int? newCompletedJobs,
  }) {
    if (newRole != null && newRole.isNotEmpty) role = newRole;
    if (newIsLoggedIn != null) isLoggedIn = newIsLoggedIn;
    if (newName != null && newName.isNotEmpty) name = newName;
    if (newSkill != null && newSkill.isNotEmpty) primarySkill = newSkill;
    if (newPhone != null && newPhone.isNotEmpty) phone = newPhone;
    if (newAddress != null && newAddress.isNotEmpty) address = newAddress;
    if (newPhoto != null) profilePhoto = newPhoto;
    if (newBytes != null && newBytes.isNotEmpty) profilePhotoBytes = newBytes;
    if (newPrice != null) customVisitPrice = newPrice;
    if (newBookingEnabled != null) isBookingEnabled = newBookingEnabled;
    if (newLat != null) lat = newLat;
    if (newLng != null) lng = newLng;
    if (newS2Token != null && newS2Token.isNotEmpty) s2Token = newS2Token;
    if (newAadhaarStatus != null && newAadhaarStatus.isNotEmpty) aadhaarStatus = newAadhaarStatus;
    if (newWorkerId != null && newWorkerId.isNotEmpty) workerId = newWorkerId;
    if (newPhotoUrl != null) photoUrl = newPhotoUrl;
    if (newRating != null) rating = newRating;
    if (newCompletedJobs != null) completedJobs = newCompletedJobs;
  }

  static void setSessionData({
    String? newRole,
    bool? newIsLoggedIn,
    String? newName,
    String? newSkill,
    String? newPhone,
    String? newAddress,
    File? newPhoto,
    Uint8List? newBytes,
    int? newPrice,
    bool? newBookingEnabled,
    double? newLat,
    double? newLng,
    String? newS2Token,
    String? newAadhaarStatus,
    String? newWorkerId,
  }) {
    update(
      newRole: newRole,
      newIsLoggedIn: newIsLoggedIn,
      newName: newName,
      newSkill: newSkill,
      newPhone: newPhone,
      newAddress: newAddress,
      newPhoto: newPhoto,
      newBytes: newBytes,
      newPrice: newPrice,
      newBookingEnabled: newBookingEnabled,
      newLat: newLat,
      newLng: newLng,
      newS2Token: newS2Token,
      newAadhaarStatus: newAadhaarStatus,
      newWorkerId: newWorkerId,
    );
  }

  // --- PERSISTENT STORAGE ENGINE (Survives device restart / app close) ---

  static Future<File> _getSessionFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/dk_user_session.json');
  }

  /// Saves the complete session to disk in JSON format
  static Future<void> saveToDisk({String? userRole}) async {
    try {
      if (userRole != null && userRole.isNotEmpty) {
        role = userRole;
      }
      isLoggedIn = true;
      final file = await _getSessionFile();

      // Encode bytes to base64 if photo file is memory-based
      String? photoBase64;
      if (profilePhotoBytes != null && profilePhotoBytes!.isNotEmpty) {
        photoBase64 = base64Encode(profilePhotoBytes!);
      }

      final data = {
        "isLoggedIn": true,
        "role": role,
        "name": name,
        "primarySkill": primarySkill,
        "phone": phone,
        "address": address,
        "workerId": workerId,
        "aadhaarStatus": aadhaarStatus,
        "rating": rating,
        "completedJobs": completedJobs,
        "customVisitPrice": customVisitPrice,
        "isBookingEnabled": isBookingEnabled,
        "lat": lat,
        "lng": lng,
        "s2Token": s2Token,
        "photoPath": profilePhoto?.path,
        "photoBase64": photoBase64,
        "photoUrl": photoUrl,
        "savedAt": DateTime.now().toIso8601String(),
      };

      await file.writeAsString(jsonEncode(data), flush: true);
      debugPrint("[WorkerSession] Saved session to disk: $role ($name)");
    } catch (e) {
      debugPrint("[WorkerSession] Error saving session to disk: $e");
    }
  }

  /// Loads saved session from disk. Returns true if active session exists.
  static Future<bool> loadFromDisk() async {
    try {
      final file = await _getSessionFile();
      if (!await file.exists()) {
        isLoggedIn = false;
        return false;
      }

      final raw = await file.readAsString();
      if (raw.trim().isEmpty) {
        isLoggedIn = false;
        return false;
      }

      final data = jsonDecode(raw) as Map<String, dynamic>;
      if (data["isLoggedIn"] == true) {
        isLoggedIn = true;
        role = data["role"] ?? "WORKER";
        name = data["name"] ?? name;
        primarySkill = data["primarySkill"] ?? primarySkill;
        phone = data["phone"] ?? phone;
        address = data["address"] ?? address;
        workerId = data["workerId"] ?? workerId;
        aadhaarStatus = data["aadhaarStatus"] ?? aadhaarStatus;
        rating = (data["rating"] as num?)?.toDouble() ?? rating;
        completedJobs = (data["completedJobs"] as num?)?.toInt() ?? completedJobs;
        customVisitPrice = (data["customVisitPrice"] as num?)?.toInt() ?? customVisitPrice;
        isBookingEnabled = data["isBookingEnabled"] ?? true;
        lat = (data["lat"] as num?)?.toDouble() ?? lat;
        lng = (data["lng"] as num?)?.toDouble() ?? lng;
        s2Token = data["s2Token"] ?? s2Token;
        photoUrl = data["photoUrl"] ?? photoUrl;

        // Restore photo from path or base64
        final path = data["photoPath"] as String?;
        if (path != null && path.isNotEmpty) {
          final f = File(path);
          if (await f.exists()) {
            profilePhoto = f;
            profilePhotoBytes = await f.readAsBytes();
          }
        }
        if (profilePhotoBytes == null && data["photoBase64"] != null) {
          try {
            profilePhotoBytes = base64Decode(data["photoBase64"]);
          } catch (_) {}
        }
        if (profilePhotoBytes == null && photoUrl.isNotEmpty && photoUrl.startsWith("data:image")) {
          try {
            final comma = photoUrl.indexOf(",");
            final rawB64 = comma != -1 ? photoUrl.substring(comma + 1) : photoUrl;
            profilePhotoBytes = base64Decode(rawB64);
          } catch (_) {}
        }

        debugPrint("[WorkerSession] Loaded active session from disk: $role ($name)");
        return true;
      }
    } catch (e) {
      debugPrint("[WorkerSession] Error loading session from disk: $e");
    }
    isLoggedIn = false;
    return false;
  }

  /// Clears session upon explicit user logout
  static Future<void> clearSession() async {
    try {
      isLoggedIn = false;
      role = "WORKER";
      name = "";
      primarySkill = "";
      phone = "";
      address = "";
      profilePhoto = null;
      profilePhotoBytes = null;
      photoUrl = "";
      workerId = "";
      aadhaarStatus = "सत्यापन लंबित";
      rating = 5.0;
      completedJobs = 0;
      customVisitPrice = 199;
      isBookingEnabled = true;
      lat = 28.6139;
      lng = 77.2090;
      s2Token = "";
      final file = await _getSessionFile();
      if (await file.exists()) {
        await file.delete();
      }
      debugPrint("[WorkerSession] Cleared persistent session from disk.");
    } catch (e) {
      debugPrint("[WorkerSession] Error clearing session from disk: $e");
    }
  }

  static Map<String, dynamic> toMap() {
    return {
      "worker_id": workerId,
      "user_id": workerId,
      "role": role,
      "name": name,
      "skill": primarySkill,
      "phone": phone,
      "address": address,
      "visiting_fee": customVisitPrice,
      "rating": rating,
      "total_jobs": completedJobs,
      "aadhaar_status": aadhaarStatus,
      "s2_token": s2Token,
      "lat": lat,
      "lng": lng,
      "photo_url": photoUrl,
    };
  }
}
