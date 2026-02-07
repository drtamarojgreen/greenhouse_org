"""
MeSH Discovery Suite V3 - CLI Interface
Enhanced with Rich terminal UI and interactive elements.
"""
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.prompt import Prompt, Confirm
from typing import List, Dict

class CLIV3:
    """
    Advanced CLI interface using the 'rich' library.
    """
    def __init__(self):
        self.console = Console()

    def display_header(self):
        """
        Enhancement 91: Rich terminal UI for better progress tracking.
        """
        header = Panel.fit(
            "[bold cyan]MeSH Discovery Suite V3[/bold cyan]\n[italic]The New Frontier of AI-Driven Research[/italic]",
            border_style="magenta"
        )
        self.console.print(header)

    def prompt_theme(self) -> str:
        """
        Enhancement 93: Interactive Theme Selection via terminal prompts.
        """
        return Prompt.ask("[bold green]Enter a seed theme for discovery[/bold green]", default="Mental Health")

    def display_results(self, results: List[Dict]):
        """
        Displays discovery results in a formatted table.
        """
        table = Table(title="Discovered MeSH Terms")
        table.add_column("Term", style="cyan", no_wrap=True)
        table.add_column("Count", justify="right", style="green")
        table.add_column("Related Terms", style="magenta")

        for r in results[:15]:
            related_str = ", ".join(r.get('related', [])[:3]) + "..."
            table.add_row(r['term'], str(r['count']), related_str)

        self.console.print(table)

    def display_telemetry(self, telemetry: Dict):
        """
        Enhancement 12: Telemetry display.
        """
        self.console.print("\n[bold yellow]System Telemetry:[/bold yellow]")
        for k, v in telemetry.items():
            self.console.print(f"  {k}: [bold]{v}[/bold]")

    def get_progress_context(self):
        """
        Enhancement 95: Progress bar with estimated time of arrival (ETA).
        """
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeRemainingColumn(),
            console=self.console
        )

    def confirm_action(self, message: str) -> bool:
        return Confirm.ask(message)

    def display_error(self, error: str):
        self.console.print(f"[bold red]Error:[/bold red] {error}")

    def display_info(self, message: str):
        self.console.print(f"[cyan]Info:[/cyan] {message}")
