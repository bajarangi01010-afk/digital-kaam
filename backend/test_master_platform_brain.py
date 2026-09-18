"""
Advanced Test Suite for Digital Kaam Master Platform Brain
Tests all core functionality including self-training, resilience, dispatch lifecycle, and telemetry.
"""

import os
import sys
import tempfile
import time
import sqlite3
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

# Add project root to path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set environment variables for testing
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'  # Use in-memory SQLite for testing
os.environ['REDIS_URL'] = ''  # Disable Redis for isolated testing

import pytest
import database
from master_platform_brain import (
    MasterPlatformBrain,
    master_platform_brain,
    _init_master_learning_tables
)
from core_operations_brain import core_operations_dispatch_brain
from financial_ledger_brain import financial_ledger_vault_brain


class TestMasterPlatformBrain:
    """Test suite for the Master Platform Brain orchestrator."""

    @classmethod
    def setup_class(cls):
        """Set up test database and initialize brains."""
        # Create a fresh in-memory database for testing
        cls.test_db_fd, cls.test_db_path = tempfile.mkstemp(suffix='.db')
        os.environ['DATABASE_FILE'] = cls.test_db_path

        # Re-initialize database with test schema
        database.DB_FILE = cls.test_db_path
        database.init_db()

        # Initialize master brain tables
        _init_master_learning_tables()

        # Create test master brain instance
        cls.master_brain = MasterPlatformBrain()

    @classmethod
    def teardown_class(cls):
        """Clean up test database."""
        if hasattr(cls, 'test_db_fd'):
            os.close(cls.test_db_fd)
        if hasattr(cls, 'test_db_path') and os.path.exists(cls.test_db_path):
            os.unlink(cls.test_db_path)

    def setup_method(self):
        """Reset state before each test."""
        # Clear learning state
        conn = database.get_db_connection()
        conn.execute("DELETE FROM master_learning_state")
        conn.execute("""
            INSERT INTO master_learning_state (
                id, urban_avg_speed_kmh, total_trips_learned, fraud_risk_threshold,
                dynamic_dispatch_weight, last_trained_at, active_circuit_status
            ) VALUES ('MASTER_STATE', 22.0, 0, 0.85, 1.0, ?, 'NORMAL_HEALTHY')
        """, (time.time(),))
        conn.commit()
        conn.close()

        # Clear other tables for clean state
        conn = database.get_db_connection()
        conn.execute("DELETE FROM bookings")
        conn.execute("DELETE FROM workers")
        conn.execute("DELETE FROM escrow_transactions")
        conn.commit()
        conn.close()

        # Reload brain state from freshly initialized DB
        self.master_brain._load_learning_state()

    def test_master_brain_initialization(self):
        """Test that MasterPlatformBrain initializes and loads state correctly."""
        brain = MasterPlatformBrain()

        # Should have loaded default state
        assert brain.urban_avg_speed_kmh == 22.0
        assert brain.total_trips_learned == 0
        assert brain.fraud_risk_threshold == 0.85
        assert brain.dynamic_dispatch_weight == 1.0
        assert brain.circuit_state == "NORMAL_HEALTHY"

        # Should have references to sub-brains
        assert brain.ops_brain is not None
        assert brain.vault_brain is not None

    def test_self_training_cycle_with_empty_db(self):
        """Test self-training cycle when database is empty."""
        result = self.master_brain.run_self_training_cycle()

        assert result["training_status"] == "COMPLETED"
        assert result["completed_trips_analyzed"] == 0
        assert result["calibrated_urban_speed_kmh"] == 22.0  # Default unchanged
        assert result["total_learned_trips_all_time"] == 0
        assert result["dynamic_dispatch_weight"] == 1.0
        assert "timestamp" in result

    def test_self_training_cycle_with_synthetic_data(self):
        """Test self-training cycle with synthetic completed bookings."""
        # Insert synthetic completed bookings into test database
        conn = database.get_db_connection()
        base_time = time.time() - 86400  # Yesterday

        test_bookings = [
            # (booking_id, distance_km, eta_minutes, created_at, updated_at)
            ("BK-TEST-001", 5.0, 15, base_time, base_time + 900),   # 12 km/h (5km in 15min)
            ("BK-TEST-002", 10.0, 20, base_time + 100, base_time + 1300),  # 30 km/h
            ("BK-TEST-003", 3.0, 10, base_time + 200, base_time + 800),   # 18 km/h
        ]

        for bid, distance, eta, created, updated in test_bookings:
            conn.execute("""
                INSERT INTO bookings (
                    booking_id, customer_name, customer_phone, customer_address,
                    worker_id, service_name, visiting_fee, escrow_status,
                    start_otp, end_otp, tracking_status, distance_km, eta_minutes,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                bid, "Test Customer", "9998887770", "Test Address",
                "WORKER-001", "Plumbing", 500, "RELEASED",
                "1234", "5678", "COMPLETED", distance, eta, created, updated
            ))

        # Add test workers
        conn.execute("""
            INSERT INTO workers (
                worker_id, name, skill, phone, rating, total_jobs, visiting_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("WORKER-001", "Test Worker", "Plumbing", "9998886660", 4.5, 10, 500))

        conn.commit()
        conn.close()

        # Run self-training cycle
        result = self.master_brain.run_self_training_cycle()

        # Verify results
        assert result["training_status"] == "COMPLETED"
        assert result["completed_trips_analyzed"] == 3
        assert result["calibrated_urban_speed_kmh"] > 22.0  # Should be updated from synthetic data
        assert result["total_learned_trips_all_time"] == 3
        # Dynamic dispatch weight should be based on worker rating (4.5/4.5 = 1.0, clamped 0.8-1.5)
        assert 0.8 <= result["dynamic_dispatch_weight"] <= 1.5

    def test_circuit_breaker_ledger_tamper_detection(self):
        """Test circuit breaker detects ledger tampering."""
        # First, verify ledger is intact
        resilience = self.master_brain.check_resilience_and_circuit()
        assert resilience["master_status"] == "NORMAL_HEALTHY"
        assert resilience["is_tamper_detected"] == False
        assert resilience["database_persistent_alive"] == True

        # Record a valid transaction first to establish an intact ledger entry
        self.master_brain.vault_brain.record_transaction("BK-TAMPER-001", "LOCK", 500.0, 50.0)

        # Now tamper with the ledger by directly modifying hash
        conn = database.get_db_connection()
        tx = conn.execute("SELECT * FROM escrow_transactions ORDER BY created_at DESC LIMIT 1").fetchone()
        if tx:
            # Modify the curr_hash to break the chain
            conn.execute(
                "UPDATE escrow_transactions SET curr_hash = 'tampered_hash_12345' WHERE tx_id = ?",
                (tx["tx_id"],)
            )
            conn.commit()
        conn.close()

        # Check that circuit breaker detects tamper
        resilience = self.master_brain.check_resilience_and_circuit()
        assert resilience["master_status"] == "TAMPER_DETECTED_LOCKDOWN"
        assert resilience["is_tamper_detected"] == True
        assert len(resilience["tamper_issues"]) > 0
        assert resilience["autonomous_survival_mode"] == "ACTIVE (Decoupled)"

    def test_circuit_breaker_database_disconnect(self):
        """Test circuit breaker handles database disconnect."""
        # Temporarily make database unavailable by pointing to invalid path
        original_db_file = database.DB_FILE
        database.DB_FILE = "/invalid/path/that/does/not/exist.db"

        try:
            resilience = self.master_brain.check_resilience_and_circuit()
            assert resilience["master_status"] == "DATABASE_DISCONNECTED_FALLBACK"
            assert resilience["database_persistent_alive"] == False
            assert resilience["autonomous_survival_mode"] == "ACTIVE (Decoupled)"
        finally:
            # Restore original database
            database.DB_FILE = original_db_file

    def test_dispatch_full_lifecycle_valid_inputs(self):
        """Test successful end-to-end booking dispatch with valid inputs."""
        # Insert test data needed for dispatch
        conn = database.get_db_connection()

        # Insert test worker
        conn.execute("""
            INSERT INTO workers (
                worker_id, name, skill, phone, rating, total_jobs, visiting_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("WKR-TEST-001", "Test Worker", "Electrician", "9998887770", 4.8, 25, 1000))

        # Ensure ledger is intact for financial validation
        financial_ledger_vault_brain.verify_ledger_integrity()

        conn.commit()
        conn.close()

        # Test dispatch with valid inputs
        result = self.master_brain.dispatch_full_lifecycle(
            customer_name="Rahul Sharma",
            customer_phone="9876543210",
            customer_address="123 MG Road, Bangalore",
            worker_id="WKR-TEST-001",
            service_name="Electrical Repair",
            visiting_fee=1500,
            customer_lat=12.9716,
            customer_lng=77.5946  # Bangalore coordinates
        )

        # Verify successful orchestration
        assert result["orchestration"] == "SUCCESS"
        assert "booking" in result
        assert result["booking"]["booking_id"] is not None
        assert result["booking"]["customer_name"] == "Rahul Sharma"
        assert result["booking"]["customer_phone"] == "9876543210"
        assert result["booking"]["worker_id"] == "WKR-TEST-001"
        assert result["financial_split"]["gross_amount"] == 1500.0
        assert result["financial_split"]["platform_commission"] == 150.0  # 10%
        assert result["financial_split"]["worker_net_payout"] == 1350.0  # 90%
        assert result["calibrated_eta_speed_kmh"] == self.master_brain.urban_avg_speed_kmh
        assert result["strict_governance_rules_passed"] == True

        # Verify booking was saved in database
        bookings = database.get_all_bookings()
        assert len(bookings) == 1
        booking = bookings[0]
        assert booking["customer_name"] == "Rahul Sharma"
        assert booking["worker_id"] == "WKR-TEST-001"
        assert booking["visiting_fee"] == 1500
        assert booking["escrow_status"] == "LOCKED"

    def test_dispatch_full_lifecycle_invalid_customer_name(self):
        """Test dispatch fails with empty customer name."""
        with pytest.raises(ValueError, match="Customer name cannot be empty"):
            self.master_brain.dispatch_full_lifecycle(
                customer_name="",  # Empty name
                customer_phone="9876543210",
                customer_address="Test Address",
                worker_id="WKR-TEST-001",
                service_name="Test Service",
                visiting_fee=500,
                customer_lat=12.9716,
                customer_lng=77.5946
            )

    def test_dispatch_full_lifecycle_invalid_phone(self):
        """Test dispatch fails with invalid phone number."""
        with pytest.raises(ValueError, match="Customer phone must be at least 10 digits"):
            self.master_brain.dispatch_full_lifecycle(
                customer_name="Test User",
                customer_phone="12345",  # Too short
                customer_address="Test Address",
                worker_id="WKR-TEST-001",
                service_name="Test Service",
                visiting_fee=500,
                customer_lat=12.9716,
                customer_lng=77.5946
            )

    def test_dispatch_full_lifecycle_invalid_coordinates(self):
        """Test dispatch fails with invalid GPS coordinates."""
        with pytest.raises(ValueError, match="Invalid GPS coordinates provided"):
            self.master_brain.dispatch_full_lifecycle(
                customer_name="Test User",
                customer_phone="9876543210",
                customer_address="Test Address",
                worker_id="WKR-TEST-001",
                service_name="Test Service",
                visiting_fee=500,
                customer_lat=91.0,  # Invalid latitude > 90
                customer_lng=77.5946
            )

        with pytest.raises(ValueError, match="Invalid GPS coordinates provided"):
            self.master_brain.dispatch_full_lifecycle(
                customer_name="Test User",
                customer_phone="9876543210",
                customer_address="Test Address",
                worker_id="WKR-TEST-001",
                service_name="Test Service",
                visiting_fee=500,
                customer_lat=12.9716,
                customer_lng=181.0  # Invalid longitude > 180
            )

    def test_dispatch_full_lifecycle_financial_rule_violation(self):
        """Test dispatch respects financial transaction bounds."""
        # Test amount below minimum (₹10)
        with pytest.raises(Exception):  # FinancialRuleViolation from Brain 3
            self.master_brain.dispatch_full_lifecycle(
                customer_name="Test User",
                customer_phone="9876543210",
                customer_address="Test Address",
                worker_id="WKR-TEST-001",
                service_name="Test Service",
                visiting_fee=5,  # Below ₹10 minimum
                customer_lat=12.9716,
                customer_lng=77.5946
            )

        # Test amount above maximum (₹50,000)
        with pytest.raises(Exception):  # FinancialRuleViolation from Brain 3
            self.master_brain.dispatch_full_lifecycle(
                customer_name="Test User",
                customer_phone="9876543210",
                customer_address="Test Address",
                worker_id="WKR-TEST-001",
                service_name="Test Service",
                visiting_fee=60000,  # Above ₹50,000 maximum
                customer_lat=12.9716,
                customer_lng=77.5946
            )

    def test_master_telemetry_comprehensive(self):
        """Test 360° master telemetry returns complete health snapshot."""
        # Set up test data
        conn = database.get_db_connection()

        # Add test worker
        conn.execute("""
            INSERT INTO workers (
                worker_id, name, skill, phone, rating, total_jobs, visiting_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("WKR-TELEM-001", "Telemetry Test", "Carpenter", "9998887771", 4.7, 15, 800))

        # Add test booking
        conn.execute("""
            INSERT INTO bookings (
                booking_id, customer_name, customer_phone, customer_address,
                worker_id, service_name, visiting_fee, escrow_status,
                start_otp, end_otp, tracking_status, distance_km, eta_minutes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "BK-TELEM-001", "Priya Patel", "9876543210", "456 Park Street",
            "WKR-TELEM-001", "Furniture Assembly", 1200, "LOCKED",
            "1111", "2222", "ON_THE_WAY", 2.5, 15, time.time()-100, time.time()
        ))

        conn.commit()
        conn.close()

        # Get telemetry
        telemetry = self.master_brain.get_master_telemetry()

        # Verify structure
        assert telemetry["master_brain_version"] == "2.0.0-Autonomous"
        assert "timestamp" in telemetry
        assert "resilience_watchdog" in telemetry
        assert "self_training_parameters" in telemetry
        assert "code_splitting_and_lazy_loading" in telemetry
        assert "ecosystem_health" in telemetry

        # Verify resilience watchdog
        resilience = telemetry["resilience_watchdog"]
        assert "master_status" in resilience
        assert "is_tamper_detected" in resilience
        assert "database_persistent_alive" in resilience

        # Verify self-training parameters
        training = telemetry["self_training_parameters"]
        assert "calibrated_urban_speed_kmh" in training
        assert "total_learned_trips" in training
        assert "dynamic_dispatch_weight" in training

        # Verify code splitting info
        code_splitting = telemetry["code_splitting_and_lazy_loading"]
        assert "web_bundle_splitting" in code_splitting
        assert "on_demand_lazy_components" in code_splitting
        assert isinstance(code_splitting["on_demand_lazy_components"], list)
        assert "LiveFaceCaptureModal" in code_splitting["on_demand_lazy_components"]

        # Verify ecosystem health
        ecosystem = telemetry["ecosystem_health"]
        assert ecosystem["brain_1_client_experience"] == "ONLINE (Edge Biometrics, Memory Downsampling & S2 GPS Ready)"
        assert ecosystem["brain_2_core_operations"]["status"] == "ONLINE"
        assert ecosystem["brain_2_core_operations"]["indexed_workers"] >= 1
        assert ecosystem["brain_3_ledger_vault"]["status"] == "ONLINE"
        assert ecosystem["brain_3_ledger_vault"]["escrow_locked_inr"] >= 0
        assert ecosystem["brain_3_ledger_vault"]["total_completed_revenue_inr"] >= 0
        assert ecosystem["brain_3_ledger_vault"]["platform_commission_earned_inr"] >= 0
        assert "cryptographic_chain_intact" in ecosystem["brain_3_ledger_vault"]

    def test_urban_speed_calculation_edge_cases(self):
        """Test self-training handles edge cases in speed calculation."""
        conn = database.get_db_connection()
        base_time = time.time()

        # Test case 1: Too short time (less than 2 minutes) - should be filtered out
        conn.execute("""
            INSERT INTO bookings (
                booking_id, customer_name, customer_phone, customer_address,
                worker_id, service_name, visiting_fee, escrow_status,
                start_otp, end_otp, tracking_status, distance_km, eta_minutes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "BK-EDGE-001", "Test User", "9998887772", "Test Address",
            "WKR-EDGE-001", "Test Service", 200, "RELEASED",
            "1111", "2222", "COMPLETED", 1.0, 1,  # 1km in 1min = 60km/h but time too short
            base_time, base_time + 60
        ))

        # Test case 2: Too long time (more than 4 hours) - should be filtered out
        conn.execute("""
            INSERT INTO bookings (
                booking_id, customer_name, customer_phone, customer_address,
                worker_id, service_name, visiting_fee, escrow_status,
                start_otp, end_otp, tracking_status, distance_km, eta_minutes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "BK-EDGE-002", "Test User", "9998887773", "Test Address",
            "WKR-EDGE-002", "Test Service", 300, "RELEASED",
            "3333", "4444", "COMPLETED", 50.0, 240,  # 50km in 4h = 12.5km/h but time too long
            base_time + 100, base_time + 100 + (240 * 60)
        ))

        # Test case 3: Unrealistic speed (outside 5-60 km/h range) - should be filtered out
        conn.execute("""
            INSERT INTO bookings (
                booking_id, customer_name, customer_phone, customer_address,
                worker_id, service_name, visiting_fee, escrow_status,
                start_otp, end_otp, tracking_status, distance_km, eta_minutes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "BK-EDGE-003", "Test User", "9998887774", "Test Address",
            "WKR-EDGE-003", "Test Service", 150, "RELEASED",
            "5555", "6666", "COMPLETED", 100.0, 30,  # 100km in 30min = 200km/h - too fast
            base_time + 200, base_time + 200 + (30 * 60)
        ))

        conn.commit()
        conn.close()

        # Run self-training - should process 0 valid trips
        result = self.master_brain.run_self_training_cycle()

        assert result["completed_trips_analyzed"] == 3  # All 3 bookings found
        assert result["total_learned_trips_all_time"] == 0  # But 0 valid trips after filtering
        assert result["calibrated_urban_speed_kmh"] == 22.0  # Should remain unchanged

    def test_dynamic_dispatch_weight_calculation(self):
        """Test dynamic dispatch weight calculation based on worker ratings."""
        conn = database.get_db_connection()

        # Test with high-rated workers
        conn.execute("""
            INSERT INTO workers (
                worker_id, name, skill, phone, rating, total_jobs, visiting_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("WKR-HIGH-001", "Expert Worker", "Expert Skill", "9998887773", 4.9, 50, 1500))

        conn.execute("""
            INSERT INTO workers (
                worker_id, name, skill, phone, rating, total_jobs, visiting_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("WKR-HIGH-002", "Pro Worker", "Pro Skill", "9998887774", 4.8, 40, 1200))

        conn.commit()
        conn.close()

        # Run self-training to calculate dispatch weight
        result = self.master_brain.run_self_training_cycle()

        # Average rating = (4.9 + 4.8) / 2 = 4.85
        # dynamic_dispatch_weight = min(1.5, max(0.8, avg_rating / 4.5))
        # = min(1.5, max(0.8, 4.85 / 4.5))
        # = min(1.5, max(0.8, 1.077))
        # = min(1.5, 1.077) = 1.077
        expected_weight = round(min(1.5, max(0.8, 4.85 / 4.5)), 3)

        assert result["dynamic_dispatch_weight"] == expected_weight
        assert 0.8 <= result["dynamic_dispatch_weight"] <= 1.5

    def test_fraud_risk_threshold_persistence(self):
        """Test that fraud risk threshold is properly persisted and loaded."""
        # Update fraud risk threshold in database
        conn = database.get_db_connection()
        conn.execute("""
            UPDATE master_learning_state
            SET fraud_risk_threshold = 0.92
            WHERE id = 'MASTER_STATE'
        """)
        conn.commit()
        conn.close()

        # Create new brain instance to test loading
        new_brain = MasterPlatformBrain()
        assert new_brain.fraud_risk_threshold == 0.92

        # Test that it's used in self-training (doesn't crash)
        result = new_brain.run_self_training_cycle()
        assert result["training_status"] == "COMPLETED"


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "--tb=short"])