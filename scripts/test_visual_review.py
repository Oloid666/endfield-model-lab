"""Guard against unsupported scores, missing evidence and incompatible comparisons."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("visual_review", Path(__file__).with_name("visual-review.py"))
TOOL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TOOL)


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.packet = {"status": "complete", "capture": {"mode": "offline"},
                       "frames": [{"id": "01"}, {"id": "02"}]}
        self.review = TOOL.template(self.packet)

    def test_unknown_is_ungraded(self):
        TOOL.validate(self.packet, self.review)
        self.assertTrue(all(v is None for s in self.review["segments"] for v in s["scores"].values()))

    def test_missing_segment_rejected(self):
        self.review["segments"].pop()
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_invalid_scores_rejected(self):
        for value in [0, 6, True, "3", 2.5]:
            with self.subTest(value=value):
                self.review["segments"][0]["scores"]["story"] = value
                with self.assertRaises(ValueError):
                    TOOL.validate(self.packet, self.review)

    def test_offline_timing_rejected(self):
        self.review["segments"][0]["scores"]["timing"] = 4
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_incomplete_capture_rejected(self):
        self.packet["status"] = "failed"
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_nonexistent_evidence_rejected(self):
        self.review["findings"] = [{"id": "F01", "evidence": ["99"]}]
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_supplement_does_not_replace_main_segment(self):
        self.packet["supplementary_frames"] = [{"id": "01a"}]
        TOOL.validate(self.packet, self.review)
        self.review["segments"][0]["id"] = "01a"
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_duplicate_supplement_rejected(self):
        self.packet["supplementary_frames"] = [{"id": "01"}]
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_score_without_evidence_description_rejected(self):
        self.review["segments"][0].update(scores={**self.review["segments"][0]["scores"], "acting": 2}, summary="")
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_unknown_priority_rejected(self):
        self.review["top_priorities"] = ["made-up"]
        with self.assertRaises(ValueError):
            TOOL.validate(self.packet, self.review)

    def test_incompatible_comparison_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            before, after = root / "a", root / "b"
            before.mkdir()
            after.mkdir()
            TOOL.write(before / "packet.json", {**self.packet, "protocol": "portrait"})
            TOOL.write(after / "packet.json", {**self.packet, "protocol": "desktop"})
            with self.assertRaises(ValueError):
                TOOL.compare(before, after, root / "compare.html")

    def test_identical_runtime_not_claimed_improved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = {**self.packet, "protocol": "same", "source": {"runtime_sha256": "unchanged"},
                      "frames": [{"id": "01", "title": "same beat", "file": "01.jpg"}]}
            for name in ["a", "b"]:
                (root / name).mkdir()
                TOOL.write(root / name / "packet.json", packet)
            TOOL.compare(root / "a", root / "b", root / "compare.html")
            self.assertIn("不能宣稱改善", (root / "compare.html").read_text())

    def test_stills_report_does_not_claim_video(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = {**self.packet, "capture": {"mode": "stills"},
                      "profile": {"id": "photo", "title": "test fixture", "goal": "test still-only reporting"},
                      "source": {"commit": "fixture", "runtime_sha256": "fixture"},
                      "frames": [{"id": "01", "title": "fixture", "file": "fixture.jpg", "phase": "photo", "scene_seconds": 1}]}
            # File existence only: this test checks report claims, not image decoding.
            (root / "fixture.jpg").write_bytes(b"report fixture")
            TOOL.write(root / "packet.json", packet)
            TOOL.write(root / "review.json", TOOL.template(packet))
            TOOL.render_report(root)
            self.assertNotIn("preview.mp4", (root / "report.html").read_text())
            self.assertIn("本輪未錄影", (root / "report.md").read_text())

    def test_complete_report_requires_all_catalog_sections(self):
        spec = importlib.util.spec_from_file_location("visual_review_summary", Path(__file__).with_name("visual-review-summary.py"))
        summary = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(summary)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for key, _ in TOOL.CATALOG[:-1]:
                (root / key).mkdir()
                (root / key / "packet.json").write_text("{}")
                (root / key / "review.json").write_text("{}")
            with self.assertRaisesRegex(ValueError, "rating"):
                summary.scene_keys(root, True)

    def test_catalog_only_counts_reviewed_same_source_siblings(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            current=root/'loading'
            sibling=root/'photo'
            current.mkdir()
            sibling.mkdir()
            packet={"profile":{"id":"loading"},"source":{"runtime_sha256":"same"}}
            other={"status":"complete","source":{"runtime_sha256":"different"}}
            TOOL.write(sibling/'packet.json',other)
            TOOL.write(sibling/'review.json',{"status":"reviewed"})
            self.assertIn("未收錄",TOOL.catalog_status(current,packet,{"status":"reviewed"},'photo'))
            TOOL.write(sibling/'packet.json',{**other,"source":{"runtime_sha256":"same"}})
            self.assertIn("同批同版本",TOOL.catalog_status(current,packet,{"status":"reviewed"},'photo'))

    def test_reviewed_empty_findings_are_not_marked_unreviewed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            packet={"status":"complete","capture":{"mode":"stills"},
                "profile":{"id":"loading","title":"fixture","goal":"fixture"},
                "source":{"commit":"fixture","runtime_sha256":"fixture"},
                "frames":[{"id":"01","title":"fixture","file":"fixture.jpg"}]}
            (root/'fixture.jpg').write_bytes(b'fixture')
            review=TOOL.template(packet)
            review.update(status='reviewed',reviewer='fixture')
            TOOL.write(root/'packet.json',packet)
            TOOL.write(root/'review.json',review)
            TOOL.render_report(root)
            for name in ['report.html','report.md']:
                report=(root/name).read_text()
                self.assertIn('未發現需優先修正的明確問題',report)
                self.assertNotIn('尚未決定',report)


if __name__ == "__main__":
    unittest.main()
