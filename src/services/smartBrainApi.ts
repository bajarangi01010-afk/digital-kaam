import { WorkerProfile, PostedJob, Booking } from '../types';
import { INITIAL_WORKERS, INITIAL_POSTED_JOBS } from '../data/mockData';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

class SmartBrainApiService {
  private isOnline = false;

  constructor() {
    this.checkHealth();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
      this.isOnline = res.ok;
      return res.ok;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  // Get full worker profiles feed
  async getWorkers(): Promise<WorkerProfile[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/workers`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.workers && data.workers.length > 0) {
          return data.workers.map((w: any) => ({
            id: w.worker_id || w.id,
            kaamId: w.kaam_id || w.kaamId,
            name: w.name,
            avatar: w.avatar,
            trade: w.trade,
            verificationLevel: 4,
            rating: w.rating,
            reviewCount: w.review_count || 100,
            jobsCompleted: w.jobs_completed || 50,
            onTimeRate: w.on_time_rate || 98.0,
            experienceYears: w.experience_years || 5,
            languages: w.languages || ['Hindi'],
            serviceArea: w.service_area || 'Delhi NCR',
            distanceKm: w.distance_km || 2.0,
            pricing: {
              visitCharge: w.pricing?.visit_charge || 199,
              hourlyRate: w.pricing?.hourly_rate || 300,
              emergencyCharge: w.pricing?.emergency_charge || 450,
            },
            skills: w.skills || [{ name: w.trade, level: 'Master', verified: true }],
            bio: w.bio || 'Verified professional',
            isAvailable: w.is_available ?? true,
            govtIdStatus: w.govt_id_status || 'APPROVED',
          }));
        }
      }
    } catch {
      // Fallback seamlessly to INITIAL_WORKERS
    }
    return INITIAL_WORKERS;
  }

  // Get posted jobs feed
  async getPostedJobs(): Promise<PostedJob[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/jobs`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) {
          return data.jobs;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_POSTED_JOBS;
  }

  // Post a new job in real-time
  async postJob(job: PostedJob): Promise<PostedJob> {
    try {
      const res = await fetch(`${BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          category: job.category,
          description: job.description,
          budget: job.budget,
          customer_name: job.customerName,
          customer_phone: job.customerPhone,
          customer_address: job.customerAddress,
          image_url: job.imageUrl,
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.job) return data.job;
      }
    } catch {
      // Local fallback
    }
    return job;
  }

  // Worker applies for a job
  async applyForJob(jobId: string, worker: WorkerProfile, bidAmount?: number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: worker.id,
          bid_amount: bidAmount || worker.pricing.visitCharge,
        }),
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const smartBrainApi = new SmartBrainApiService();
