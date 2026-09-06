import {
  Booking,
  BookingStatus,
  DisputeItem,
  AuditLogItem,
  WorkerProfile,
  VerificationLevel
} from './types';

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: 'w-1',
    kaamId: 'DK-8492',
    name: 'Rohan Kumar',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    trade: 'Licensed Electrician & Wireman',
    verificationLevel: VerificationLevel.LEVEL_4_MASTER_PARTNER,
    rating: 4.9,
    reviewCount: 184,
    jobsCompleted: 312,
    onTimeRate: 98.4,
    experienceYears: 9,
    languages: ['Hindi', 'English', 'Bhojpuri'],
    serviceArea: 'Indiranagar & Central Sector (5 km radius)',
    distanceKm: 1.8,
    pricing: {
      visitCharge: 199,
      hourlyRate: 350,
      emergencyCharge: 150
    },
    skills: [
      { name: '3-Phase Industrial Wiring', level: 'Master Craftsman', verified: true },
      { name: 'Inverter & Solar Grid Sync', level: 'Skilled', verified: true },
      { name: 'Appliance PCB Diagnosis', level: 'Skilled', verified: true }
    ],
    bio: 'Government Certified Electrician. Over 9 years solving complex domestic and commercial tripping, DB dressing, and smart switches.',
    isAvailable: true,
    govtIdStatus: 'APPROVED'
  },
  {
    id: 'w-2',
    kaamId: 'DK-3104',
    name: 'Suresh Vishwakarma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    trade: 'Senior Plumber & Pipe Specialist',
    verificationLevel: VerificationLevel.LEVEL_3_SKILL_PASSPORT,
    rating: 4.8,
    reviewCount: 96,
    jobsCompleted: 178,
    onTimeRate: 96.2,
    experienceYears: 7,
    languages: ['Hindi', 'English'],
    serviceArea: 'Koramangala, HSR & Bellandur',
    distanceKm: 3.2,
    pricing: {
      visitCharge: 149,
      hourlyRate: 299,
      emergencyCharge: 100
    },
    skills: [
      { name: 'Concealed Pipe Leakage Detection', level: 'Master Craftsman', verified: true },
      { name: 'Bathroom Sanitary Fittings', level: 'Master Craftsman', verified: true },
      { name: 'Pressure Pump & RO Servicing', level: 'Skilled', verified: true }
    ],
    bio: 'Specialist in high-pressure plumbing, CPVC/UPVC pipelines, bathroom renovations and leak-proof installations.',
    isAvailable: true,
    govtIdStatus: 'APPROVED'
  },
  {
    id: 'w-3',
    kaamId: 'DK-5820',
    name: 'Mohd. Imran Khan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    trade: 'HVAC & AC Technician',
    verificationLevel: VerificationLevel.LEVEL_3_SKILL_PASSPORT,
    rating: 4.7,
    reviewCount: 142,
    jobsCompleted: 240,
    onTimeRate: 95.0,
    experienceYears: 6,
    languages: ['Hindi', 'Urdu', 'English'],
    serviceArea: 'Whitefield & Marathahalli',
    distanceKm: 4.5,
    pricing: {
      visitCharge: 249,
      hourlyRate: 400,
      emergencyCharge: 200
    },
    skills: [
      { name: 'Split / Inverter Gas Charging', level: 'Master Craftsman', verified: true },
      { name: 'Deep Jet Pump Service', level: 'Master Craftsman', verified: true },
      { name: 'Compressor PCB Replacement', level: 'Skilled', verified: true }
    ],
    bio: 'Certified Daikin/Voltas trained technician. Specializing in precision diagnostic, copper brazing, and cooling recovery.',
    isAvailable: true,
    govtIdStatus: 'APPROVED'
  },
  {
    id: 'w-4',
    kaamId: 'DK-7119',
    name: 'Harpreet Singh',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    trade: 'Master Carpenter & Wood Crafter',
    verificationLevel: VerificationLevel.LEVEL_4_MASTER_PARTNER,
    rating: 4.95,
    reviewCount: 210,
    jobsCompleted: 380,
    onTimeRate: 99.1,
    experienceYears: 12,
    languages: ['Punjabi', 'Hindi', 'English'],
    serviceArea: 'Jayanagar, JP Nagar & BTM',
    distanceKm: 2.1,
    pricing: {
      visitCharge: 199,
      hourlyRate: 450
    },
    skills: [
      { name: 'Modular Kitchen Fabrication', level: 'Master Craftsman', verified: true },
      { name: 'Hettich/Hafele Hardware Fitting', level: 'Master Craftsman', verified: true },
      { name: 'Teak Restoration & Polishing', level: 'Master Craftsman', verified: true }
    ],
    bio: 'Over a decade of bespoke interior carpentry, modular kitchen alignments, termite proofing and custom furniture crafting.',
    isAvailable: false,
    govtIdStatus: 'APPROVED'
  },
  {
    id: 'w-5',
    kaamId: 'DK-4021',
    name: 'Santosh Kumar Paswan',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    trade: 'Mason & Waterproofing Expert',
    verificationLevel: VerificationLevel.LEVEL_2_IDENTITY,
    rating: 4.6,
    reviewCount: 54,
    jobsCompleted: 89,
    onTimeRate: 94.0,
    experienceYears: 5,
    languages: ['Hindi', 'Maithili'],
    serviceArea: 'BTM Layout & Silk Board',
    distanceKm: 5.0,
    pricing: {
      visitCharge: 149,
      hourlyRate: 300
    },
    skills: [
      { name: 'Dr. Fixit Chemical Waterproofing', level: 'Skilled', verified: true },
      { name: 'Tile Cutting & Floor Leveling', level: 'Skilled', verified: true }
    ],
    bio: 'Dedicated brick masonry, roof dampness resolution, expansion joint seals and exterior wall plastering.',
    isAvailable: true,
    govtIdStatus: 'APPROVED'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bkg-1',
    publicCode: 'DK-BKG-2026-081',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98765 43210',
    customerAddress: 'Flat 402, Green View Apts, 12th Main, Indiranagar',
    workerId: 'w-1',
    workerName: 'Rohan Kumar',
    workerKaamId: 'DK-8492',
    serviceCategory: 'Electrical',
    jobTitle: 'Full-house Wiring Installation & MCB Check',
    description: 'Sub-meter tripping on heavy AC load; need complete circuit load audit and 32A MCB upgrade.',
    scheduledTime: 'Today, 02:30 PM (Arrived - Waiting for Start OTP)',
    status: BookingStatus.WORKER_ARRIVED,
    priceBreakdown: {
      visitCharge: 199,
      taskEstimate: 16000,
      platformFee: 350,
      gstTax: 1451,
      total: 18000
    },
    paymentMethod: 'UPI / Escrow',
    paymentId: 'pay_rzp_live_9481726a',
    paymentConfirmedAt: '2026-09-05 13:45:10',
    startOtp: '4829',
    completionOtp: '7153',
    workerArrivedAt: '2026-09-05 14:26:00',
    notes: 'Worker is at the doorstep. Customer must verify worker photo & Kaam ID before providing Start OTP 4829.'
  },
  {
    id: 'bkg-2',
    publicCode: 'DK-BKG-2026-082',
    customerName: 'Vikram Mehta',
    customerPhone: '+91 91234 56789',
    customerAddress: 'Suite 201, Regal Tech Towers, Marathahalli',
    workerId: 'w-3',
    workerName: 'Mohd. Imran Khan',
    workerKaamId: 'DK-5820',
    serviceCategory: 'HVAC Cooling',
    jobTitle: 'Commercial HVAC Service & Coil Jet Wash',
    description: 'Cassette AC filter clean, refrigerant pressure measurement and drainage clearing.',
    scheduledTime: 'Today, 11:00 AM (In Progress)',
    status: BookingStatus.IN_PROGRESS,
    priceBreakdown: {
      visitCharge: 249,
      taskEstimate: 4500,
      platformFee: 150,
      gstTax: 601,
      total: 5500
    },
    paymentMethod: 'Razorpay',
    paymentId: 'pay_rzp_live_8831920b',
    paymentConfirmedAt: '2026-09-05 10:15:00',
    startOtp: '3910',
    startOtpVerifiedAt: '2026-09-05 11:05:12',
    completionOtp: '8462',
    workerArrivedAt: '2026-09-05 11:00:00',
    jobStartedAt: '2026-09-05 11:05:12',
    notes: 'Dual-Trust Start OTP verified. Job in progress. Worker will request Completion OTP upon test cool down.'
  },
  {
    id: 'bkg-3',
    publicCode: 'DK-BKG-2026-083',
    customerName: 'Priya Nambiar',
    customerPhone: '+91 99887 66554',
    customerAddress: 'Villa 14, Palm Meadows, Whitefield',
    workerId: 'w-2',
    workerName: 'Suresh Vishwakarma',
    workerKaamId: 'DK-3104',
    serviceCategory: 'Plumbing',
    jobTitle: 'Emergency Plumbing Leakage & Wall Tap Fit',
    description: 'Kitchen sink pipe burst causing flooding; emergency shutoff valve replacement.',
    scheduledTime: 'Yesterday, 04:00 PM (Completed & Settled)',
    status: BookingStatus.SETTLED,
    priceBreakdown: {
      visitCharge: 149,
      taskEstimate: 900,
      platformFee: 50,
      gstTax: 101,
      total: 1200
    },
    paymentMethod: 'UPI / Escrow',
    paymentId: 'pay_rzp_live_7712390c',
    paymentConfirmedAt: '2026-09-04 15:40:00',
    startOtp: '6291',
    startOtpVerifiedAt: '2026-09-04 16:03:19',
    completionOtp: '1108',
    completionOtpVerifiedAt: '2026-09-04 16:48:22',
    workerArrivedAt: '2026-09-04 16:01:00',
    jobStartedAt: '2026-09-04 16:03:19',
    jobCompletedAt: '2026-09-04 16:48:22',
    settledAt: '2026-09-04 16:50:00',
    notes: 'Payment released to worker bank account immediately after customer inspected and entered Completion OTP.'
  },
  {
    id: 'bkg-4',
    publicCode: 'DK-BKG-2026-084',
    customerName: 'Kavita Deshmukh',
    customerPhone: '+91 97654 32190',
    customerAddress: 'House 88, Sector 4, HSR Layout',
    workerId: 'w-4',
    workerName: 'Harpreet Singh',
    workerKaamId: 'DK-7119',
    serviceCategory: 'Carpentry',
    jobTitle: 'Modular Kitchen Assembly & Soft-Close Hinges',
    description: 'Assembling 6 overhead marine plywood cabinets with hydraulic dampers.',
    scheduledTime: 'Tomorrow, 10:00 AM (Confirmed & Escrow Held)',
    status: BookingStatus.BOOKING_CONFIRMED,
    priceBreakdown: {
      visitCharge: 199,
      taskEstimate: 11000,
      platformFee: 250,
      gstTax: 951,
      total: 12400
    },
    paymentMethod: 'UPI / Escrow',
    paymentId: 'pay_rzp_live_6628190d',
    paymentConfirmedAt: '2026-09-05 08:30:15',
    startOtp: '5523',
    completionOtp: '9014',
    notes: 'Escrow amount ₹12,400 securely held. Start OTP will be presented in app when worker arrives.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-05 14:26:02',
    actor: 'Rohan Kumar (DK-8492)',
    actorRole: 'WORKER',
    action: 'WORKER_ARRIVED',
    bookingCode: 'DK-BKG-2026-081',
    hash: 'sha256:8f4b29a1b028...',
    status: 'SUCCESS',
    details: 'Geo-proximity match: Worker GPS is 28 meters from customer Indiranagar address.'
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-05 13:45:12',
    actor: 'Razorpay Webhook Engine',
    actorRole: 'SYSTEM_ESCROW',
    action: 'PAYMENT_ESCROW_LOCKED',
    bookingCode: 'DK-BKG-2026-081',
    hash: 'sha256:e1a90bc77a11...',
    status: 'SUCCESS',
    details: 'Signature verified. Amount ₹18,000 held in Digital Kaam Escrow. Start OTP 4829 generated.'
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-05 11:05:12',
    actor: 'Mohd. Imran Khan (DK-5820)',
    actorRole: 'WORKER',
    action: 'START_OTP_VERIFIED',
    bookingCode: 'DK-BKG-2026-082',
    hash: 'sha256:39ac98d011ff...',
    status: 'SUCCESS',
    details: 'Customer shared Start OTP 3910 after inspecting technician ID badge. State -> IN_PROGRESS.'
  },
  {
    id: 'aud-4',
    timestamp: '2026-09-04 16:48:22',
    actor: 'Priya Nambiar (Customer)',
    actorRole: 'CUSTOMER',
    action: 'COMPLETION_OTP_AUTHORIZATION',
    bookingCode: 'DK-BKG-2026-083',
    hash: 'sha256:7198ca30eef2...',
    status: 'SUCCESS',
    details: 'Customer inspected pipe joints and shared Completion OTP 1108. Auto-settlement triggered.'
  },
  {
    id: 'aud-5',
    timestamp: '2026-09-04 16:50:01',
    actor: 'Payout Settlement Daemon',
    actorRole: 'SYSTEM_ESCROW',
    action: 'ESCROW_PAYOUT_DISBURSED',
    bookingCode: 'DK-BKG-2026-083',
    hash: 'sha256:a44917efd092...',
    status: 'SUCCESS',
    details: 'Direct payout of ₹1,049 transferred to Suresh Vishwakarma UPI VPA with 0% gateway loss.'
  }
];

export const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: 'dsp-1',
    bookingCode: 'DK-BKG-2026-079',
    raisedBy: 'CUSTOMER',
    complainantName: 'Deepak Chopra',
    category: 'NO_SHOW',
    status: 'REFUND_APPROVED',
    claimAmount: 650,
    description: 'Worker accepted booking for 09:00 AM but did not arrive or respond after 25 min grace window.',
    filedAt: '2026-09-04 09:30:00',
    resolutionNote: 'Automated GPS & telecom signals confirmed worker absence. 100% full refund ₹650 issued idempotently.'
  }
];
