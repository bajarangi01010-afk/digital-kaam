import 'dart:io';
import 'dart:typed_data';

class WorkerSession {
  static String name = "annu kumar";
  static String primarySkill = "इलेक्ट्रीशियन (Electrician)";
  static String phone = "+91 98765 43210";
  static String address = "सेक्टर 18, ब्लॉक B, नोएडा";
  static File? profilePhoto;
  static Uint8List? profilePhotoBytes;
  static String workerId = "DK-VERIFIED-9842";
  static String aadhaarStatus = "✓ 100% आधार बायोमेट्रिक व लाइव फेस सत्यापित";
  static double rating = 4.9;
  static int completedJobs = 14;
  static int customVisitPrice = 350;
  static bool isBookingEnabled = true;
  static double lat = 25.6090;
  static double lng = 85.1343;
  static String s2Token = "39ed5843";

  static void update({
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
  }) {
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
  }

  static void setSessionData({
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
  }) {
    update(
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
    );
  }

  static Map<String, dynamic> toMap() {
    return {
      "worker_id": workerId,
      "user_id": workerId,
      "role": "WORKER",
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
    };
  }
}
