import {
  Booking,
  VerificationLevel,
  WorkerProfile,
  AuditLogItem,
  DisputeItem,
  CustomerProfile,
  PostedJob,
} from '../types';

export const EMPTY_WORKER: WorkerProfile = {
  id: '',
  kaamId: '',
  name: '',
  avatar: '',
  trade: '',
  verificationLevel: VerificationLevel.LEVEL_0_UNVERIFIED,
  rating: 5.0,
  reviewCount: 0,
  jobsCompleted: 0,
  onTimeRate: 100,
  experienceYears: 0,
  languages: ['Hindi'],
  serviceArea: '',
  distanceKm: 0,
  pricing: {
    visitCharge: 199,
    hourlyRate: 350,
  },
  skills: [],
  bio: '',
  isAvailable: true,
  govtIdStatus: 'APPROVED',
  phone: '',
};

export const INITIAL_WORKERS: WorkerProfile[] = [];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_DISPUTES: DisputeItem[] = [];

export const DEFAULT_CUSTOMER: CustomerProfile = {
  id: '',
  name: '',
  phone: '',
  address: '',
  avatar: '',
  isVerified: false,
  trustScore: 100,
  memberSince: 'आज',
  totalBookings: 0,
  aadhaarNumberMasked: '',
  aadhaarVerified: false,
  faceVerified: false,
  email: '',
  emergencyContact: '',
  preferredPayment: '',
  houseFlat: '',
  landmark: '',
  city: '',
};

export const INITIAL_POSTED_JOBS: PostedJob[] = [];
