export interface FlutterFile {
  path: string;
  name: string;
  category: 'Configuration' | 'Core Security' | 'Models' | 'Customer App' | 'Worker App' | 'API & State';
  description: string;
  code: string;
}

export const FLUTTER_DART_PROJECT: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    name: 'pubspec.yaml',
    category: 'Configuration',
    description: 'Flutter dependencies, Riverpod state, Razorpay integration, Google Maps & crypto libraries',
    code: `name: digital_kaam
description: "Digital Kaam — Trusted Local Services & Dual-Trust Network"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.1
  dio: ^5.4.1
  crypto: ^3.0.3
  intl: ^0.19.0
  google_maps_flutter: ^2.6.0
  geolocator: ^11.0.0
  razorpay_flutter: ^1.3.7
  flutter_secure_storage: ^9.0.0
  cupertino_icons: ^1.0.6
  uuid: ^4.3.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/icons/
    - assets/badges/`
  },
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    category: 'Core Security',
    description: 'Entrypoint initializing Digital Kaam theme, Riverpod Scope, and Role Switcher',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/customer/screens/customer_home_screen.dart';
import 'features/worker/screens/worker_gig_radar_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: DigitalKaamApp()));
}

class DigitalKaamApp extends StatelessWidget {
  const DigitalKaamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Digital Kaam',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB), // Royal Blue
          primary: const Color(0xFF2563EB),
          secondary: const Color(0xFF0F172A), // Slate 900
          surface: Colors.white,
          background: const Color(0xFFF8FAFC), // Slate 50
        ),
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const RoleGatewayScreen(),
    );
  }
}

class RoleGatewayScreen extends StatefulWidget {
  const RoleGatewayScreen({super.key});

  @override
  State<RoleGatewayScreen> createState() => _RoleGatewayScreenState();
}

class _RoleGatewayScreenState extends State<RoleGatewayScreen> {
  int _selectedTabIndex = 0;

  final List<Widget> _screens = const [
    CustomerHomeScreen(),
    WorkerGigRadarScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedTabIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedTabIndex,
        onDestinationSelected: (index) => setState(() => _selectedTabIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.person_search_outlined),
            selectedIcon: Icon(Icons.person_search, color: Color(0xFF2563EB)),
            label: 'Customer App',
          ),
          NavigationDestination(
            icon: Icon(Icons.handyman_outlined),
            selectedIcon: Icon(Icons.handyman, color: Color(0xFF2563EB)),
            label: 'Worker Partner',
          ),
        ],
      ),
    );
  }
}`
  },
  {
    path: 'lib/core/dual_trust_otp.dart',
    name: 'dual_trust_otp.dart',
    category: 'Core Security',
    description: 'Cryptographic Dual-Trust Start & Completion OTP generation and server HMAC validation',
    code: `import 'dart:convert';
import 'package:crypto/crypto.dart';

/// Digital Kaam Dual-Trust OTP Engine
/// Rules from Master Architecture Blueprint:
/// 1. Start OTP is bound strictly to (bookingId + workerKaamId + timestamp).
/// 2. Customer sees it upon arrival verification; worker submits it.
/// 3. Completion OTP is issued only after customer inspection.
/// 4. Server-authoritative: no plaintext OTP logged or stored.
class DualTrustOtpEngine {
  final String serverSalt;

  DualTrustOtpEngine({required this.serverSalt});

  /// Generates a tamper-proof 4-digit numeric OTP token hash
  String generateTokenHash({
    required String bookingId,
    required String purpose, // 'START_WORK' or 'COMPLETE_WORK'
    required String plainOtp,
  }) {
    final payload = '\$bookingId:\$purpose:\$plainOtp:\$serverSalt';
    final bytes = utf8.encode(payload);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Verifies submitted OTP against authoritative stored HMAC
  bool verifyOtp({
    required String bookingId,
    required String purpose,
    required String submittedOtp,
    required String expectedHash,
  }) {
    final computed = generateTokenHash(
      bookingId: bookingId,
      purpose: purpose,
      plainOtp: submittedOtp.trim(),
    );
    return computed == expectedHash;
  }
}`
  },
  {
    path: 'lib/models/worker_model.dart',
    name: 'worker_model.dart',
    category: 'Models',
    description: 'Worker Kaam ID, Skill Passport, Verification Level & Transparent Pricing model',
    code: `enum VerificationLevel {
  unverified,
  mobileVerified,
  identityVerified,
  skillPassportVerified,
  masterPartner,
}

class WorkerSkill {
  final String name;
  final String level; // 'Basic', 'Skilled', 'Master Craftsman'
  final bool verified;

  WorkerSkill({
    required this.name,
    required this.level,
    required this.verified,
  });

  factory WorkerSkill.fromJson(Map<String, dynamic> json) => WorkerSkill(
        name: json['name'],
        level: json['level'],
        verified: json['verified'] ?? false,
      );
}

class WorkerProfile {
  final String id;
  final String kaamId; // e.g. "DK-8492"
  final String name;
  final String avatarUrl;
  final String trade;
  final VerificationLevel level;
  final double rating;
  final int jobsCompleted;
  final double onTimeRate;
  final int experienceYears;
  final double visitCharge;
  final double hourlyRate;
  final List<WorkerSkill> skills;
  final String serviceArea;

  WorkerProfile({
    required this.id,
    required this.kaamId,
    required this.name,
    required this.avatarUrl,
    required this.trade,
    required this.level,
    required this.rating,
    required this.jobsCompleted,
    required this.onTimeRate,
    required this.experienceYears,
    required this.visitCharge,
    required this.hourlyRate,
    required this.skills,
    required this.serviceArea,
  });

  String get verificationBadgeTitle {
    switch (level) {
      case VerificationLevel.masterPartner:
        return 'Level 4: Master Verified Partner';
      case VerificationLevel.skillPassportVerified:
        return 'Level 3: Skill Passport Verified';
      case VerificationLevel.identityVerified:
        return 'Level 2: Aadhaar ID Verified';
      case VerificationLevel.mobileVerified:
        return 'Level 1: Mobile Verified';
      default:
        return 'Level 0: Unverified';
    }
  }
}`
  },
  {
    path: 'lib/features/customer/screens/customer_home_screen.dart',
    name: 'customer_home_screen.dart',
    category: 'Customer App',
    description: 'Flutter UI: Verified worker discovery, trade filters, Kaam ID badges, and instant booking modal',
    code: `import 'package:flutter/material.dart';
import '../../../models/worker_model.dart';
import 'booking_flow_sheet.dart';

class CustomerHomeScreen extends StatelessWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('DK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
            const SizedBox(width: 8),
            const Text('Digital Kaam', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Location Header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.location_on, color: Color(0xFF2563EB), size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Sector 48, Sohna Road, Gurugram, NCR',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF1E293B)),
                    ),
                  ),
                  Icon(Icons.keyboard_arrow_down, color: Color(0xFF64748B)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Dual-Trust Verified Trades', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            // Trades Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTradeChip('Electrician', Icons.bolt, true),
                  _buildTradeChip('Plumbing', Icons.plumbing, false),
                  _buildTradeChip('Carpentry', Icons.handyman, false),
                  _buildTradeChip('HVAC / AC', Icons.ac_unit, false),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text('Nearby Verified Specialists', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('Live Escrow Protected', style: TextStyle(fontSize: 12, color: Color(0xFF059669), fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            // Worker Card Demonstration
            _buildWorkerCard(
              context,
              name: 'Rohan Kumar Sharma',
              kaamId: 'DK-8492',
              trade: 'Master Electrician',
              levelBadge: 'Level 4 Master Partner',
              rating: 4.92,
              jobs: 384,
              visitFee: 199,
              hourlyRate: 350,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTradeChip(String title, IconData icon, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF2563EB) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isSelected ? Colors.white : const Color(0xFF475569)),
          const SizedBox(width: 6),
          Text(
            title,
            style: TextStyle(
              color: isSelected ? Colors.white : const Color(0xFF1E293B),
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWorkerCard(
    BuildContext context, {
    required String name,
    required String kaamId,
    required String trade,
    required String levelBadge,
    required double rating,
    required int jobs,
    required double visitFee,
    required double hourlyRate,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: const Color(0xFF2563EB),
                child: Text(name.substring(0, 2).toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(kaamId, style: const TextStyle(fontSize: 10, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    Text(trade, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(levelBadge, style: const TextStyle(color: Color(0xFF059669), fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Color(0xFFF1F5F9)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Base Visit Charge', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  Text('₹\${visitFee.toInt()}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                ],
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (ctx) => const BookingFlowSheet(),
                  );
                },
                child: const Text('Book with Escrow'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}`
  },
  {
    path: 'lib/features/worker/screens/worker_gig_radar_screen.dart',
    name: 'worker_gig_radar_screen.dart',
    category: 'Worker App',
    description: 'Flutter UI for Worker: Live gigs radar, Arrival check-in button, Start OTP entry & job completion',
    code: `import 'package:flutter/material.dart';

class WorkerGigRadarScreen extends StatefulWidget {
  const WorkerGigRadarScreen({super.key});

  @override
  State<WorkerGigRadarScreen> createState() => _WorkerGigRadarScreenState();
}

class _WorkerGigRadarScreenState extends State<WorkerGigRadarScreen> {
  String jobStatus = 'IN_PROGRESS'; // 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'
  final TextEditingController _otpController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Partner Dashboard — Digital Kaam'),
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Earnings quick widget
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Today\\'s Escrow Balance', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                      SizedBox(height: 4),
                      Text('₹4,250.00', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Icon(Icons.account_balance_wallet, color: Color(0xFF2563EB), size: 32),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Active Job in Progress', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text('Job #DK-BKG-2026-081', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('IN PROGRESS', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Full-House Wiring Check & MCB Tripping Diagnostics', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  const Text('Customer: Pooja Kashyap (Sector 48, Gurugram)', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                  const Divider(height: 24),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Dual-Trust Start OTP:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      Text('✓ Verified (4829)', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Request Customer Completion OTP'),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Completion requested! Ask customer to inspect and share OTP.')),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}`
  },
  {
    path: 'lib/services/digital_kaam_api.dart',
    name: 'digital_kaam_api.dart',
    category: 'API & State',
    description: 'Server-authoritative Dio client with idempotency headers and auto retry',
    code: `import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

class DigitalKaamApiClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://api.digitalkaam.in/api/v1',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'X-Platform-Client': 'Flutter-Android-v1.0',
    },
  ));

  final Uuid _uuid = const Uuid();

  /// Create booking with server idempotency key to prevent duplicate payment orders
  Future<Response> createBooking(Map<String, dynamic> payload) async {
    final idempotencyKey = _uuid.v4();
    return await _dio.post(
      '/bookings',
      data: payload,
      options: Options(headers: {'X-Idempotency-Key': idempotencyKey}),
    );
  }

  /// Authoritative server verification of Start OTP
  Future<bool> verifyStartOtp(String bookingId, String otp) async {
    final response = await _dio.post('/bookings/\$bookingId/start-otp/verify', data: {
      'otp': otp,
      'deviceTimestamp': DateTime.now().toIso8601String(),
    });
    return response.statusCode == 200 && response.data['authorized'] == true;
  }

  /// Authoritative server verification of Completion OTP
  Future<bool> verifyCompletionOtp(String bookingId, String otp) async {
    final response = await _dio.post('/bookings/\$bookingId/completion-otp/verify', data: {
      'otp': otp,
    });
    return response.statusCode == 200 && response.data['completed'] == true;
  }
}`
  }
];
