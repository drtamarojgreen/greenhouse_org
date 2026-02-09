"""
MeSH Discovery Suite V4 - CLI Interface
Enhanced with Rich hierarchical tree visualization.
"""
from rich.console import Console
from rich.panel import Panel
from rich.tree import Tree
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.prompt import Prompt, Confirm
from typing import List, Dict, Any

class CLIV4:
    """
    Advanced CLI interface for hierarchical discovery.
    """
    def __init__(self):
        self.console = Console()

    def display_header(self):
        header = Panel.fit(
            "[bold cyan]MeSH Discovery Suite V4[/bold cyan]\n[italic]Hierarchical Tree Discovery Engine[/italic]",
            border_style="magenta"
        )
        self.console.print(header)

    def prompt_theme(self) -> str:
        return Prompt.ask("[bold green]Enter a seed theme for discovery[/bold green]", default="Mental Health")

    def display_tree(self, tree_data: Dict[str, Any]):
        """
        Displays discovery results using the Rich Tree component.
        """
        if not tree_data:
            self.console.print("[red]No discovery data to display.[/red]")
            return

        def add_branches(node: Dict[str, Any], rich_node: Any):
            # Check if this node is pruned or already visited
            label = f"[cyan]{node['term']}[/cyan]"
            if node.get('is_reference'):
                label += " [dim](ref)[/dim]"
                rich_node.add(label)
                return
            
            if node.get('status') == 'pruned':
                label += f" [yellow](pruned: {node.get('count', 0)})[/yellow]"
                rich_node.add(label)
                return

            label += f" [green]({node.get('count', 0)})[/green]"
            branch = rich_node.add(label)
            
            for child in node.get('children', []):
                add_branches(child, branch)

        root_tree = Tree(f"[bold magenta]Discovery Tree[/bold magenta]")
        add_branches(tree_data, root_tree)
        
        self.console.print("\n")
        self.console.print(root_tree)
        self.console.print("\n")

    def display_telemetry(self, telemetry: Dict):
        self.console.print("\n[bold yellow]System Telemetry:[/bold yellow]")
        for k, v in telemetry.items():
            self.console.print(f"  {k}: [bold]{v}[/bold]")

    def get_progress_context(self):
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeRemainingColumn(),
            console=self.console
        )

    def display_info(self, message: str):
        self.console.print(f"[cyan]Info:[/cyan] {message}")

    def display_error(self, error: str):
        self.console.print(f"[bold red]Error:[/bold red] {error}")
