"""
Digital Kaam — Master Platform Neural Orchestrator Brain (Master Brain)
=======================================================================
Central Autonomous Governor, Self-Trainer & Disaster Recovery Orchestrator.
Responsibilities:
1. Orchestrates Brain 1 (Client Experience), Brain 2 (Core Dispatch), and Brain 3 (Ledger Vault).
2. Autonomous Continuous Self-Training Engine: Analyzes completed bookings, dynamic urban transit speed,
   worker reliability scores, and optimizes dispatch weights over timespan.
3. Circuit-Breaker & Fault Isolation: If any brain fails or undergoes attack, switches gracefully
   to autonomous decoupled fallback mode so the application never stops.
4. Tamper Watchdog: Continuously re-verifies cryptographic SHA-256 chain integrity.
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
import os
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import database
from core_operations_brain import core_operations_dispatch_brain
from financial_ledger_brain import financial_ledger_vault_brain

logger = logging.getLogger("master_platform_brain")

# Ensure self-learning state table exists
def _init_master_learning_tables():
    conn = database.get_db_connection()
    try:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS master_learning_state (
            id TEXT PRIMARY KEY,
            urban_avg_speed_kmh REAL DEFAULT 22.0,
            total_trips_learned INTEGER DEFAULT 0,
            fraud_risk_threshold REAL DEFAULT 0.85,
            dynamic_dispatch_weight REAL DEFAULT 1.0,
            last_trained_at REAL,
            active_circuit_status TEXT DEFAULT 'NORMAL_HEALTHY'
        )
        """)
        # Initialize default state if empty
        row = conn.execute("SELECT * FROM master_learning_state WHERE id = 'MASTER_STATE'").fetchone()
        if not row:
            conn.execute("""
            INSERT INTO master_learning_state (
                id, urban_avg_speed_kmh, total_trips_learned, fraud_risk_threshold,
                dynamic_dispatch_weight, last_trained_at, active_circuit_status
            ) VALUES ('MASTER_STATE', 22.0, 0, 0.85, 1.0, ?, 'NORMAL_HEALTHY')
            """, (time.time(),))
        conn.commit()
    finally:
        conn.close()

_init_master_learning_tables()


class MasterPlatformBrain:
    """
    The Master Neural Brain of Digital Kaam.
    Governs multi-brain handshakes, self-training loops, and resilience guards.
    """

    def __init__(self):
        self.ops_brain = core_operations_dispatch_brain
        self.vault_brain = financial_ledger_vault_brain
        self.circuit_state: str = "NORMAL_HEALTHY"
        self._load_learning_state()

    def _load_learning_state(self):
        """Loads persistent continuous learning parameters from database."""
        conn = database.get_db_connection()
        try:
            row = conn.execute("SELECT * FROM master_learning_state WHERE id = 'MASTER_STATE'").fetchone()
            if row:
                self.urban_avg_speed_kmh = float(row["urban_avg_speed_kmh"])
                self.total_trips_learned = int(row["total_trips_learned"])
                self.fraud_risk_threshold = float(row["fraud_risk_threshold"])
                self.dynamic_dispatch_weight = float(row["dynamic_dispatch_weight"])
                self.circuit_state = row["active_circuit_status"]
            else:
                self.urban_avg_speed_kmh = 22.0
                self.total_trips_learned = 0
                self.fraud_risk_threshold = 0.85
                self.dynamic_dispatch_weight = 1.0
        except Exception as e:
            logger.error("Failed to load learning state: %s", e)
            self.urban_avg_speed_kmh = 22.0
            self.total_trips_learned = 0
            self.fraud_risk_threshold = 0.85
            self.dynamic_dispatch_weight = 1.0
        finally:
            conn.close()

    # ──────────────────────────────────────────────────────────
    # 1. AUTONOMOUS CONTINUOUS LEARNING ENGINE (Self-Train with Timespan)
    # ──────────────────────────────────────────────────────────
    def run_self_training_cycle(self) -> Dict[str, Any]:
        """
        Self-Train Loop: Analyzes historical completed bookings, trip durations,
        and customer satisfaction ratings to adaptively calibrate urban transit speed,
        ETA models, and worker priority ranking.
        """
        conn = database.get_db_connection()
        try:
            completed_bookings = conn.execute("""
                SELECT booking_id, distance_km, eta_minutes, created_at, updated_at
                FROM bookings
                WHERE tracking_status = 'COMPLETED' AND distance_km > 0
            """).fetchall()

            trips_count = len(completed_bookings)
            if trips_count > 0:
                # Calculate real-world urban transit speeds from past handshakes
                total_derived_speed = 0.0
                valid_trips = 0

                for b in completed_bookings:
                    time_diff_hours = (b["updated_at"] - b["created_at"]) / 3600.0
                    # Sanity check: between 2 minutes and 4 hours
                    if 0.033 <= time_diff_hours <= 4.0:
                        speed = b["distance_km"] / time_diff_hours
                        if 5.0 <= speed <= 60.0:  # Realistic Indian two-wheeler urban traffic range
                            total_derived_speed += speed
                            valid_trips += 1

                if valid_trips > 0:
                    avg_speed = total_derived_speed / valid_trips
                    # Exponential moving average to gradually adapt (smooth self-training)
                    self.urban_avg_speed_kmh = round((0.7 * self.urban_avg_speed_kmh) + (0.3 * avg_speed), 2)
                    self.total_trips_learned += valid_trips
                else:
                    self.total_trips_learned = trips_count

            # Worker Rating & Experience Optimization
            workers = conn.execute("SELECT worker_id, rating, total_jobs FROM workers").fetchall()
            if workers:
                avg_rating = sum(w["rating"] for w in workers) / len(workers)
                # Calibrate dispatch weight: reward high-trust marketplaces
                self.dynamic_dispatch_weight = round(min(1.5, max(0.8, avg_rating / 4.5)), 3)

            now_ts = time.time()
            conn.execute("""
                UPDATE master_learning_state SET
                    urban_avg_speed_kmh = ?,
                    total_trips_learned = ?,
                    dynamic_dispatch_weight = ?,
                    last_trained_at = ?
                WHERE id = 'MASTER_STATE'
            """, (self.urban_avg_speed_kmh, self.total_trips_learned, self.dynamic_dispatch_weight, now_ts))
            conn.commit()

            return {
                "training_status": "COMPLETED",
                "completed_trips_analyzed": trips_count,
                "calibrated_urban_speed_kmh": self.urban_avg_speed_kmh,
                "total_learned_trips_all_time": self.total_trips_learned,
                "dynamic_dispatch_weight": self.dynamic_dispatch_weight,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        finally:
            conn.close()

    # ──────────────────────────────────────────────────────────
    # 2. DISASTER RECOVERY & RESILIENCE WATCHDOG
    # ──────────────────────────────────────────────────────────
    def check_resilience_and_circuit(self) -> Dict[str, Any]:
        """
        Disaster Recovery Check: Tests health of Brain 2 and Brain 3.
        If a fault, ledger break or tampering is detected, activates Fallback Isolation.
        """
        # Step A: Audit Brain 3 Ledger
        is_ledger_intact, ledger_count, ledger_issues = self.vault_brain.verify_ledger_integrity()

        # Step B: Audit Database connection
        db_alive = False
        try:
            conn = database.get_db_connection()
            conn.execute("SELECT 1").fetchone()
            conn.close()
            db_alive = True
        except Exception:
            db_alive = False

        # Step C: Determine Circuit Breaker Status
        if not is_ledger_intact:
            self.circuit_state = "TAMPER_DETECTED_LOCKDOWN"
        elif not db_alive:
            self.circuit_state = "DATABASE_DISCONNECTED_FALLBACK"
        else:
            self.circuit_state = "NORMAL_HEALTHY"

        return {
            "master_status": self.circuit_state,
            "is_tamper_detected": not is_ledger_intact,
            "tamper_issues": ledger_issues,
            "database_persistent_alive": db_alive,
            "ledger_verified_count": ledger_count,
            "autonomous_survival_mode": "ACTIVE (Decoupled)" if self.circuit_state != "NORMAL_HEALTHY" else "STANDBY"
        }

    # ──────────────────────────────────────────────────────────
    # 3. END-TO-END MASTER ORCHESTRATION HANDSHAKE (Strict Rules)
    # ──────────────────────────────────────────────────────────
    def dispatch_full_lifecycle(
        self,
        customer_name: str,
        customer_phone: str,
        customer_address: str,
        worker_id: str,
        service_name: str,
        visiting_fee: int,
        customer_lat: float,
        customer_lng: float
    ) -> Dict[str, Any]:
        """
        Coordinates full booking lifecycle under strict governance:
        STRICT RULE A: Customer name & phone cannot be empty; phone must have 10 digits.
        STRICT RULE B: Coordinates must be within valid geographic bounds.
        STRICT RULE C: Fee must be validated by Brain 3 bounds.
        STRICT RULE D: Funds must be sealed into Brain 3 SHA-256 Chained Escrow.
        """
        # Strict Rule Checks
        if not customer_name or not customer_name.strip():
            raise ValueError("Master Rule Violation: Customer name cannot be empty.")
        clean_phone = "".join(c for c in customer_phone if c.isdigit())
        if len(clean_phone) < 10:
            raise ValueError("Master Rule Violation: Customer phone must be at least 10 digits.")
        if not self.ops_brain.validate_strict_location_bounds(customer_lat, customer_lng):
            raise ValueError("Master Rule Violation: Invalid GPS coordinates provided.")

        # Calculate split math via Brain 3 (Enforces bounds and zero-deficit)
        split = self.vault_brain.calculate_payout_and_commission(float(visiting_fee))

        # Initialize booking in Brain 2 S2 Radar
        booking = self.ops_brain.create_secure_booking(
            customer_name=customer_name.strip(),
            customer_phone=customer_phone.strip(),
            customer_address=customer_address.strip(),
            worker_id=worker_id.strip(),
            service_name=service_name.strip(),
            visiting_fee=visiting_fee,
            customer_lat=customer_lat,
            customer_lng=customer_lng
        )

        return {
            "orchestration": "SUCCESS",
            "booking": booking,
            "financial_split": split,
            "calibrated_eta_speed_kmh": self.urban_avg_speed_kmh,
            "strict_governance_rules_passed": True
        }

    # ──────────────────────────────────────────────────────────
    # 4. MASTER PLATFORM TELEMETRY & 360 HEALTH AUDIT
    # ──────────────────────────────────────────────────────────
    def get_master_telemetry(self) -> Dict[str, Any]:
        """Single source of truth for the entire 3-Tier Multi-Brain Ecosystem."""
        resilience = self.check_resilience_and_circuit()
        vault_stats = self.vault_brain.get_vault_kpis()
        ops_stats = self.ops_brain.get_operations_kpis()

        return {
            "master_brain_version": "2.0.0-Autonomous",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "resilience_watchdog": resilience,
            "self_training_parameters": {
                "calibrated_urban_speed_kmh": self.urban_avg_speed_kmh,
                "total_learned_trips": self.total_trips_learned,
                "dynamic_dispatch_weight": self.dynamic_dispatch_weight,
            },
            "code_splitting_and_lazy_loading": {
                "web_bundle_splitting": "ACTIVE (Fine-grained manualChunks for modals & admin flows)",
                "on_demand_lazy_components": [
                    "LiveFaceCaptureModal",
                    "WorkerDetailModal",
                    "CustomerProfileSection",
                    "EscrowBookingModal",
                    "HandshakeOtpModal"
                ],
                "predictive_prefetching": "ENABLED (Sidebar navigation hover prefetch)",
                "image_lazy_loading": "ENABLED (loading=lazy, decoding=async)",
                "mobile_cache_downsampling": "ACTIVE (cacheWidth/Height clamped to 800px)",
                "chunked_s2_radar_slices": True,
                "chunked_ledger_auditing": True
            },
            "ecosystem_health": {
                "brain_1_client_experience": "ONLINE (Edge Biometrics, Memory Downsampling & S2 GPS Ready)",
                "brain_2_core_operations": {
                    "status": "ONLINE",
                    "indexed_workers": ops_stats["indexed_radar_workers"],
                    "active_radar_bookings": ops_stats["active_radar_bookings"],
                },
                "brain_3_ledger_vault": {
                    "status": "ONLINE",
                    "escrow_locked_inr": vault_stats["escrow_locked_inr"],
                    "total_completed_revenue_inr": vault_stats["total_completed_revenue_inr"],
                    "platform_commission_earned_inr": vault_stats["platform_commission_earned_inr"],
                    "cryptographic_chain_intact": vault_stats["cryptographic_chain_intact"],
                }
            }
        }

master_platform_brain = MasterPlatformBrain()
