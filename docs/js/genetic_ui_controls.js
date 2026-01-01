
class GreenhouseGeneticUIControls {
    constructor(geneticAlgo, geneticUI3D) {
        this.geneticAlgo = geneticAlgo;
        this.geneticUI3D = geneticUI3D;
        this.networkSelector = document.getElementById('network-selector');
        this.geneSelector = document.getElementById('gene-selector');
        this.infoPanel = document.getElementById('selection-info-panel');
        this.init();
    }

    init() {
        this.populateNetworkSelector();
        this.addEventListeners();
    }

    populateNetworkSelector() {
        if (!this.geneticAlgo || !this.geneticAlgo.population) return;
        this.networkSelector.innerHTML = ''; // Clear existing options

        this.geneticAlgo.population.forEach(network => {
            const option = document.createElement('option');
            option.value = network.id;
            option.textContent = `Network ${network.id} (Fitness: ${network.fitness.toFixed(2)})`;
            if (this.geneticAlgo.bestNetwork && network.id === this.geneticAlgo.bestNetwork.id) {
                option.selected = true;
            }
            this.networkSelector.appendChild(option);
        });

        this.populateGeneSelector(this.networkSelector.value);
    }

    populateGeneSelector(networkId) {
        if (!this.geneticAlgo) return;
        const network = this.geneticAlgo.population.find(n => n.id === networkId);
        if (!network) return;

        this.geneSelector.innerHTML = ''; // Clear existing options
        network.connections.forEach(conn => {
            const option = document.createElement('option');
            option.value = conn.id;
            option.textContent = `Connection ${conn.id} (Weight: ${conn.weight.toFixed(2)})`;
            this.geneSelector.appendChild(option);
        });
    }

    addEventListeners() {
        this.networkSelector.addEventListener('change', () => {
            const networkId = this.networkSelector.value;
            this.geneticUI3D.setActiveNetwork(networkId);
            this.populateGeneSelector(networkId);
            this.updateInfoPanel({ networkId: networkId });
        });

        this.geneSelector.addEventListener('change', () => {
            const connectionId = this.geneSelector.value;
            this.geneticUI3D.highlightConnection(connectionId);
            const networkId = this.networkSelector.value;
            const network = this.geneticAlgo.population.find(n => n.id === networkId);
            if (network) {
                const connection = network.connections.find(c => c.id === connectionId);
                this.updateInfoPanel(connection);
            }
        });
    }

    updateInfoPanel(data) {
        if (!data) {
            this.infoPanel.innerHTML = '<p>Select a network or gene to see details.</p>';
            return;
        }

        let html = '<ul>';
        for (const key in data) {
            const value = typeof data[key] === 'number' ? data[key].toFixed(4) : data[key];
            html += `<li><strong>${key}:</strong> ${value}</li>`;
        }
        html += '</ul>';
        this.infoPanel.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // A delay to ensure all other scripts are loaded and initialized
    setTimeout(() => {
        if (window.GreenhouseGeneticAlgo && window.GreenhouseGeneticUI3D) {
            window.GreenhouseGeneticUIControls = new GreenhouseGeneticUIControls(
                window.GreenhouseGeneticAlgo,
                window.GreenhouseGeneticUI3D
            );
        } else {
            console.error("Required modules for UI Controls are not available.");
        }
    }, 2000); // Wait 2 seconds
});
