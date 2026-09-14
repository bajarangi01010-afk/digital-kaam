class AppTranslations {
  static const Map<String, Map<String, String>> _values = {
    'hi': {
      'appName': 'डिजिटल काम',
      'slogan': 'काम आसान',
      'tagline': 'भारत का भरोसेमंद स्थानीय सेवा नेटवर्क',
      'workerTitle': 'कारीगर के रूप में जारी रखें',
      'workerSubtitle': 'अपना हुनर दिखाएं, आस-पास नए काम पाएं और सीधा भुगतान लें',
      'customerTitle': 'ग्राहक के रूप में जारी रखें',
      'customerSubtitle': 'भरोसेमंद और सत्यापित कारीगर खोजें, एस्क्रो सुरक्षा के साथ',
      'nearbyWorkers': 'पास के कारीगर (Radar)',
      'directCall': 'सीधा कॉल करें',
      'directCallLocked': '🔒 कॉल अनलॉक (बुकिंग आवश्यक)',
      'directBook': 'बुक करें (एस्क्रो सुरक्षित)',
      'locationOff': '📡 लोकेशन बंद है - आस-पास के काम देखने के लिए ऑन करें',
      'turnOnLocation': 'लोकेशन चालू करें',
      'bankDetailsRequired': '⚠️ कृपया पहले बैंक खाता दर्ज करें',
    },
    'en': {
      'appName': 'Digital Kaam',
      'slogan': 'Kaam Aasan',
      'tagline': "India's Trusted Local Services Network",
      'workerTitle': 'Continue as Worker',
      'workerSubtitle': 'Showcase your trade, get nearby gigs, and receive direct escrow payouts',
      'customerTitle': 'Continue as Customer',
      'customerSubtitle': 'Hire verified craftsmen with 100% escrow protection guarantee',
      'nearbyWorkers': 'Nearby Specialists (Radar)',
      'directCall': 'Direct Call',
      'directCallLocked': '🔒 Unlock Call (Book with Escrow)',
      'directBook': 'Book with Escrow',
      'locationOff': '📡 Location is OFF - Turn on to see nearby jobs',
      'turnOnLocation': 'Turn ON Location',
      'bankDetailsRequired': '⚠️ Bank Details Required for Direct Booking',
    },
    'hinglish': {
      'appName': 'Digital Kaam',
      'slogan': 'Kaam Aasan',
      'tagline': 'India ka Trusted Local Services Network',
      'workerTitle': 'Worker ke roop me shuru karein',
      'workerSubtitle': 'Apna hunar dikhayein, nearby kaam payein aur direct payment lein',
      'customerTitle': 'Customer ke roop me shuru karein',
      'customerSubtitle': 'Verified karigar hire karein 100% escrow protection ke sath',
      'nearbyWorkers': 'Nearby Karigar (Radar)',
      'directCall': 'Direct Call Karein',
      'directCallLocked': '🔒 Call Unlock Karein (Pehle Book Karein)',
      'directBook': 'Book Karein (Escrow Safe)',
      'locationOff': '📡 Location band hai - Nearby kaam dekhne ke liye ON karein',
      'turnOnLocation': 'Location ON Karein',
      'bankDetailsRequired': '⚠️ Direct booking ke liye Bank Details zaroori hai',
    },
  };

  static String tr(String key, String lang) {
    return _values[lang]?[key] ?? _values['hi']?[key] ?? key;
  }
}
