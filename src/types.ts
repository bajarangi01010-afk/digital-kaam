export enum BookingStatus {
  DRAFT = 'DRAFT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  WORKER_ACCEPTED = 'WORKER_ACCEPTED',
  WORKER_ON_THE_WAY = 'WORKER_ON_THE_WAY',
  WORKER_ARRIVED = 'WORKER_ARRIVED',
  START_AUTHORIZED = 'START_AUTHORIZED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETION_REQUESTED = 'COMPLETION_REQUESTED',
  COMPLETED = 'COMPLETED',
  SETTLEMENT_PENDING = 'SETTLEMENT_PENDING',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  NO_SHOW_REVIEW = 'NO_SHOW_REVIEW',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

export enum VerificationLevel {
  LEVEL_0_UNVERIFIED = 'Unverified',
  LEVEL_1_MOBILE = 'Mobile Verified',
  LEVEL_2_IDENTITY = 'Govt ID / Aadhaar Verified',
  LEVEL_3_SKILL_PASSPORT = 'Skill Passport & Trade Verified',
  LEVEL_4_MASTER_PARTNER = 'Master Verified Partner'
}

export interface WorkerSkill {
  name: string;
  level: 'Basic' | 'Skilled' | 'Master Craftsman';
  verified: boolean;
  certificates?: string[];
}

export interface WorkerProfile {
  id: string;
  kaamId: string; // e.g. "DK-8492"
  name: string;
  avatar: string;
  trade: string;
  verificationLevel: VerificationLevel;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  onTimeRate: number; // percentage, e.g. 98.4
  experienceYears: number;
  languages: string[];
  serviceArea: string;
  distanceKm: number;
  pricing: {
    visitCharge: number;
    hourlyRate: number;
    emergencyCharge?: number;
  };
  skills: WorkerSkill[];
  bio: string;
  isAvailable: boolean;
  govtIdStatus: 'APPROVED' | 'IN_REVIEW' | 'REJECTED';
  phone?: string;
  directBookingEnabled?: boolean;
  localSpecialties?: string[];
  bankDetails?: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    isSubmitted: boolean;
    upiId?: string;
  };
}

export interface PriceBreakdown {
  visitCharge: number;
  taskEstimate: number;
  platformFee: number;
  gstTax: number;
  materialCost?: number;
  total: number;
}

export interface Booking {
  id: string;
  publicCode: string; // e.g. "DK-BKG-2026-081"
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  workerId: string;
  workerName: string;
  workerKaamId: string;
  serviceCategory: string;
  jobTitle: string;
  description: string;
  scheduledTime: string;
  status: BookingStatus;
  priceBreakdown: PriceBreakdown;
  paymentMethod: 'UPI / Escrow' | 'Razorpay' | 'Card' | 'NetBanking';
  paymentId: string;
  paymentConfirmedAt: string;
  startOtp: string;
  startOtpVerifiedAt?: string;
  completionOtp: string;
  completionOtpVerifiedAt?: string;
  workerArrivedAt?: string;
  jobStartedAt?: string;
  jobCompletedAt?: string;
  settledAt?: string;
  notes?: string;
  evidencePhotos?: string[];
  disputeReason?: string;
  refundStatus?: 'NONE' | 'PROCESSING' | 'REFUNDED_100_PERCENT';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: 'CUSTOMER' | 'WORKER' | 'ADMIN' | 'SYSTEM_ESCROW';
  action: string;
  bookingCode?: string;
  hash: string;
  status: 'SUCCESS' | 'WARNING' | 'ALERT';
  details: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  avatar: string;
  isVerified: boolean;
  trustScore: number; // 0 - 100
  memberSince: string;
  totalBookings: number;
  aadhaarNumberMasked?: string;
  aadhaarVerified?: boolean;
  faceVerified?: boolean;
  email?: string;
  emergencyContact?: string;
  preferredPayment?: string;
  houseFlat?: string;
  landmark?: string;
  city?: string;
}

export interface PostedJob {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  voiceNoteUrl?: string;
  budget: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerTrustScore: number;
  distanceKm: number;
  postedAt: string;
  status: 'OPEN' | 'WORKER_REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  interestedWorkers: {
    workerId: string;
    workerName: string;
    workerKaamId: string;
    workerAvatar: string;
    workerTrade: string;
    workerRating: number;
    bidAmount: number;
    requestedAt: string;
  }[];
}

export interface DisputeItem {
  id: string;
  bookingCode: string;
  raisedBy: 'CUSTOMER' | 'WORKER';
  complainantName: string;
  category: 'NO_SHOW' | 'WORK_QUALITY' | 'PAYMENT_MISMATCH' | 'SAFETY_VIOLATION' | 'UNAUTHORIZED_FEE';
  status: 'OPEN' | 'UNDER_REVIEW' | 'REFUND_APPROVED' | 'RESOLVED_SETTLED';
  claimAmount: number;
  description: string;
  filedAt: string;
  resolutionNote?: string;
}
