"""
MeSH Discovery & Systematic Review Suite V10 - CLI UI
Spectacular Rich-based terminal UI displaying diagnostic dashboards, simulations,
meta-analysis pooling grids, and pedagogical curricula.
Features: 40, 153
"""
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.panel import Panel
from rich.columns import Columns
from rich.text import Text
from rich.align import Align
from typing import List, Dict, Any

console = Console()

class CLIV10:
    """
    Stunning Terminal UI dashboard for MeSH v10.
    """
    def __init__(self):
        self.console = console

    def display_welcome(self):
        banner = (
            "[bold cyan]▲▲▲ MeSH DISCOVERY & SYSTEMATIC REVIEW SUITE v10.0.0 ▲▲▲[/bold cyan]\n"
            "[italic white]Clinical Systematic Synthesis, Advanced Meta-Analysis & Systems Pharmacology[/italic white]\n"
            "[green]Incorporating Features 21 - 200 | Robustness, Reproducibility, & Translation[/green]"
        )
        self.console.print(Panel(Align.center(banner), border_style="bold blue", expand=True))

    def display_review_table(self, reviews: List[Dict[str, Any]]):
        table = Table(title="[bold green]Ingested & Stratified Clinical Cohorts (v10 Schema)[/bold green]", border_style="blue")
        table.add_column("PMID", style="cyan")
        table.add_column("Design", style="magenta")
        table.add_column("Proximal Endpoints", style="yellow")
        table.add_column("Setting", style="green")
        table.add_column("Attrition (%)", justify="right", style="red")
        table.add_column("Directionality", style="blue")
        table.add_column("Curation Status", style="white")

        for r in reviews:
            status_color = "green" if r["sign_off_status"] == "Approved" else ("yellow" if r["sign_off_status"] == "Screened" else "red")
            table.add_row(
                r["pmid"],
                r["study_design"],
                ", ".join(r["outcomes_proximal"][:2]) if r["outcomes_proximal"] else "None",
                ", ".join(r["settings"]),
                f"{r['attrition_rate']:.1f}%",
                r["directionality"],
                f"[{status_color}]{r['sign_off_status']}[/{status_color}]"
            )
        self.console.print(table)

    def display_meta_pooling(self, pool: Dict[str, Any], bias: Dict[str, Any]):
        title = f"[bold yellow]DerSimonian-Laird Random-Effects Pooling Summary[/bold yellow]"
        
        # Format metrics beautifully
        body = (
            f"[bold]Pooled Effect Size (SMD):[/bold] [green]{pool['pooled_effect']}[/green] "
            f"[dim](SE: {pool['se']})[/dim]\n"
            f"[bold]95% Confidence Interval (CI):[/bold] [{pool['ci_lower']}, {pool['ci_upper']}]\n"
            f"[bold]95% Prediction Interval (PI):[/bold] [{pool['pi_lower']}, {pool['pi_upper']}]\n\n"
            f"[bold]Heterogeneity stats:[/bold]\n"
            f"  - I² Index: [magenta]{pool['I2']}%[/magenta] [dim](Value > 50% indicates severe inconsistency)[/dim]\n"
            f"  - Cochran's Q: {pool['Q']} [dim](p = {pool['p_value_Q']})[/dim]\n"
            f"  - Tau² variance: {pool['tau2']}\n\n"
            f"[bold]Small-Study Publication Bias (Egger Regression):[/bold]\n"
            f"  - Intercept Bias: {bias['egger_intercept_bias']} [dim](p = {bias['egger_p_value']})[/dim]\n"
            f"  - Bias Detected: [red]{'YES' if bias['bias_detected'] else 'NO'}[/red] "
            f"[dim](suggested variance multiplier: {bias['suggested_variance_multiplier']}x)[/dim]"
        )
        self.console.print(Panel(body, title=title, border_style="yellow"))

    def display_emerging_dashboard(self, bursts: List[Dict[str, Any]], weak: List[Dict[str, Any]], watch: Dict[str, List[str]]):
        self.console.print("\n[bold cyan]⚡ HORIZON SCANNING & EMERGING SIGNAL TRACKER[/bold cyan]")
        
        # Bursts Column
        burst_table = Table(title="Research Bursts Detected", border_style="red")
        burst_table.add_column("Concept / MeSH Term", style="cyan")
        burst_table.add_column("Growth Multiplier", style="yellow")
        burst_table.add_column("Recent Volume", style="magenta")
        for b in bursts[:3]:
            burst_table.add_row(b["term"], f"{b['growth_ratio']}x", str(b["recent_count"]))
            
        # Weak Signals Column
        weak_table = Table(title="Weak-Signal Queue (High CAGR, Low Volume)", border_style="yellow")
        weak_table.add_column("Hypothesis", style="cyan")
        weak_table.add_column("Total Vol", style="magenta")
        weak_table.add_column("CAGR (%)", style="green")
        weak_table.add_column("Novelty Score", style="yellow")
        for w in weak[:3]:
            weak_table.add_row(w["term"], str(w["total_volume"]), f"{w['cagr']}%", f"{w['novelty_score']}")
            
        self.console.print(Columns([burst_table, weak_table]))
        
        watchlist_pnl = (
            f"[bold red]Pediatric watch:[/bold red] {', '.join(watch.get('pediatric_watch', watch.get('Pediatric_Subgroups', [])))}\n"
            f"[bold green]Geriatric watch:[/bold green] {', '.join(watch.get('geriatric_watch', watch.get('Geriatric_Subgroups', [])))}\n"
            f"[bold blue]Underserved watch:[/bold blue] {', '.join(watch.get('underserved_watch', watch.get('Underserved_Geography', [])))}"
        )
        self.console.print(Panel(watchlist_pnl, title="Underrepresented Populations Watchlists", border_style="blue"))

    def display_physiological_simulation(self, sim_data: Dict[str, List[float]]):
        self.console.print("\n[bold magenta]📈 PHYSIOLOGICAL SIMULATION (HPA Stress Dynamics & Exec Function Decay)[/bold magenta]")
        
        # Build text-based chart to look incredibly cool
        chart_lines = []
        for i in range(0, len(sim_data["hours"]), 2):
            hour = sim_data["hours"][i]
            cort = sim_data["cortisol_levels"][i]
            exec_sc = sim_data["executive_function_scores"][i]
            
            # Create progress bars for visual wow factor
            cort_bar = "█" * int(cort)
            exec_bar = "█" * int(exec_sc / 5)
            
            chart_lines.append(
                f"[dim]Hour {hour:02d}:00[/dim] | "
                f"[yellow]Cortisol ({cort:5.1f} ug/dL)[/yellow] {cort_bar:<25} | "
                f"[cyan]Executive Function ({exec_sc:5.1f}%)[/cyan] {exec_bar:<20}"
            )
        
        self.console.print(Panel("\n".join(chart_lines), border_style="magenta", title="HPA dynamic simulation curves"))

    def display_educational_modules(self, curriculum: Dict[str, Any], osce: Dict[str, Any]):
        self.console.print("\n[bold green]🎓 MEDICAL EDUCATION INTEGRATION MODULES[/bold green]")
        
        ume = curriculum["UME_Undergraduate_Medical_Education"]
        gme = curriculum["GME_Graduate_Medical_Education"]
        
        body = (
            f"[bold cyan]Undergraduate (UME)[/bold cyan]: {ume['Title']}\n"
            f"  - Core Competency: [dim]{ume['Core_Competencies'][1]}[/dim]\n"
            f"  - Core screeners: Conners, ADHD-RS\n\n"
            f"[bold magenta]Residency (GME)[/bold magenta]: {gme['Title']}\n"
            f"  - Core Competency: [dim]{gme['Core_Competencies'][0]}[/dim]\n\n"
            f"[bold yellow]OSCE Prompt Station[/bold yellow]: [bold]{osce['Station_Title']}[/bold]\n"
            f"  - Candidate task: [italic]{osce['Candidate_Instructions'][:140]}...[/italic]\n"
            f"  - Actor Instructions: [italic]{osce['Actor_Instructions'][:120]}...[/italic]"
        )
        self.console.print(Panel(body, border_style="green"))

    def display_policy_briefs(self, school: Dict[str, Any], workplace: Dict[str, Any]):
        self.console.print("\n[bold blue]🏛️ POLICY TRANSLATION & ADVOCACY ACCOMMODATIONS[/bold blue]")
        
        body = (
            f"[bold yellow]School Support Framework[/bold yellow]: {school['Policy_Area']}\n"
            f"  - Recommendation: {school['Key_Recommendations'][0]}\n"
            f"  - Recommendation: {school['Key_Recommendations'][1]}\n\n"
            f"[bold green]Adult Workplace Accommodations[/bold green]: {workplace['Accommodation_Framework']}\n"
            f"  - Focus: {workplace['Keys'][0]} & {workplace['Keys'][1]}"
        )
        self.console.print(Panel(body, border_style="blue"))

    def display_program_roadmaps(self, roadmap: List[Dict[str, Any]], incident: Dict[str, Any]):
        self.console.print("\n[bold white]📅 PROGRAM GOVERNANCE, ROADMAPS & INCIDENT PLAN[/bold white]")
        
        roadmap_lines = []
        for r in roadmap[:3]:
            roadmap_lines.append(
                f"[bold cyan]{r['Track']} ({r['Timeline']})[/bold cyan]\n"
                f"  - Deliverable: {r['Enhancements']}\n"
                f"  - Owner: {r['Owner']} | Effort: {r['Effort_Estimate']}"
            )
            
        playbook_lines = [
            f"[bold red]Emergency Trigger:[/bold red] {incident['Trigger']}"
        ]
        for i, step in enumerate(incident["Action_Steps"][:3]):
            playbook_lines.append(f"  {step}")
            
        self.console.print(Columns([
            Panel("\n\n".join(roadmap_lines), title="12-Month roadmap tracks", border_style="white"),
            Panel("\n".join(playbook_lines), title="Incident response manual", border_style="red")
        ]))

    def display_infrastructure_log(self, manifest: Dict[str, Any], duplicates: List[Dict[str, Any]]):
        self.console.print("\n[bold green]🔒 PROVENANCE, DUP_COHORT ASSURANCE & AUDIT TRAILS[/bold green]")
        
        dup_alert = "[green]No cohort duplicates detected.[/green]"
        if duplicates:
            d = duplicates[0]
            dup_alert = (
                f"[bold red]COHORT OVERLAP RISK DETECTED![/bold red]\n"
                f"  - Overlapping studies: {d['pmid_a']} & {d['pmid_b']}\n"
                f"  - Institution: {d['matching_institution']} | Author: {d['matching_author']}"
            )
            
        body = (
            f"[bold]Immutable manifest signature:[/bold] [cyan]{manifest['parameter_hash'][:32]}[/cyan]\n"
            f"[bold]Reproducibility Badge:[/bold] [bold yellow]{manifest['reproducibility_badge']}[/bold yellow]\n"
            f"[bold]Timestamp:[/bold] {manifest['timestamp']}\n\n"
            f"{dup_alert}"
        )
        self.console.print(Panel(body, border_style="cyan", title="Run verification & audit logs"))
