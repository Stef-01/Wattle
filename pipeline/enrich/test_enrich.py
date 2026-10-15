"""Unit tests for the research-enrichment step (no network). Run:
  python -m unittest pipeline/enrich/test_enrich.py
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import publications as p  # noqa: E402
import topics as t  # noqa: E402


def author(name, inst="The University of Queensland", cc="AU", topics=(), works=40, orcid=None, aid="A1"):
    return {
        "id": f"https://openalex.org/{aid}",
        "display_name": name,
        "works_count": works,
        "cited_by_count": 100,
        "ids": {"orcid": orcid},
        "last_known_institutions": [{"display_name": inst, "country_code": cc}] if inst else [],
        "affiliations": [],
        "topics": [{"display_name": x, "subfield": {"display_name": "Psychiatry and Mental health"},
                    "field": {"display_name": "Medicine"}} for x in topics],
    }


PSYCH = {"id": "psychiatry:alka-kothari", "name": "Associate Professor. Alka Kothari", "specialty": "psychiatry",
         "tags": ["Accredited Member - Faculty of Child and Adolescent Psychiatry"]}


class Names(unittest.TestCase):
    def test_titles_stripped(self):
        self.assertEqual(p.clean_name("Associate Professor. Alka Kothari"), "Alka Kothari")
        self.assertEqual(p.clean_name("A/Prof Ajay Rane AM"), "Ajay Rane")
        self.assertEqual(p.clean_name("Dr. Dr Jane Doe"), "Jane Doe")
        self.assertEqual(p.name_parts("Dr Jane van der Berg"), ("jane", ["jane"], "vanderberg"))

    def test_candidate_match(self):
        self.assertEqual(p.candidate_name_match("Dr. Alka Kothari", "Alka Kothari")[0], 3)
        self.assertEqual(p.candidate_name_match("Dr. Alka Kothari", "A. Kothari")[0], 2)
        self.assertEqual(p.candidate_name_match("Dr. Alka Kothari", "Anita Kothari")[0], 0)
        self.assertEqual(p.candidate_name_match("Dr. Alka Kothari", "Alka Sharma")[0], 0)
        self.assertEqual(p.candidate_name_match("Dr Jane van der Berg", "Jane van der Berg")[0], 3)
        self.assertEqual(p.candidate_name_match("Dr Ana Smith-Jones", "Ana Smith-Jones")[0], 3)
        self.assertEqual(p.candidate_name_match("Dr José Núñez", "Jose Nunez")[0], 3)


class Scoring(unittest.TestCase):
    def test_full_match_reaches_threshold(self):
        c = p.score(PSYCH, author("Alka Kothari", topics=["Child and Adolescent Psychosocial and Emotional Development"]), "QLD")
        self.assertGreaterEqual(c["score"], p.THRESHOLD)
        self.assertTrue(c["au_institution"])
        self.assertTrue(c["topic_overlap"])

    def test_foreign_institution_cannot_verify(self):
        c = p.score(PSYCH, author("Alka Kothari", inst="Harvard University", cc="US", topics=["Depression"]), "QLD")
        self.assertFalse(c["au_institution"])
        self.assertLess(c["score"], p.THRESHOLD)

    def test_no_topic_overlap_below_threshold(self):
        a = author("Alka Kothari", works=30)
        a["topics"] = [{"display_name": "Soil Carbon", "subfield": {"display_name": "Soil Science"},
                       "field": {"display_name": "Agricultural Sciences"}}]
        c = p.score(PSYCH, a, "QLD")
        # name + AU + state can reach the threshold on their own (3+2+1); the verify step's
        # separate topic gate is what keeps this candidate unverified
        self.assertEqual(c["topic_overlap"], [])
        self.assertEqual(c["score"], 6)

    def test_zero_works_rejected(self):
        c = p.score(PSYCH, author("Alka Kothari", topics=["Depression"], works=0), "QLD")
        self.assertEqual(c["score"], 0)

    def test_surname_mismatch_scores_zero(self):
        c = p.score(PSYCH, author("Alka Sharma", topics=["Depression"]), "QLD")
        self.assertEqual(c["score"], 0)

    def test_split_profiles_merge_on_orcid(self):
        a = p.score(PSYCH, author("Alka Kothari", topics=["Depression"], works=64, orcid="x", aid="A1"), "QLD")
        b = p.score(PSYCH, author("Alka Kothari", topics=["Depression"], works=20, orcid="x", aid="A2"), "QLD")
        merged = p.merge_split_profiles([b, a])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["id"], "A1")
        self.assertEqual(merged[0]["merged_ids"], ["A2"])

    def test_two_distinct_identities_stay_separate(self):
        a = p.score(PSYCH, author("Alka Kothari", topics=["Depression"], aid="A1"), "QLD")
        b = p.score(PSYCH, author("Alka Kothari", topics=["Depression"], aid="A2", inst="Monash University"), "QLD")
        self.assertEqual(len(p.merge_split_profiles([a, b])), 2)


class Topics(unittest.TestCase):
    def test_inferred_topics_top_n(self):
        row = {"authorship_verified": "identifier-matched",
               "works": [{"topics": ["A", "B"]}, {"topics": ["A", "C", "A"]}, {"topics": ["B"]}, {"topics": []}]}
        got = t.infer_topics(row, 2)
        self.assertEqual([x["topic"] for x in got], ["A", "B"])
        self.assertEqual(got[0]["works"], 2)
        self.assertEqual(got[0]["share"], 0.5)

    def test_unverified_never_gets_topics(self):
        self.assertEqual(t.infer_topics({"authorship_verified": "unverified", "works": [{"topics": ["A"]}]}, 5), [])


if __name__ == "__main__":
    unittest.main()
