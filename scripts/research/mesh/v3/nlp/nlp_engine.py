"""
MeSH Discovery Suite V3 - NLP Engine
Advanced text processing, topic modeling, and sentiment analysis.
"""
import logging
from typing import List, Dict, Optional

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    HAS_NLTK = True
except ImportError:
    HAS_NLTK = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
    from sklearn.decomposition import LatentDirichletAllocation
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

logger = logging.getLogger(__name__)

class NLPEngineV3:
    """
    Advanced NLP engine for analyzing PubMed titles and abstracts.
    """
    def __init__(self):
        self.sia = None
        if HAS_NLTK:
            try:
                nltk.download('vader_lexicon', quiet=True)
                self.sia = SentimentIntensityAnalyzer()
            except Exception as e:
                logger.warning(f"Failed to initialize NLTK Sentiment: {e}")

    def analyze_sentiment(self, texts: List[str]) -> Dict[str, float]:
        """
        Enhancement 33: Sentiment Analysis for identified papers/themes.
        """
        if not self.sia or not texts:
            return {"average_sentiment": 0.0, "status": "NLP_NOT_AVAILABLE"}

        scores = [self.sia.polarity_scores(t)['compound'] for t in texts]
        return {
            "average_sentiment": sum(scores) / len(scores) if scores else 0.0,
            "min": min(scores) if scores else 0.0,
            "max": max(scores) if scores else 0.0
        }

    def extract_keywords(self, texts: List[str], top_n: int = 10) -> List[str]:
        """
        Enhancement 31: Keyword extraction from titles/abstracts.
        """
        if not HAS_SKLEARN or not texts:
            return []

        try:
            vectorizer = TfidfVectorizer(stop_words='english', max_features=top_n)
            vectorizer.fit_transform(texts)
            return vectorizer.get_feature_names_out().tolist()
        except Exception as e:
            logger.error(f"Keyword extraction failed: {e}")
            return []

    def model_topics(self, texts: List[str], n_topics: int = 3) -> List[List[str]]:
        """
        Enhancement 32: Latent Dirichlet Allocation (LDA) for automated topic modeling.
        """
        if not HAS_SKLEARN or len(texts) < 5:
            return []

        try:
            vectorizer = CountVectorizer(stop_words='english')
            data_vectorized = vectorizer.fit_transform(texts)

            lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
            lda.fit(data_vectorized)

            feature_names = vectorizer.get_feature_names_out()
            topics = []
            for topic_idx, topic in enumerate(lda.components_):
                top_features_ind = topic.argsort()[:-6:-1]
                top_features = [feature_names[i] for i in top_features_ind]
                topics.append(top_features)

            return topics
        except Exception as e:
            logger.error(f"LDA Topic Modeling failed: {e}")
            return []

    def detect_emerging_entities(self, texts: List[str]) -> List[str]:
        """
        Enhancement 35: Named Entity Recognition (NER) for drugs/biomarkers.
        (Conceptual placeholder)
        """
        # In a full implementation, we'd use spaCy's 'en_core_sci_sm' or similar
        return ["Entity1", "Entity2"]

    def extract_themes(self, texts: List[str]) -> Dict[str, List[str]]:
        """
        Combines keyword extraction and topic modeling to extract high-level themes.
        """
        if not texts:
            return {"keywords": [], "topics": []}

        keywords = self.extract_keywords(texts, top_n=10)
        topics = self.model_topics(texts, n_topics=3)

        # Flatten topics for a simple theme list
        flat_topics = []
        for topic_list in topics:
            flat_topics.extend(topic_list)

        return {
            "keywords": keywords,
            "topics": list(set(flat_topics))
        }
