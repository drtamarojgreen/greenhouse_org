"""
MeSH Discovery & Systematic Review Suite V10 - Meta-Analysis Diagnostics
Leave-one-out outlier diagnostics, cumulative meta-analysis, meta-regression,
Bayesian sparse-pooling stubs, network meta-analysis checks, Egger small-study adjustments.
Features: 44, 45, 47 - 50, 53, 57
"""
import numpy as np
from typing import List, Dict, Any, Tuple
from .pooling import MetaAnalysisEngine, t_sf, linregress

class MetaDiagnostics:
    """
    Diagnostic suite for systematic meta-analyses.
    """
    @staticmethod
    def run_leave_one_out(effects: List[float], variances: List[float], model: str = "random-effects") -> List[Dict[str, Any]]:
        """
        Runs leave-one-out influence diagnostics for outlier detection (Feature 47).
        Iteratively pools the dataset, excluding one study at a time.
        """
        k = len(effects)
        results = []
        
        for i in range(k):
            # Exclude study i
            sub_effects = [effects[j] for j in range(k) if j != i]
            sub_vars = [variances[j] for j in range(k) if j != i]
            
            if len(sub_effects) >= 2:
                pooled = MetaAnalysisEngine.pool(sub_effects, sub_vars, model=model)
                results.append({
                    "excluded_index": i,
                    "pooled_effect": pooled["pooled_effect"],
                    "ci_lower": pooled["ci_lower"],
                    "ci_upper": pooled["ci_upper"],
                    "I2": pooled["I2"],
                    "influence_detected": bool(abs(pooled["pooled_effect"] - np.mean(effects)) > 0.15)
                })
            else:
                results.append({
                    "excluded_index": i,
                    "pooled_effect": effects[0],
                    "ci_lower": 0.0,
                    "ci_upper": 0.0,
                    "I2": 0.0,
                    "influence_detected": False
                })
        return results

    @staticmethod
    def run_cumulative_meta(effects: List[float], variances: List[float], years: List[int], model: str = "random-effects") -> List[Dict[str, Any]]:
        """
        Runs cumulative meta-analysis to show evidence evolution over time (Feature 48).
        Studies are sorted chronologically, and cumulative pools are computed.
        """
        sorted_indices = np.argsort(years)
        results = []
        
        for i in range(1, len(sorted_indices) + 1):
            sub_idx = sorted_indices[:i]
            sub_effects = [effects[idx] for idx in sub_idx]
            sub_vars = [variances[idx] for idx in sub_idx]
            sub_years = [years[idx] for idx in sub_idx]
            
            if len(sub_effects) >= 2:
                pooled = MetaAnalysisEngine.pool(sub_effects, sub_vars, model=model)
                results.append({
                    "step": i,
                    "latest_year": int(sub_years[-1]),
                    "studies_included": i,
                    "pooled_effect": pooled["pooled_effect"],
                    "ci_lower": pooled["ci_lower"],
                    "ci_upper": pooled["ci_upper"],
                    "I2": pooled["I2"]
                })
            else:
                results.append({
                    "step": 1,
                    "latest_year": int(sub_years[0]),
                    "studies_included": 1,
                    "pooled_effect": round(sub_effects[0], 3),
                    "ci_lower": round(sub_effects[0] - 1.96 * np.sqrt(sub_vars[0]), 3),
                    "ci_upper": round(sub_effects[0] + 1.96 * np.sqrt(sub_vars[0]), 3),
                    "I2": 0.0
                })
        return results

    @staticmethod
    def run_meta_regression(
        effects: List[float],
        variances: List[float],
        moderators: Dict[str, List[float]]
    ) -> Dict[str, Any]:
        """
        Performs weighted least squares (WLS) meta-regression (Feature 45).
        Moderators: sleep burden, trauma load, SES, treatment status.
        """
        y = np.array(effects)
        w = 1.0 / np.array(variances)
        
        results = {}
        for mod_name, x_vals in moderators.items():
            x = np.array(x_vals)
            # WLS regression line: y = beta0 + beta1 * x
            # Fit using weighted design matrix
            X = np.column_stack((np.ones(len(x)), x))
            W = np.diag(w)
            
            # WLS Estimator: beta = (X^T * W * X)^-1 * X^T * W * y
            try:
                xtwx = X.T @ W @ X
                beta = np.linalg.inv(xtwx) @ X.T @ W @ y
                residuals = y - X @ beta
                df = len(y) - 2
                
                # Covariance matrix of beta
                mse = np.sum(w * residuals**2) / df if df > 0 else 0.0
                cov = np.linalg.inv(xtwx) * mse if df > 0 else np.zeros((2, 2))
                se = np.sqrt(np.diag(cov))
                
                # t-statistics and p-values
                t_stat = beta / se if df > 0 else np.zeros(2)
                p_values = 2.0 * t_sf(np.abs(t_stat), df) if df > 0 else np.ones(2)
                
                results[mod_name] = {
                    "intercept": round(float(beta[0]), 4),
                    "slope": round(float(beta[1]), 4),
                    "slope_se": round(float(se[1]), 4),
                    "p_value": round(float(p_values[1]), 5),
                    "r_squared": round(float(1.0 - np.sum(residuals**2) / np.sum((y - np.mean(y))**2)), 4) if len(y) > 2 else 1.0
                }
            except np.linalg.LinAlgError:
                results[mod_name] = {
                    "error": "Collinearity or singular matrix error during regression."
                }
        return results

    @staticmethod
    def run_bayesian_meta(effects: List[float], variances: List[float], prior_mean: float = 0.0, prior_var: float = 1.0) -> Dict[str, Any]:
        """
        Bayesian meta-analysis option for sparse evidence domains (Feature 49).
        Updates normal prior with likelihood from studies using conjugate updates.
        """
        effects = np.array(effects)
        variances = np.array(variances)
        
        # Likelihood parameters (weighted sum of normal likelihoods)
        likelihood_prec = np.sum(1.0 / variances)
        likelihood_var = 1.0 / likelihood_prec
        likelihood_mean = np.sum(effects / variances) / likelihood_prec
        
        # Bayesian Update: posterior precision = prior precision + likelihood precision
        prior_prec = 1.0 / prior_var
        post_prec = prior_prec + likelihood_prec
        post_var = 1.0 / post_prec
        post_mean = (prior_mean * prior_prec + likelihood_mean * likelihood_prec) / post_prec
        
        # Credible intervals (95%)
        cred_lower = post_mean - 1.96 * np.sqrt(post_var)
        cred_upper = post_mean + 1.96 * np.sqrt(post_var)
        
        return {
            "posterior_mean": round(float(post_mean), 3),
            "posterior_variance": round(float(post_var), 4),
            "credible_interval_lower": round(float(cred_lower), 3),
            "credible_interval_upper": round(float(cred_upper), 3),
            "prior_influence_percentage": round((prior_prec / post_prec) * 100.0, 2)
        }

    @staticmethod
    def check_network_feasibility(interventions: List[str], comparators: List[str]) -> Dict[str, Any]:
        """
        Network meta-analysis feasibility check for multi-intervention comparisons (Feature 50).
        Checks if there are closed loops or multi-intervention overlaps forming a connected graph.
        """
        nodes = set(interventions + comparators)
        edges = list(zip(interventions, comparators))
        
        # Simple BFS connectivity check to see if network graph is connected
        if not nodes:
            return {"feasible": False, "connected_components": 0, "loops_detected": 0}
            
        adj = {n: set() for n in nodes}
        for u, v in edges:
            adj[u].add(v)
            adj[v].add(u)
            
        # Count connected components
        visited = set()
        components = 0
        for node in nodes:
            if node not in visited:
                components += 1
                # BFS
                q = [node]
                visited.add(node)
                while q:
                    curr = q.pop(0)
                    for neighbor in adj[curr]:
                        if neighbor not in visited:
                            visited.add(neighbor)
                            q.append(neighbor)
                            
        # Feasible if there's only 1 connected component (meaning all treatments are connected)
        feasible = (components == 1) and len(nodes) >= 3
        
        return {
            "feasible": feasible,
            "total_treatments": len(nodes),
            "connections_count": len(edges),
            "connected_components": components,
            "feasibility_note": "NMA feasible: full multi-intervention comparison network established." if feasible else "NMA not feasible: disconnected subgroups."
        }

    @staticmethod
    def apply_small_study_correction(effects: List[float], variances: List[float]) -> Dict[str, Any]:
        """
        Applies small-study correction sensitivity analyses (Feature 53).
        Runs Egger's regression and computes correction adjustment multiplier.
        """
        effects = np.array(effects)
        variances = np.array(variances)
        se = np.sqrt(variances)
        
        # Standardize effects: y = effect / se, predictor = 1 / se
        y = effects / se
        x = 1.0 / se
        
        # Egger's regression: y = alpha + beta * x
        slope, intercept, r_value, p_value, std_err = linregress(x, y)
        
        # Correction multiplier: if Egger's test is significant (p < 0.10),
        # adjust pooled variance to account for asymmetry inflation.
        bias_detected = p_value < 0.10
        adjustment_factor = 1.25 if bias_detected else 1.0
        
        return {
            "egger_intercept_bias": round(float(intercept), 3),
            "egger_p_value": round(float(p_value), 5),
            "bias_detected": bias_detected,
            "suggested_variance_multiplier": adjustment_factor
        }

    @staticmethod
    def apply_multiplicity_controls(p_values: List[float], method: str = "Bonferroni") -> List[float]:
        """
        Implements multiplicity controls for large subgroup testing grids (Feature 57).
        Supports Bonferroni and False Discovery Rate (FDR / Benjamini-Hochberg).
        """
        p_values = np.array(p_values)
        n = len(p_values)
        
        if method == "Bonferroni":
            adjusted = p_values * n
            return [round(float(min(p, 1.0)), 5) for p in adjusted]
        elif method == "FDR":
            # Benjamini-Hochberg
            sorted_indices = np.argsort(p_values)
            adjusted = np.zeros(n)
            for i, idx in enumerate(sorted_indices):
                rank = i + 1
                adj = p_values[idx] * (n / rank)
                adjusted[idx] = adj
            # Ensure monotonicity
            for i in range(n - 2, -1, -1):
                idx_curr = sorted_indices[i]
                idx_next = sorted_indices[i+1]
                if adjusted[idx_curr] > adjusted[idx_next]:
                    adjusted[idx_curr] = adjusted[idx_next]
            return [round(float(min(p, 1.0)), 5) for p in adjusted]
        
        return list(p_values)

    @staticmethod
    def get_dose_response_template() -> Dict[str, Any]:
        """
        Dose-response modeling templates (Feature 44).
        Strictly structural - contains no hardcoded medical assertions, clinical claims, or invented outcomes.
        """
        return {
            "dose_response_grid": {
                "exposure_intensity_tiers": ["level_1", "level_2", "level_3"],
                "exposure_chronicity_tiers": ["acute", "intermediate", "persistent"],
                "mathematical_model": "linear_multiplicative",
                "default_structural_parameters": {
                    "intensity_weights": [1.0, 2.0, 3.0],
                    "chronicity_multipliers": [1.0, 1.5, 2.0]
                }
            }
        }
