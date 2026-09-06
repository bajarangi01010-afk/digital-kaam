import 'dart:io';
import 'dart:typed_data';
import '../models/worker_session.dart';
import 'package:flutter/material.dart';
import 'worker_dashboard_screen.dart';

class WorkerSkillSetupScreen extends StatefulWidget {
  final String workerName;
  final String phone;
  final String address;
  final File? profilePhoto;
  final Uint8List? profilePhotoBytes;

  const WorkerSkillSetupScreen({
    super.key,
    required this.workerName,
    required this.phone,
    required this.address,
    this.profilePhoto,
    this.profilePhotoBytes,
  });

  @override
  State<WorkerSkillSetupScreen> createState() => _WorkerSkillSetupScreenState();
}

class _WorkerSkillSetupScreenState extends State<WorkerSkillSetupScreen> {
  final List<Map<String, dynamic>> _categories = [
    {"id": "electrician", "title": "इलेक्ट्रीशियन (Electrician)", "icon": Icons.bolt_rounded, "selected": true},
    {"id": "plumber", "title": "प्लंबर (Plumber)", "icon": Icons.plumbing_rounded, "selected": false},
    {"id": "carpenter", "title": "कारपेंटर / बढ़ई (Carpenter)", "icon": Icons.handyman_rounded, "selected": false},
    {"id": "painter", "title": "पेंटर (Painter)", "icon": Icons.format_paint_rounded, "selected": false},
    {"id": "mason", "title": "राजमिस्त्री (Mason / Mistri)", "icon": Icons.foundation_rounded, "selected": false},
    {"id": "cleaner", "title": "सफाई कर्मचारी (Cleaning)", "icon": Icons.cleaning_services_rounded, "selected": false},
    {"id": "appliance", "title": "होम अप्लायंस रिपेयर", "icon": Icons.home_repair_service_rounded, "selected": false},
    {"id": "welder", "title": "वेल्डर (Welder)", "icon": Icons.construction_rounded, "selected": false},
  ];

  String _experienceLevel = "experienced"; // beginner, certified, experienced
  final TextEditingController _rateController = TextEditingController(text: "350");

  @override
  void dispose() {
    _rateController.dispose();
    super.dispose();
  }

  void _finishProfileSetup() {
    final selectedSkills = _categories.where((c) => c["selected"] == true).toList();
    if (selectedSkills.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text("कृपया कम से कम एक मुख्य हुनर (Skill Category) चुनें"),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    // Success dialog then push to WorkerDashboardScreen
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 26),
            SizedBox(width: 10),
            Text("कारीगर खाता तैयार!", style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Text(
          "बधाई हो ${widget.workerName}! आपका डिजिटल काम कारीगर खाता सफलतापूर्वक सक्रिय हो चुका है। अब आप अपने डैशबोर्ड पर काम देख सकते हैं।",
          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.5),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(
                  builder: (context) {
                    WorkerSession.update(
                      newName: widget.workerName,
                      newSkill: selectedSkills.first["title"],
                      newPhoto: widget.profilePhoto,
                      newBytes: widget.profilePhotoBytes,
                    );
                    return WorkerDashboardScreen(
                      workerName: widget.workerName,
                      primarySkill: selectedSkills.first["title"],
                      profilePhoto: widget.profilePhoto ?? WorkerSession.profilePhoto,
                      profilePhotoBytes: widget.profilePhotoBytes ?? WorkerSession.profilePhotoBytes,
                    );
                  },
                ),
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text("डैशबोर्ड पर जाएं", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text(
          "हुनर व अनुभव चयन (Skill Setup)",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 580),
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  "चरण 2: अपना हुनर और अनुभव दर्ज करें",
                  style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                const Text(
                  "आप किस काम में माहिर हैं?",
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 18),

                // Skill Categories Grid
                const Text(
                  "लोकल काम की श्रेणी (Select Categories):",
                  style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _categories.map((cat) {
                    final bool isSelected = cat["selected"] == true;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          cat["selected"] = !isSelected;
                        });
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF1D4ED8) : const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF60A5FA) : const Color(0xFF334155),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              cat["icon"] as IconData,
                              color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              cat["title"] as String,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFFCBD5E1),
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Experience Level Selection: Beginner, Certified, Experienced
                const Text(
                  "अनुभव का स्तर (Experience Level):",
                  style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildExpOption("beginner", "शुरुआती\n(Beginner)"),
                    const SizedBox(width: 8),
                    _buildExpOption("certified", "प्रमाणित\n(Certified)"),
                    const SizedBox(width: 8),
                    _buildExpOption("experienced", "अनुभवी\n(Experienced)"),
                  ],
                ),
                const SizedBox(height: 24),

                // Visiting / Minimum Task Rate
                const Text(
                  "न्यूनतम विजिट / निरीक्षण शुल्क (₹ में):",
                  style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _rateController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.currency_rupee, color: Color(0xFF38BDF8), size: 18),
                    hintText: "उदा. 350",
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF334155)),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // Final Submit Button
                ElevatedButton(
                  onPressed: _finishProfileSetup,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 20),
                      SizedBox(width: 10),
                      Text(
                        "खाता बनाएं एवं डैशबोर्ड खोलें (Create Account)",
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExpOption(String key, String title) {
    final bool isSelected = _experienceLevel == key;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _experienceLevel = key;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF1D4ED8) : const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFF60A5FA) : const Color(0xFF334155),
            ),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : const Color(0xFF94A3B8),
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              height: 1.3,
            ),
          ),
        ),
      ),
    );
  }
}
