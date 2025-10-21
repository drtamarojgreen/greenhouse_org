readRenviron("../../.Renviron.txt")

getwd()
setwd("C:/Users/tamar/Documents/DataAnotation/Gemini/greenhouse_org")
# ============================================
# CBT Advocacy Exploratory Pipeline (CRAN-only)
# ============================================

# ---------------------------
# Setup
# ---------------------------
install.packages(c("tidyverse","ggplot2","sf","maps","mapdata"))
library(tidyverse)
library(ggplot2)
library(sf)
library(maps)
library(mapdata)

dir.create(Sys.getenv("ARTIFACTS_MAPS_DIR"), recursive = TRUE, showWarnings = FALSE)
dir.create(Sys.getenv("ARTIFACTS_DATA_DIR"), recursive = TRUE, showWarnings = FALSE)

# ---------------------------
# Part 2. Clinical Trial Data (placeholder)
# ---------------------------
clinical_trials <- tibble(
  NCT_Number = character(),
  Study_Title = character(),
  Locations = character(),
  Brief_Summary = character()
)
write_csv(clinical_trials, file.path(Sys.getenv("ARTIFACTS_DATA_DIR"), "clinical_trials_2024_cbt.csv"))

# ---------------------------
# Part 3. County-level ACS Data (placeholder)
# ---------------------------
acs_data <- tibble(
  GEOID = character(),
  Household_Income = numeric(),
  Median_Earnings = numeric(),
  Employment_Status_Scaled = numeric(),
  Median_Home_Value = numeric()
)
write_csv(acs_data, file.path(Sys.getenv("ARTIFACTS_DATA_DIR"), "acs_county.csv"))

# Instead of shaded maps, produce simple barplots
png(file.path(Sys.getenv("ARTIFACTS_MAPS_DIR"), "bar_household_income.png"), width=800, height=600)
barplot(1:5, names.arg=paste("County",1:5), main="Household Income (placeholder)")
dev.off()

# ---------------------------
# Part 4. State-level BRFSS Bubble Map
# ---------------------------
# Example: bubble map with circle size ~ Percent
# Placeholder dataset
brfss_df <- tibble(
  state = state.name,
  state_abbr = state.abb,
  percent = runif(length(state.name), 5, 20)
)

# Get state centroids from maps package
us_states <- map_data("state")
state_centroids <- us_states %>%
  group_by(region) %>%
  summarize(long = mean(range(long)), lat = mean(range(lat)))

# Join with BRFSS data
brfss_plot <- brfss_df %>%
  mutate(region = tolower(state)) %>%
  left_join(state_centroids, by="region")

# Plot: circles sized by percent
p <- ggplot() +
  borders("state") +
  geom_point(data=brfss_plot,
             aes(x=long, y=lat, size=percent),
             color="blue", alpha=0.5) +
  scale_size_continuous(range=c(2,15)) +
  labs(title="BRFSS 2023: Activity Limitation Days",
       size="Percent") +
  theme_minimal()

ggsave(file.path(Sys.getenv("ARTIFACTS_MAPS_DIR"), "map_brfss_bubbles.png"), p, width=10, height=6)

# ---------------------------
# Part 5. Token Analysis (simplified)
# ---------------------------
tokenize_text <- function(txt) {
  if (is.na(txt) || txt=="") return(character())
  clean <- tolower(gsub("[^a-z0-9-]+"," ",txt))
  strsplit(trimws(clean)," +")[[1]]
}

get_cbt_windows <- function(txt, window=5) {
  toks <- tokenize_text(txt)
  idx <- which(toks=="cbt")
  out <- character()
  for (i in idx) {
    start <- max(1, i-window)
    end <- min(length(toks), i+window)
    out <- c(out, toks[start:end])
  }
  unique(out)
}

# ---------------------------
# Part 6. BCEA Simulation (same as before)
# ---------------------------
set.seed(123)
n <- 10000
wtp <- 50000

income_base <- rnorm(n, mean=70000, sd=15000)
home_base   <- rnorm(n, mean=300000, sd=80000)
income_cbt  <- income_base + rnorm(n, 500, 300)
home_cbt    <- home_base + rnorm(n, 4000, 3000)

qol_base <- income_base + 0.1*home_base
qol_cbt  <- income_cbt + 0.1*home_cbt
delta_qol <- qol_cbt - qol_base

cost_no  <- rnorm(n, 0, 100)
cost_cbt <- rnorm(n, 1200, 300)
delta_cost <- cost_cbt - cost_no

icer <- delta_cost / delta_qol
inb  <- wtp*delta_qol - delta_cost

summary_out <- tibble(
  ICER_point_estimate = median(icer[is.finite(icer)]),
  Expected_incremental_net_benefit = mean(inb, na.rm=TRUE)
)
write_csv(summary_out, file.path(Sys.getenv("ARTIFACTS_DATA_DIR"), "bcea_summary.csv"))

# ---------------------------
# Part 8. Diagrams (placeholders)
# ---------------------------
png(file.path(Sys.getenv("ARTIFACTS_MAPS_DIR"), "diagram_conditions_x_cbt_phrases.png"), width=800, height=600)
plot(1,1,type="n",axes=FALSE,ann=FALSE)
title("Top 3 Conditions vs Top 3 CBT Phrases (Placeholder)")
dev.off()