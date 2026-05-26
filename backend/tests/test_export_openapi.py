from pathlib import Path

from young_certi_api.export_openapi import render_openapi


def test_export_openapi_matches_contract() -> None:
    root = Path(__file__).resolve().parents[2]

    assert render_openapi() == (root / "specs/001-question-practice/contracts/openapi.yaml").read_text()

