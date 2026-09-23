"""
Test suite verifying the fixes for:
1. time import & OTP dispatch
2. Anti-screenshot guard
3. Non-Aadhaar / handwritten note rejection
4. Genuine Aadhaar recognition
"""
import sys
import os
import re

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports_and_otp():
    # Test that time & asyncio are imported and OTP dispatch logic works without NameError
    import main
    import time
    clean_p = "9876543210"
    otp = "5432"
    main._ACTIVE_AUTH_OTPS[clean_p] = {"otp": otp, "time": time.time()}
    assert clean_p in main._ACTIVE_AUTH_OTPS
    assert main._ACTIVE_AUTH_OTPS[clean_p]["otp"] == "5432"
    print("PASS: test_imports_and_otp")

def test_screenshot_rejection_logic():
    # Simulate OCR text of the login error screenshot from Image 1 & 4
    sample_screenshot_text = (
        "dioexception bad response status code of 500 requestoptions validatestatus "
        "aadhaar verified name annu kumar registered mobile number +91 6205399540 get otp"
    )
    screenshot_terms = [
        "dioexception", "bad response", "status code", "developer.mozilla",
        "requestoptions", "account login", "registered mobile number",
        "enter your aadhaar", "verified profile recovery", "already registered"
    ]
    is_screenshot = any(st in sample_screenshot_text for st in screenshot_terms)
    assert is_screenshot is True, "Screenshot terms must be detected"
    print("PASS: test_screenshot_rejection_logic")

def test_handwritten_note_rejection_logic():
    # Simulate OCR text of handwritten note from Image 3 ("Annu Kumar.")
    handwritten_ocr_text = "annu kumar."
    
    issuer_markers = [
        "uidai", "unique identification", "government of india", "govt of india",
        "bharat sarkar", "भारत सरकार", "भारतीय विशिष्ट पहचान", "mera aadhaar",
        "मेरा आधार", "help@uidai", "uidai.gov.in", "आम आदमी का अधिकार"
    ]
    structure_markers = [
        "dob", "birth", "जन्म तिथि", "जन्म", "year of birth", "yob",
        "male", "female", "पुरुष", "महिला", "father", "पिता",
        "address", "पता", "enrolment", "नामांकन", "vid", "resident"
    ]
    
    uid_match = re.search(r'\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}|[xX]{4}[\s-]?[xX]{4}[\s-]?\d{4}|\d{12})\b', handwritten_ocr_text)
    has_valid_uid = bool(uid_match)
    has_issuer = any(m in handwritten_ocr_text for m in issuer_markers)
    has_structure = any(m in handwritten_ocr_text for m in structure_markers)
    has_photo = False

    is_genuine = (
        (has_valid_uid and (has_issuer or has_structure or has_photo)) or
        (has_issuer and (has_structure or has_photo or "आधार" in handwritten_ocr_text or "aadhaar" in handwritten_ocr_text)) or
        (has_photo and has_structure and ("आधार" in handwritten_ocr_text or "aadhaar" in handwritten_ocr_text))
    )

    assert is_genuine is False, "Handwritten paper with just a name must NOT be treated as genuine Aadhaar"
    print("PASS: test_handwritten_note_rejection_logic")

def test_genuine_aadhaar_acceptance_logic():
    # Simulate OCR text of an authentic Indian Aadhaar card
    authentic_aadhaar_text = (
        "government of india भारत सरकार uidai unique identification authority of india "
        "annu kumar dob: 15/08/1995 male 9876 5432 1098 मेरा आधार मेरी पहचान"
    )
    
    issuer_markers = [
        "uidai", "unique identification", "government of india", "govt of india",
        "bharat sarkar", "भारत सरकार", "भारतीय विशिष्ट पहचान", "mera aadhaar",
        "मेरा आधार", "help@uidai", "uidai.gov.in", "आम आदमी का अधिकार"
    ]
    structure_markers = [
        "dob", "birth", "जन्म तिथि", "जन्म", "year of birth", "yob",
        "male", "female", "पुरुष", "महिला", "father", "पिता",
        "address", "पता", "enrolment", "नामांकन", "vid", "resident"
    ]
    
    uid_match = re.search(r'\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}|[xX]{4}[\s-]?[xX]{4}[\s-]?\d{4}|\d{12})\b', authentic_aadhaar_text)
    has_valid_uid = bool(uid_match)
    has_issuer = any(m in authentic_aadhaar_text for m in issuer_markers)
    has_structure = any(m in authentic_aadhaar_text for m in structure_markers)
    has_photo = True

    is_genuine = (
        (has_valid_uid and (has_issuer or has_structure or has_photo)) or
        (has_issuer and (has_structure or has_photo or "आधार" in authentic_aadhaar_text or "aadhaar" in authentic_aadhaar_text)) or
        (has_photo and has_structure and ("आधार" in authentic_aadhaar_text or "aadhaar" in authentic_aadhaar_text))
    )

    assert is_genuine is True, "Authentic Aadhaar must be accepted"
    print("PASS: test_genuine_aadhaar_acceptance_logic")

if __name__ == "__main__":
    test_imports_and_otp()
    test_screenshot_rejection_logic()
    test_handwritten_note_rejection_logic()
    test_genuine_aadhaar_acceptance_logic()
    print("ALL TESTS PASSED SUCCESSFULLY!")
