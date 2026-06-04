"""
Advanced Clustering & Feature Engineering Module
Enterprise-level improvements for feedback analysis
"""

import re
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sentence_transformers import SentenceTransformer
from sklearn.cluster import HDBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score, davies_bouldin_score
from scipy.spatial.distance import cosine, cdist
from collections import Counter
import warnings
warnings.filterwarnings('ignore')


@dataclass
class ClusterMetrics:
    """Cluster quality metrics"""
    silhouette: float
    davies_bouldin: float
    cluster_sizes: Dict[int, int]
    noise_ratio: float
    intra_cluster_distance: Dict[int, float]
    inter_cluster_distance: float


class AdvancedTextPreprocessor:
    """
    Enhanced text preprocessing with domain-specific normalization
    """
    
    def __init__(self):
        # Technical term standardization (more comprehensive)
        self.tech_synonyms = {
            # Authentication & Security
            r'\b(oauth|oauth2|oauth 2\.0|o-auth)\b': 'oauth_auth',
            r'\b(802\.1x|8021x|dot1x)\b': 'dot1x_auth',
            r'\b(tls|ssl|https|secure socket)\b': 'tls_security',
            r'\b(saml|saml2|saml 2\.0)\b': 'saml_auth',
            r'\b(ldap|active directory|ad|ldaps)\b': 'ldap_directory',
            r'\b(kerberos|krb5)\b': 'kerberos_auth',
            r'\b(mfa|multi[- ]?factor|2fa|two[- ]?factor)\b': 'mfa_auth',
            
            # Video Protocols & Codecs
            r'\b(rtsp|real[- ]?time streaming)\b': 'rtsp_protocol',
            r'\b(onvif|onvif profile)\b': 'onvif_protocol',
            r'\b(h\.?264|h264|avc)\b': 'h264_codec',
            r'\b(h\.?265|h265|hevc)\b': 'h265_codec',
            r'\b(mjpeg|motion jpeg)\b': 'mjpeg_codec',
            r'\b(rtp|rtcp)\b': 'rtp_protocol',
            
            # Network & Connectivity
            r'\b(poe|power over ethernet)\b': 'poe_power',
            r'\b(dhcp|dynamic host)\b': 'dhcp_network',
            r'\b(static ip|fixed ip)\b': 'static_ip',
            r'\b(vlan|virtual lan)\b': 'vlan_network',
            r'\b(upnp|universal plug)\b': 'upnp_discovery',
            r'\b(nat|network address translation)\b': 'nat_network',
            
            # Storage & Export
            r'\b(nas|network attached storage)\b': 'nas_storage',
            r'\b(nvr|network video recorder)\b': 'nvr_storage',
            r'\b(dvr|digital video recorder)\b': 'dvr_storage',
            r'\b(ftp|ftps|file transfer)\b': 'ftp_transfer',
            r'\b(siem|security information)\b': 'siem_integration',
            r'\b(syslog|system log)\b': 'syslog_export',
            r'\b(s3|amazon s3|aws s3)\b': 's3_storage',
            
            # Camera Features
            r'\b(ptz|pan tilt zoom)\b': 'ptz_control',
            r'\b(ir|infrared|night vision)\b': 'ir_nightvision',
            r'\b(wdr|wide dynamic range)\b': 'wdr_feature',
            r'\b(motion detect|motion sensor)\b': 'motion_detection',
            r'\b(audio detect|sound detect)\b': 'audio_detection',
            r'\b(line cross|intrusion|tripwire)\b': 'analytics_detection',
            r'\b(face detect|facial recognition)\b': 'face_detection',
            r'\b(license plate|lpr|anpr)\b': 'lpr_detection',
            
            # Quality & Performance
            r'\b(fps|frames? per second|frame rate)\b': 'fps_performance',
            r'\b(resolution|4k|1080p|720p|megapixel)\b': 'resolution_quality',
            r'\b(bitrate|bit rate|bandwidth)\b': 'bitrate_bandwidth',
            r'\b(latency|lag|delay)\b': 'latency_issue',
            r'\b(packet loss|dropped frames)\b': 'packet_loss',
            
            # System Issues
            r'\b(crash|crashed|crashing)\b': 'crash_failure',
            r'\b(freeze|frozen|hang|hanging|hung)\b': 'freeze_failure',
            r'\b(reboot|restart|reset)\b': 'reboot_issue',
            r'\b(offline|disconnect|connection lost)\b': 'offline_issue',
            r'\b(slow|sluggish|lagging)\b': 'slow_performance',
            r'\b(black screen|no video|blank screen)\b': 'no_video_issue',
            r'\b(blurry|blur|unfocused|out of focus)\b': 'blur_quality',
        }
        
        # Stop words (more comprehensive)
        self.custom_stopwords = {
            'hi', 'hello', 'hey', 'dear', 'sir', 'madam', 'mam', 
            'thanks', 'thank', 'you', 'please', 'pls', 'plz',
            'regards', 'sincerely', 'best', 'ok', 'okay', 'yes', 'no',
            'get', 'got', 'getting', 'need', 'needs', 'needed',
            'want', 'wants', 'wanted', 'like', 'would', 'could', 'should',
            'one', 'two', 'three', 'also', 'much', 'many', 'way'
        }
    
    def normalize_technical_terms(self, text: str) -> str:
        """Apply technical term standardization"""
        text_lower = text.lower()
        for pattern, replacement in self.tech_synonyms.items():
            text_lower = re.sub(pattern, replacement, text_lower)
        return text_lower
    
    def remove_version_numbers(self, text: str) -> str:
        """Remove version numbers but keep semantic meaning"""
        # Remove standalone version numbers
        text = re.sub(r'\b(v|ver|version)?\s*\d+(\.\d+){0,3}\b', '', text, flags=re.IGNORECASE)
        return text
    
    def clean(self, text: str) -> str:
        """Comprehensive text cleaning"""
        if not isinstance(text, str):
            return ""
        
        # Basic cleaning
        text = text.strip().lower()
        
        # Normalize technical terms FIRST (before removing special chars)
        text = self.normalize_technical_terms(text)
        
        # Remove version numbers
        text = self.remove_version_numbers(text)
        
        # Remove URLs
        text = re.sub(r'http\S+|www\.\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove special characters but keep underscores (for our normalized terms)
        text = re.sub(r'[^a-z0-9\s_\-]', ' ', text)
        
        # Remove stop words
        words = text.split()
        words = [w for w in words if w not in self.custom_stopwords and len(w) > 2]
        
        # Collapse spaces
        text = ' '.join(words)
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text


class MultiModalFeatureExtractor:
    """
    Extract multiple types of features for richer clustering
    """
    
    def __init__(self):
        self.preprocessor = AdvancedTextPreprocessor()
        self.tfidf = None
        self.semantic_model = None
        
    def extract_length_features(self, texts: List[str]) -> np.ndarray:
        """Text length features"""
        features = []
        for text in texts:
            features.append([
                len(text),  # Character count
                len(text.split()),  # Word count
                len(text.split()) / max(1, len(text)) * 100,  # Avg word length
            ])
        return np.array(features)
    
    def extract_keyword_features(self, texts: List[str]) -> np.ndarray:
        """Binary features for important keywords/categories"""
        categories = {
            'auth_security': r'(oauth_auth|dot1x_auth|tls_security|saml_auth|ldap_directory|mfa_auth|kerberos_auth)',
            'video_codec': r'(h264_codec|h265_codec|mjpeg_codec|rtsp_protocol|onvif_protocol)',
            'network_issue': r'(offline_issue|latency_issue|packet_loss|dhcp_network|vlan_network)',
            'storage_export': r'(nas_storage|nvr_storage|ftp_transfer|siem_integration|s3_storage)',
            'camera_feature': r'(ptz_control|ir_nightvision|motion_detection|face_detection|lpr_detection)',
            'performance_issue': r'(slow_performance|crash_failure|freeze_failure|fps_performance)',
            'quality_issue': r'(no_video_issue|blur_quality|resolution_quality|bitrate_bandwidth)',
        }
        
        features = []
        for text in texts:
            row = []
            for category, pattern in categories.items():
                match = 1 if re.search(pattern, text) else 0
                row.append(match)
            features.append(row)
        
        return np.array(features)
    
    def extract_tfidf_features(self, texts: List[str], max_features: int = 100) -> np.ndarray:
        """TF-IDF features"""
        self.tfidf = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, 3),  # Unigrams to trigrams
            min_df=2,  # Ignore very rare terms
            max_df=0.8,  # Ignore very common terms
        )
        try:
            tfidf_matrix = self.tfidf.fit_transform(texts)
            return tfidf_matrix.toarray()
        except:
            # Fallback if TF-IDF fails
            return np.zeros((len(texts), max_features))
    
    def extract_semantic_features(self, texts: List[str], model: SentenceTransformer) -> np.ndarray:
        """Semantic embeddings from transformer"""
        self.semantic_model = model
        embeddings = model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embeddings
    
    def extract_all_features(
        self, 
        texts: List[str], 
        model: SentenceTransformer,
        use_tfidf: bool = True,
        use_keywords: bool = True,
        use_length: bool = False
    ) -> np.ndarray:
        """
        Combine multiple feature types for richer representation
        
        Feature fusion strategy:
        - Semantic embeddings (transformer): Captures meaning
        - TF-IDF: Captures important terms
        - Keyword features: Captures domain categories
        - Length features: Captures structural info
        """
        feature_arrays = []
        
        # 1. Semantic features (most important - high weight)
        semantic_features = self.extract_semantic_features(texts, model)
        feature_arrays.append(semantic_features)
        
        # 2. Keyword category features (domain-specific - medium weight)
        if use_keywords:
            keyword_features = self.extract_keyword_features(texts)
            # Repeat to give more weight
            keyword_features = np.repeat(keyword_features, 10, axis=1)
            feature_arrays.append(keyword_features)
        
        # 3. TF-IDF features (term importance - medium weight)
        if use_tfidf:
            tfidf_features = self.extract_tfidf_features(texts, max_features=50)
            # Repeat to give more weight
            tfidf_features = np.repeat(tfidf_features, 5, axis=1)
            feature_arrays.append(tfidf_features)
        
        # 4. Length features (structural - low weight)
        if use_length:
            length_features = self.extract_length_features(texts)
            feature_arrays.append(length_features)
        
        # Concatenate all features
        combined_features = np.hstack(feature_arrays)
        
        # Standardize to same scale
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(combined_features)
        
        return scaled_features


class AdaptiveClusterer:
    """
    Advanced clustering with automatic parameter tuning
    """
    
    def __init__(self):
        self.best_params = None
        self.best_score = -np.inf
        self.cluster_quality = None
    
    def find_optimal_epsilon(
        self, 
        embeddings: np.ndarray, 
        min_size: int,
        epsilon_range: List[float] = None
    ) -> Tuple[float, HDBSCAN]:
        """
        Auto-tune epsilon parameter for best clustering
        """
        if epsilon_range is None:
            epsilon_range = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]
        
        best_epsilon = 0.3
        best_clusterer = None
        best_score = -np.inf
        
        for eps in epsilon_range:
            try:
                clusterer = HDBSCAN(
                    min_cluster_size=min_size,
                    min_samples=1,
                    cluster_selection_epsilon=eps,
                    metric='euclidean',
                    core_dist_n_jobs=-1
                )
                labels = clusterer.fit_predict(embeddings)
                
                # Dynamic noise threshold: be more lenient for small datasets
                n_items = len(labels)
                noise_threshold = 0.75 if n_items < 150 else 0.5
                
                # Skip if too few clusters or strictly too much noise
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                noise_ratio = (labels == -1).sum() / len(labels)
                
                if n_clusters < 2 or noise_ratio > noise_threshold:
                    continue
                
                # Calculate silhouette score (higher is better)
                score = silhouette_score(embeddings, labels)
                
                if score > best_score:
                    best_score = score
                    best_epsilon = eps
                    best_clusterer = clusterer
                    
            except Exception as e:
                continue
        
        # If no good clustering found, use default
        if best_clusterer is None:
            best_clusterer = HDBSCAN(
                min_cluster_size=min_size,
                min_samples=1,
                cluster_selection_epsilon=0.3,
                metric='euclidean'
            )
            best_clusterer.fit(embeddings)
        
        self.best_params = {'epsilon': best_epsilon, 'min_size': min_size}
        self.best_score = best_score
        
        return best_epsilon, best_clusterer
    
    def compute_cluster_metrics(
        self, 
        embeddings: np.ndarray, 
        labels: np.ndarray
    ) -> ClusterMetrics:
        """Calculate comprehensive cluster quality metrics"""
        
        unique_labels = set(labels)
        n_clusters = len(unique_labels) - (1 if -1 in unique_labels else 0)
        
        # Silhouette score (higher is better: -1 to 1)
        try:
            sil_score = silhouette_score(embeddings, labels) if n_clusters > 1 else 0.0
        except:
            sil_score = 0.0
        
        # Davies-Bouldin score (lower is better)
        try:
            db_score = davies_bouldin_score(embeddings, labels) if n_clusters > 1 else np.inf
        except:
            db_score = np.inf
        
        # Cluster sizes
        cluster_sizes = {int(label): int((labels == label).sum()) for label in unique_labels}
        
        # Noise ratio
        noise_ratio = float((labels == -1).sum() / len(labels))
        
        # Intra-cluster distances (compactness)
        intra_distances = {}
        for label in unique_labels:
            if label == -1:
                continue
            mask = labels == label
            cluster_points = embeddings[mask]
            if len(cluster_points) > 1:
                centroid = cluster_points.mean(axis=0)
                distances = cdist([centroid], cluster_points, metric='euclidean')[0]
                intra_distances[int(label)] = float(distances.mean())
        
        # Inter-cluster distance (separation)
        centroids = []
        for label in unique_labels:
            if label == -1:
                continue
            mask = labels == label
            centroid = embeddings[mask].mean(axis=0)
            centroids.append(centroid)
        
        if len(centroids) > 1:
            inter_dist = cdist(centroids, centroids, metric='euclidean')
            # Average of non-diagonal elements
            inter_cluster_distance = float(inter_dist[np.triu_indices_from(inter_dist, k=1)].mean())
        else:
            inter_cluster_distance = 0.0
        
        return ClusterMetrics(
            silhouette=sil_score,
            davies_bouldin=db_score,
            cluster_sizes=cluster_sizes,
            noise_ratio=noise_ratio,
            intra_cluster_distance=intra_distances,
            inter_cluster_distance=inter_cluster_distance
        )
    
    def cluster(
        self, 
        embeddings: np.ndarray, 
        min_size: int = 3,
        auto_tune: bool = True
    ) -> Tuple[np.ndarray, Dict]:
        """
        Perform clustering with optional auto-tuning
        """
        if auto_tune:
            optimal_eps, clusterer = self.find_optimal_epsilon(embeddings, min_size)
            labels = clusterer.labels_
        else:
            clusterer = HDBSCAN(
                min_cluster_size=min_size,
                min_samples=1,
                cluster_selection_epsilon=0.3,
                metric='euclidean',
                core_dist_n_jobs=-1
            )
            labels = clusterer.fit_predict(embeddings)
        
        # --- SMALL DATASET FALLBACK ---
        # If HDBSCAN results in too much noise (e.g. > 60%) for a small dataset,
        # we switch to Agglomerative Clustering to force more meaningful grouping.
        n_items = len(labels)
        noise_ratio = (labels == -1).sum() / n_items
        
        if n_items < 150 and noise_ratio > 0.6:
            print(f"  [Low-Data Mode] HDBSCAN noise too high ({noise_ratio:.1%}). Switching to Agglomerative Fallback...")
            # Estimate reasonable number of clusters (sq root rule or similar)
            n_clusters_target = max(2, int(np.sqrt(n_items)))
            
            agg_clusterer = AgglomerativeClustering(
                n_clusters=n_clusters_target,
                linkage='ward'
            )
            labels = agg_clusterer.fit_predict(embeddings)
            print(f"  [Low-Data Mode] Agglomerative clustering found {n_clusters_target} clusters.")

        # Calculate metrics
        self.cluster_quality = self.compute_cluster_metrics(embeddings, labels)
        
        metrics_dict = {
            'silhouette_score': self.cluster_quality.silhouette,
            'davies_bouldin_score': self.cluster_quality.davies_bouldin,
            'n_clusters': len(set(labels)) - (1 if -1 in labels else 0),
            'noise_ratio': self.cluster_quality.noise_ratio,
            'cluster_sizes': self.cluster_quality.cluster_sizes,
            'optimal_epsilon': self.best_params['epsilon'] if self.best_params else None
        }
        
        return labels, metrics_dict


class SmartClusterLabeler:
    """
    Generate meaningful, actionable labels for clusters
    """
    
    def __init__(self):
        self.category_keywords = {
            'Authentication Issues': [
                'oauth_auth', 'dot1x_auth', 'tls_security', 'saml_auth', 
                'ldap_directory', 'mfa_auth', 'login', 'credential', 'password'
            ],
            'Video Quality Issues': [
                'no_video_issue', 'blur_quality', 'resolution_quality', 
                'black', 'screen', 'poor', 'quality', 'pixelated'
            ],
            'Network Connectivity': [
                'offline_issue', 'latency_issue', 'packet_loss', 'disconnect',
                'connection', 'network', 'timeout', 'unreachable'
            ],
            'Performance Problems': [
                'slow_performance', 'crash_failure', 'freeze_failure', 
                'lag', 'hang', 'fps_performance', 'delay'
            ],
            'Storage & Recording': [
                'nas_storage', 'nvr_storage', 'ftp_transfer', 'recording',
                'storage', 'disk', 'space', 'save'
            ],
            'Camera Features': [
                'ptz_control', 'ir_nightvision', 'motion_detection', 
                'face_detection', 'lpr_detection', 'zoom', 'pan', 'tilt'
            ],
            'Integration & Export': [
                'siem_integration', 'syslog_export', 's3_storage', 
                'api', 'webhook', 'integration', 'export'
            ],
            'Codec & Streaming': [
                'h264_codec', 'h265_codec', 'rtsp_protocol', 'onvif_protocol',
                'stream', 'codec', 'encoding', 'bitrate_bandwidth'
            ],
        }
    
    def extract_tfidf_keywords(self, texts: List[str], top_n: int = 5) -> List[str]:
        """Extract top keywords using TF-IDF"""
        try:
            vectorizer = TfidfVectorizer(
                max_features=20,
                stop_words='english',
                ngram_range=(1, 3),
                min_df=1
            )
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get average TF-IDF scores
            avg_scores = tfidf_matrix.mean(axis=0).A1
            top_indices = avg_scores.argsort()[-top_n:][::-1]
            
            keywords = [feature_names[i] for i in top_indices if avg_scores[i] > 0]
            # Clean up underscores from normalized terms
            keywords = [kw.replace('_', ' ').title() for kw in keywords]
            return keywords
        except:
            return []
    
    def match_category(self, texts: List[str]) -> Optional[str]:
        """Match cluster to predefined categories"""
        combined_text = ' '.join(texts).lower()
        
        category_scores = {}
        for category, keywords in self.category_keywords.items():
            score = sum(1 for kw in keywords if kw in combined_text)
            if score > 0:
                category_scores[category] = score
        
        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            # Only return if confidence is high enough
            if category_scores[best_category] >= 2:
                return best_category
        
        return None
    
    def generate_label(
        self, 
        cluster_texts: List[str], 
        cluster_size: int
    ) -> str:
        """
        Generate a concise, actionable label for a cluster
        
        Strategy:
        1. Try to match predefined category
        2. Extract TF-IDF keywords
        3. Create descriptive label
        """
        if not cluster_texts or len(cluster_texts) == 0:
            return "Miscellaneous Feedback"
        
        # Filter valid texts
        valid_texts = [t for t in cluster_texts if t and len(t.strip()) > 3]
        if not valid_texts:
            return "General Issues"
        
        # Try category matching first
        category = self.match_category(valid_texts)
        if category:
            return category
        
        # Fall back to TF-IDF keywords
        keywords = self.extract_tfidf_keywords(valid_texts, top_n=3)
        if keywords:
            label = ' + '.join(keywords[:2])
            if len(label) > 50:
                label = label[:47] + "..."
            return label
        
        # Final fallback
        return "Grouped Feedback"


def analyze_feedback_advanced(
    texts: List[str],
    min_cluster_size: int = 3,
    auto_tune: bool = True,
    use_multimodal: bool = True
) -> Dict:
    """
    Main function: Advanced feedback clustering with all improvements
    
    Args:
        texts: List of feedback strings
        min_cluster_size: Minimum cluster size for HDBSCAN
        auto_tune: Whether to auto-tune clustering parameters
        use_multimodal: Whether to use multi-modal features (vs semantic only)
    
    Returns:
        Dictionary with clustering results and metrics
    """
    
    # 1. Preprocessing
    print(f"[1/5] Preprocessing {len(texts)} feedback items...")
    preprocessor = AdvancedTextPreprocessor()
    cleaned_texts = [preprocessor.clean(text) for text in texts]
    
    # Remove empty texts
    valid_indices = [i for i, t in enumerate(cleaned_texts) if len(t) > 3]
    if len(valid_indices) == 0:
        return {
            'error': 'No valid texts after preprocessing',
            'labels': np.array([-1] * len(texts)),
            'cluster_names': {-1: 'Invalid Data'},
            'metrics': {}
        }
    
    cleaned_texts = [cleaned_texts[i] for i in valid_indices]
    original_texts = [texts[i] for i in valid_indices]
    
    # 2. Feature extraction
    print("[2/5] Extracting features...")
    feature_extractor = MultiModalFeatureExtractor()
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
    
    if use_multimodal:
        embeddings = feature_extractor.extract_all_features(
            cleaned_texts, 
            model,
            use_tfidf=True,
            use_keywords=True,
            use_length=False
        )
    else:
        embeddings = feature_extractor.extract_semantic_features(cleaned_texts, model)
    
    # 3. Clustering
    # For small datasets, reduce default min_cluster_size if it was set too high
    if len(embeddings) < 50:
        min_cluster_size = max(2, min(min_cluster_size, 2))
        print(f"  [Auto-Adjustment] Dataset is small, using min_cluster_size={min_cluster_size}")

    print("[3/5] Clustering with adaptive parameters...")
    clusterer = AdaptiveClusterer()
    labels, metrics = clusterer.cluster(embeddings, min_cluster_size, auto_tune)
    
    # 4. Label generation
    print("[4/5] Generating cluster labels...")
    labeler = SmartClusterLabeler()
    cluster_names = {}
    
    unique_labels = sorted(set(labels))
    for label in unique_labels:
        if label == -1:
            cluster_names[-1] = "Miscellaneous / Uncategorized"
            continue
        
        # Get texts in this cluster
        cluster_indices = np.where(labels == label)[0]
        cluster_texts = [cleaned_texts[i] for i in cluster_indices]
        cluster_size = len(cluster_indices)
        
        # Generate label
        cluster_names[int(label)] = labeler.generate_label(cluster_texts, cluster_size)
    
    # 5. Map back to original indices
    print("[5/5] Finalizing results...")
    final_labels = np.full(len(texts), -1, dtype=int)
    for i, orig_idx in enumerate(valid_indices):
        final_labels[orig_idx] = labels[i]
    
    print(f"[OK] Clustering complete: {metrics['n_clusters']} clusters found")
    print(f"  Silhouette Score: {metrics['silhouette_score']:.3f}")
    print(f"  Noise Ratio: {metrics['noise_ratio']:.1%}")
    
    return {
        'labels': final_labels,
        'cluster_names': cluster_names,
        'embeddings': embeddings,
        'metrics': metrics,
        'preprocessor': preprocessor,
        'feature_extractor': feature_extractor
    }


# Example usage
if __name__ == "__main__":
    # Sample feedback data
    sample_feedback = [
        "Camera offline, cannot connect via RTSP",
        "Motion detection not working on Camera 5",
        "Need to add OAuth2 authentication support",
        "Video is blurry and pixelated",
        "ONVIF integration failing with error",
        "Camera keeps disconnecting from network",
        "Black screen on live view, no video feed",
        "PTZ controls not responding",
        "Need LDAP integration for user management",
        "Frame rate drops below 15 FPS during peak hours",
    ] * 5  # Repeat for clustering
    
    # Run advanced analysis
    results = analyze_feedback_advanced(
        sample_feedback,
        min_cluster_size=3,
        auto_tune=True,
        use_multimodal=True
    )
    
    print("\n" + "="*60)
    print("CLUSTERING RESULTS")
    print("="*60)
    
    for cluster_id, name in results['cluster_names'].items():
        count = (results['labels'] == cluster_id).sum()
        print(f"\nCluster {cluster_id}: {name}")
        print(f"  Size: {count} items")
    
    print("\n" + "="*60)
    print("QUALITY METRICS")
    print("="*60)
    for key, value in results['metrics'].items():
        if key != 'cluster_sizes':
            print(f"  {key}: {value}")
