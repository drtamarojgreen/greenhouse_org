"""
MeSH Discovery Suite V9 - CLI
Rich-based terminal UI with progress tracking and telemetry.
"""
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.panel import Panel
from rich.logging import RichHandler
import logging
from typing import List, Dict, Any

console = Console()

class CLIV9:
    """
    Enhanced Terminal UI (v9).
    """
    def __init__(self):
        self.console = console

    def display_welcome(self):
        self.console.print(Panel.fit(
            "[bold green]MeSH Discovery Suite V9[/bold green]\n"
            "[italic]Enhanced Research Discovery Pipeline[/italic]",
            border_style="blue"
        ))

    def display_discovery_results(self, results: List[Dict]):
        table = Table(title="Discovered MeSH Terms")
        table.add_column("Level", style="cyan")
        table.add_column("Term", style="green")
        table.add_column("Count", justify="right")
        table.add_column("Significance", justify="right")
        table.add_column("Status")

        for res in results:
            status_style = "green" if res["status"] == "accepted" else "red"
            table.add_row(
                str(res["level"]),
                res["term"],
                f"{res['count']:,}",
                f"{res['significance']:.4f}",
                f"[{status_style}]{res['status']}[/{status_style}]"
            )
        self.console.print(table)

    def display_summary(self, telemetry: Dict, elapsed: float):
        self.console.print(Panel(
            f"[bold]Execution Summary[/bold]\n\n"
            f"Elapsed Time: {elapsed:.2f}s\n"
            f"PubMed Requests: {telemetry['pubmed']['requests']}\n"
            f"PubMed Cache Hits: {telemetry['pubmed']['cache_hits']}\n"
            f"ClinicalTrials Requests: {telemetry['ct']['requests']}\n"
            f"Errors Encountered: {telemetry['pubmed']['errors'] + telemetry['ct']['errors']}",
            title="Telemetry",
            border_style="yellow"
        ))

    def get_progress_bar(self) -> Progress:
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=self.console
        )
