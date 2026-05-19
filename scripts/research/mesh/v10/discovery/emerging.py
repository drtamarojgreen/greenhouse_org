"""
MeSH Discovery & Systematic Review Suite V10 - Emerging Discovery
Burst detection, digital health early signals, preprint monitoring, recency-weighted novelty,
disruption indices, topic-drifts, grant landscape alignments, and monthly briefings.
Features: 61 - 80
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import time
from scripts.research.mesh.v10.infrastructure.api_clients import ExternalAPIFetcher

@dataclass
class DiscoveryTermRecord:
    """
    Data model representing a discovered research term or concept.
    """
    term: str
    counts: List[int]
    years: List[int]
    volume_total: int
    cagr: float
    is_preprint: bool = False
    citation_count: int = 0
    direct_citations: int = 0
    indirect_citations: int = 0 # used for disruption index

    def calculate_disruption_index(self) -> float:
        """
        Calculates disruption index (Feature 67).
        DI = (F - B) / (F + B + N) where:
        F = citations received ONLY by this paper.
        B = citations received by BOTH this paper and its references.
        N = citations received by references but NOT this paper.
        Simulated using direct vs indirect citation weights.
        """
        f = self.direct_citations
        b = int(self.citation_count * 0.1)
        n = self.indirect_citations
        denom = f + b + n
        if denom <= 0:
            return 0.0
        return round((f - b) / denom, 3)

    def calculate_novelty_score(self) -> float:
        """
        Novelty score combining recency and volume penalties (Feature 66).
        """
        if not self.counts:
            return 0.0
        # Recency: growth in last 2 years
        recent = sum(self.counts[-2:])
        avg_hist = np.mean(self.counts[:-2]) if len(self.counts) > 2 else 1.0
        recency_growth = (recent / avg_hist) if avg_hist > 0 else 1.0
        
        # Volume penalty: less volume = higher novelty
        vol_penalty = 1.0 / (1.0 + np.log1p(self.volume_total))
        score = (recency_growth * 0.6) + (vol_penalty * 40.0)
        return round(float(min(max(score, 0.0), 100.0)), 2)


class EmergingDiscoveryEngine:
    """
    Engine to identify accelerating concepts and horizon-scanning signals.
    """
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("discovery_emerging", {})
        self.terms: List[DiscoveryTermRecord] = []

    def load_terms(self, raw_data: List[Dict[str, Any]]):
        for item in raw_data:
            rec = DiscoveryTermRecord(
                term=item["term"],
                counts=item["counts"],
                years=item["years"],
                volume_total=sum(item["counts"]),
                cagr=item.get("cagr", 10.0),
                is_preprint=item.get("is_preprint", False),
                citation_count=item.get("citations", 12),
                direct_citations=item.get("direct_citations", 5),
                indirect_citations=item.get("indirect_citations", 18)
            )
            self.terms.append(rec)

    def detect_bursts(self) -> List[Dict[str, Any]]:
        """
        Burst detection for newly accelerating terms (Feature 61).
        Checks if growth in the most recent interval exceeds historic bounds by multiplier.
        """
        bursts = []
        multiplier = self.config.get("burst_detection", {}).get("growth_multiplier", 1.5)
        
        for t in self.terms:
            if len(t.counts) < 3: continue
            
            recent = t.counts[-1]
            hist_mean = np.mean(t.counts[:-1])
            hist_std = np.std(t.counts[:-1])
            
            # Burst definition: recent > hist_mean + multiplier * hist_std
            if recent > (hist_mean + multiplier * max(hist_std, 1.0)) and recent > 10:
                bursts.append({
                    "term": t.term,
                    "recent_count": recent,
                    "historical_mean": round(float(hist_mean), 2),
                    "growth_ratio": round(float(recent / hist_mean), 2) if hist_mean > 0 else 1.0,
                    "burst_status": "HIGH ACCELERATION"
                })
        return bursts

    def get_weak_signal_queue(self) -> List[Dict[str, Any]]:
        """
        Filters weak-signal queues (low-volume, high-growth mechanistic hypotheses) (Feature 63).
        """
        queue = []
        for t in self.terms:
            # Low volume (< 150 total) but high growth (CAGR > 25.0%)
            if 5 < t.volume_total < 150 and t.cagr >= 25.0:
                queue.append({
                    "term": t.term,
                    "total_volume": t.volume_total,
                    "cagr": t.cagr,
                    "novelty_score": t.calculate_novelty_score(),
                    "priority": "HIGH" if t.cagr >= 40.0 else "MEDIUM"
                })
        return sorted(queue, key=lambda x: x["cagr"], reverse=True)

    def track_digital_therapeutics(self) -> List[Dict[str, Any]]:
        """
        Tracks early-signals for digital therapeutics and remote care models (Feature 62).
        """
        digital_keywords = ["digital therapeutic", "remote care", "telehealth", "app-based", "neurofeedback", "wearable"]
        signals = []
        for t in self.terms:
            if any(k in t.term.lower() for k in digital_keywords):
                signals.append({
                    "concept": t.term,
                    "evidence_weight": t.volume_total,
                    "cagr": t.cagr,
                    "disruption_index": t.calculate_disruption_index()
                })
        return signals

    def track_preprints(self) -> List[Dict[str, Any]]:
        """
        Tracks preprints with downstream publication follow-through (Feature 65).
        """
        preprints = []
        for t in self.terms:
            if t.is_preprint:
                # Downstream follow-through matches (heuristically check if published downstream)
                has_published_counterpart = t.volume_total > 40
                preprints.append({
                    "preprint_title": f"Preprint: {t.term}",
                    "citations": t.citation_count,
                    "published_downstream": has_published_counterpart,
                    "follow_through_status": "Published in peer-review" if has_published_counterpart else "Preprint-Only"
                })
        return preprints

    def identify_contradictions(self) -> List[Dict[str, Any]]:
        """
        Contradiction detection to surface rapidly contested topics (Feature 68).
        """
        contradictions = []
        for t in self.terms:
            # Simulated high-contestation based on low disruption index and average citations
            # Contradictory cite is high when direct citations mirror indirect conflict
            if t.direct_citations > 0 and (t.indirect_citations / t.direct_citations) > 2.0:
                contradictions.append({
                    "term": t.term,
                    "ratio": round(t.indirect_citations / t.direct_citations, 2),
                    "status": "CONTESTED HYPOTHESIS",
                    "notes": "High conflict ratio in downstream citations."
                })
        return contradictions

    def decompose_trends(self, term_name: str) -> Dict[str, Any]:
        """
        Trend decomposition separating temporary spikes from sustained growth (Feature 69).
        Splits counts into baseline trend, seasonal/temporary spikes, and residuals.
        """
        t = next((x for x in self.terms if x.term.lower() == term_name.lower()), None)
        if not t or len(t.counts) < 5:
            return {"error": "Insufficient timeseries data for trend decomposition."}
            
        counts = np.array(t.counts, dtype=float)
        # Use simple moving average as baseline trend
        trend = np.convolve(counts, np.ones(3)/3, mode='same')
        # Handle borders
        trend[0] = counts[0]
        trend[-1] = counts[-1]
        
        spikes = counts - trend
        sustained = bool(np.mean(np.diff(trend)) > 0)
        
        return {
            "term": term_name,
            "sustained_growth": sustained,
            "trend_baseline": [round(float(v), 2) for v in trend],
            "temporary_spikes": [round(float(v), 2) for v in spikes]
        }

    def get_translational_readiness(self) -> List[Dict[str, Any]]:
        """
        Translational readiness scoring for emerging intervention ideas (Feature 76, 77).
        """
        readiness = []
        for t in self.terms:
            score = 1
            if t.volume_total >= 50: score += 1
            if t.volume_total >= 200: score += 1
            if t.citation_count >= 100: score += 1
            
            # Evidence aging metric (Features 77)
            # More publications in last year = younger evidence age (healthy update cycle)
            recent_ratio = t.counts[-1] / t.volume_total if t.volume_total > 0 else 0.0
            needs_update = "YES" if recent_ratio < 0.05 and t.volume_total > 100 else "NO"
            
            readiness.append({
                "concept": t.term,
                "readiness_tier": f"T{score}",
                "evidence_age_index": round(1.0 - recent_ratio, 2),
                "needs_rapid_update": needs_update
            })
        return readiness

    def get_watchlists(self) -> Dict[str, List[str]]:
        """
        Returns watchlists for underrepresented populations dynamically using PubMed metadata (Feature 79).
        """
        pubmed_info = ExternalAPIFetcher.fetch_pubmed_metadata(["34218945"])
        details = list(pubmed_info.values())[0]
        return {
            "Pediatric_Subgroups": [f"Children & Youth (Subgroup: {details['subgroup']})"],
            "Geriatric_Subgroups": ["Late-onset diagnostic presentations"],
            "Underserved_Geography": ["Rural primary healthcare settings", "Public schools lacking clinical specialists"]
        }

    def generate_monthly_brief(self) -> str:
        """
        Generates monthly emerging-topic brief dynamically pulling openFDA and PubMed context (Feature 80).
        """
        bursts = self.detect_bursts()
        weak = self.get_weak_signal_queue()
        drug = ExternalAPIFetcher.fetch_opendrug_metadata("Concerta")
            
        brief = (
            "# Monthly Emerging Research Briefing\n"
            f"Generated: {time.strftime('%Y-%m-%d')}\n\n"
            f"Focus Drug context: {drug['brand_name']} ({drug['generic_name']})\n\n"
            "## 1. High-Growth Research Bursts\n"
        )
        for b in bursts[:3]:
            brief += f"- **{b['term']}**: Growth Ratio {b['growth_ratio']}x ({b['recent_count']} recent pubs)\n"
            
        brief += "\n## 2. Weak-Signal Watchlist (Low volume, high CAGR)\n"
        for w in weak[:3]:
            brief += f"- **{w['term']}**: Total volume={w['total_volume']}, CAGR={w['cagr']}%, Novelty={w['novelty_score']}\n"
            
        brief += (
            "\n## 3. Recommended Actions\n"
            f"- Evaluate potential interactions with {drug['generic_name']} approved indications.\n"
            "- Allocate systematic review capacity to investigate burst terms.\n"
            "- Add weak-signal terms to search fixtures.\n"
        )
        return brief
