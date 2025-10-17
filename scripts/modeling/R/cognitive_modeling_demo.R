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
