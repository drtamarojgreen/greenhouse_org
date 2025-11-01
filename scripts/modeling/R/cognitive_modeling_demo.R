# This script demonstrates a basic cognitive modeling workflow using the 'catmaid' R package
# to fetch and visualize neuron data from the fly connectome.
#
# To run this script, you will need to have R installed with the 'catmaid' package.
# You can install the package with the following command in your R console:
# install.packages('catmaid')

# Load the catmaid library
library(catmaid)

# Specify the VFB CATMAID server containing the data
# Note: This is a public server, and access may be slow or subject to change.
conn <- catmaid_login(server="https://l1em.catmaid.virtualflybrain.org")

# Fetch olfactory receptor neurons (ORNs)
# This query searches for neurons with "ORN (left|right)" in their name.
orns <- read.neurons.catmaid("name:ORN (left|right)", .progress='text')

# Calculate some useful metadata for the ORNs
# Extract the odorant receptor (Or) type from the neuron name
orns[,'Or'] <- factor(sub(" ORN.*", "", orns[,'name']))
# Extract the side (left or right) from the neuron name
orns[,'side'] <- factor(sub(".* ORN ", "", orns[,'name']))

# Repeat for their projection neuron (PN) partners
# This query searches for neurons with the annotation "ORN PNs".
pns <- read.neurons.catmaid("ORN PNs", .progress='text')

# Calculate metadata for the PNs
# Extract the odorant receptor (Or) type
pns[,'Or'] <- factor(sub(" PN.*", "", pns[,'name']))
# Extract the side
pns[,'side'] <- factor(sub(".*(left|right)", "\\1", pns[,'name']))

# Plot the neurons in 3D
# The 'rgl' package is required for 3D plotting. If not installed, you can install it with:
# install.packages('rgl')
#
# Plot the ORNs, coloring them by their odorant receptor type
plot3d(orns, col=Or)

# Plot the PNs, coloring them by odorant receptor and setting the soma radius to 1500 nm
plot3d(pns, col=Or, soma=1500)

# This script provides a basic example of how to programmatically access and
# visualize connectome data. Further analysis could involve:
# - Analyzing synaptic connectivity between ORNs and PNs
# - Modeling the flow of information through this circuit
# - Comparing the structure of this circuit across different individual flies
# Cognitive Modeling Demonstration with Fly Connectome Data
# install.packages(c("catmaid", "rgl"))
library(catmaid)
library(rgl)

run_demo <- function() {
  print("Connecting to CATMAID server...")
  conn <- catmaid_login(server = "https://l1em.catmaid.virtualflybrain.org", auth = NULL)

  print("Fetching ORNs...")
  orns <- read.neurons.catmaid("name:ORN (left|right)", .progress = 'text', conn = conn)
  orns[, 'Or'] <- factor(sub(" ORN.*", "", orns[, 'name']))

  print("Fetching PNs...")
  pns <- read.neurons.catmaid("ORN PNs", .progress = 'text', conn = conn)
  pns[, 'Or'] <- factor(sub(" PN.*", "", pns[, 'name']))

  print("Generating 3D plots...")
  open3d()
  plot3d(orns, col = Or, lwd = 2)
  open3d()
  plot3d(pns, col = Or, soma = 1500, lwd = 2)
}

# Call run_demo() to execute.
print("Script loaded. Call run_demo() to start the visualization.")
