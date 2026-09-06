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

  static void update({
    String? newName,
    String? newSkill,
    String? newPhone,
    String? newAddress,
    File? newPhoto,
    Uint8List? newBytes,
    int? newPrice,
    bool? newBookingEnabled,
  }) {
    if (newName != null && newName.isNotEmpty) name = newName;
    if (newSkill != null && newSkill.isNotEmpty) primarySkill = newSkill;
    if (newPhone != null && newPhone.isNotEmpty) phone = newPhone;
    if (newAddress != null && newAddress.isNotEmpty) address = newAddress;
    if (newPhoto != null) profilePhoto = newPhoto;
    if (newBytes != null && newBytes.isNotEmpty) profilePhotoBytes = newBytes;
    if (newPrice != null) customVisitPrice = newPrice;
    if (newBookingEnabled != null) isBookingEnabled = newBookingEnabled;
  }
}
