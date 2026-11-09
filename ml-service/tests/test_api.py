from fastapi.testclient import TestClient

from app.main import app
from app.services.ocr_service import parse_text_fields

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_planned_endpoints_return_501():
    assert client.post("/scam/check").status_code == 501


def test_ocr_rejects_wrong_file_type():
    r = client.post("/ocr/extract", files={"file": ("a.txt", b"hello", "text/plain")})
    assert r.status_code == 400


def test_parse_aadhaar_text():
    text = "Government of India\nSunita Devi\nDOB: 10/03/1992\nFEMALE\n1234 5678 9012"
    doc_type, f = parse_text_fields(text)
    assert doc_type == "aadhaar"
    assert f.dateOfBirth == "1992-03-10"
    assert f.gender == "female"
    assert f.idLast4 == "9012"


def test_parse_hindi_gender():
    _, f = parse_text_fields("नाम: रवि\nपुरुष")
    assert f.gender == "male"


def test_parse_income_certificate():
    doc_type, f = parse_text_fields("INCOME CERTIFICATE\nAnnual income of the family is Rs. 1,20,000 only")
    assert doc_type == "income_certificate"
    assert f.annualIncome == 120000
