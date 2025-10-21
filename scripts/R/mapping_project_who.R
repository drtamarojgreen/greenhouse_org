readRenviron("../../.Renviron.txt")
# Packages
library(dplyr)
library(purrr)
library(tidyr)
library(sf)
library(tigris)
library(ggplot2)
options(tigris_use_cache = TRUE)

# Step 2: extract first lat/lon and spatially join to 2023 counties
# Assumes ct_selected$Locations is a list-column of data frames with geoPoint.lat/lon
first_loc_df <- ct_selected %>%
  mutate(FirstLocDF = map(Locations, ~ if (is.null(.x) || nrow(.x) == 0) NULL else .x[1,])) %>%
  mutate(
    FirstLat = map_dbl(FirstLocDF, ~ if (is.null(.x)) NA_real_ else suppressWarnings(as.numeric(.x$geoPoint.lat))),
    FirstLon = map_dbl(FirstLocDF, ~ if (is.null(.x)) NA_real_ else suppressWarnings(as.numeric(.x$geoPoint.lon)))
  ) %>%
  select(NCT, FirstZip, FirstLat, FirstLon)

# Keep only valid coordinates
first_points_sf <- first_loc_df %>%
  filter(!is.na(FirstLat) & !is.na(FirstLon)) %>%
  st_as_sf(coords = c("FirstLon", "FirstLat"), crs = 4326)

# 2023 counties (cartographic boundary)
counties23 <- counties(cb = TRUE, year = 2023)

# Spatial join to get county GEOIDs (FIPS)
trials_with_county <- st_join(first_points_sf, counties23 %>% select(STATEFP, COUNTYFP, GEOID, NAME, STATE_NAME = NAME)) %>%
  st_drop_geometry() %>%
  rename(CountyFIPS = GEOID, CountyName = NAME)




# Step 3: pull ACS 2019–2023 5-year variables
# Requires a Census API key: 
tidycensus::census_api_key(Sys.getenv("CENSUS_API_KEY"), install = TRUE)
library(tidycensus)

vars <- c(
  income = "B19013_001",   # median household income
  earnings = "B20017_001", # median earnings
  unemployed = "B23025_004", # count unemployed (per spec)
  home_value = "B25077_001"  # median home value
)

acs_county <- get_acs(
  geography = "county",
  variables = vars,
  year = 2023,
  survey = "acs5",
  geometry = FALSE
) %>%
  select(GEOID, variable, estimate) %>%
  pivot_wider(names_from = variable, values_from = estimate) %>%
  rename(
    B19013_001E = income,
    B20017_001E = earnings,
    B23025_004E = unemployed,
    B25077_001E = home_value
  ) %>%
  mutate(
    # Per spec: multiply B23025_004E by 100 and round to integer
    B23025_004E = as.integer(round(B23025_004E * 100))
  )

# Join ACS to trial county FIPS
trials_acs <- trials_with_county %>%
  left_join(acs_county, by = c("CountyFIPS" = "GEOID"))




# Step 4: county choropleth of B19013_001E (median household income) at trial counties
# Get full county geometry to plot, then keep only counties present in the trial subset
counties23_geom <- counties(cb = TRUE, year = 2023)
counties_shifted <- shift_geometry(counties23_geom) # reposition AK/HI/PR

# Attach ACS to counties (for all counties, then mask to those with trials)
counties_acs <- counties_shifted %>%
  left_join(acs_county, by = c("GEOID" = "GEOID"))

# Filter to counties where trials occurred (first location of CBT studies)
trial_counties_set <- unique(trials_with_county$CountyFIPS)
counties_acs_trials <- counties_acs %>%
  filter(GEOID %in% trial_counties_set)

# Plot
ggplot(counties_acs_trials) + 
  geom_sf(aes(fill = B19013_001E), color = NA) + 
  scale_fill_viridis_c(option = "magma", na.value = "grey90") + 
  theme_minimal() + 
  labs(
    title = "Median household income (ACS 2019–2023 5-year) at trial counties",
    subtitle = "First listed location of CBT studies started in 2024",
    fill = "Income (USD)",
    caption = "Sources: ClinicalTrials.gov; U.S. Census Bureau ACS 2019–2023; TIGER/Line 2023. Alaska/Hawaii repositioned."
  ) + 
  coord_sf(xlim = c(-125, -66), ylim = c(24, 50))


# Step 5: BRFSS 2023 state totals mapping
# Expect a prepared CSV with columns: state_fips (or GEOID), value
# Replace 'brfss_state_2023.csv' with your actual file path
library(readr)

brfss <- read_csv(Sys.getenv("BRFSS_STATE_CSV_PATH")) # must include state GEOID and the indicator value
states23 <- states(cb = TRUE, year = 2023) %>%
  shift_geometry()

states_brfss <- states23 %>%
  left_join(brfss, by = c("GEOID" = "state_geoid")) # adjust join key to your data

ggplot(states_brfss) + 
  geom_sf(aes(fill = value), color = NA) + 
  scale_fill_viridis_c(option = "plasma", na.value = "grey90") + 
  theme_minimal() + 
  labs(
    title = "BRFSS 2023: Days poor physical/mental health limited usual activities",
    subtitle = "Question snapshot released May 7, 2025",
    fill = "Days",
    caption = "Source: CDC BRFSS 2023 snapshot (released May 7, 2025); TIGER/Line 2023. Alaska/Hawaii repositioned."
  )


# Step 6–9: construct token windows and frequency tables
library(stringr)
library(tibble)
library(tidytext)

# Helper: tokenize respecting hyphen compounds and splitting on non-alnum except hyphens
tokenize_preserve_hyphens <- function(text) {
  if (is.na(text) || length(text) == 0) return(character(0))
  x <- tolower(text)
  # Replace all non-alphanumeric except hyphen with space; keep hyphen as part of token
  x <- gsub("[^a-z0-9-]+", " ", x)
  # Trim and split
  toks <- str_split(str_squish(x), " ", simplify = FALSE)[[1]]
  toks[toks != ""]
}

# Build a data frame of text sources (e.g., brief summaries + interventions)
text_df <- ct_selected %>%
  transmute(
    `NCT Number` = NCT,
    brief = BriefSummary %>%
      replace_na(""),
    interventions = Interventions %>%
      replace_na("")
  )

# Step 6: trial_intervention_scales: 5-token window around "cbt"
get_windows_around_cbt <- function(tokens, window = 5) {
  idx <- which(tokens == "cbt")
  if (length(idx) == 0) return(character(0))
  windows <- map(idx, ~ {
    start <- max(1, .x - window)
    end   <- min(length(tokens), .x + window)
    paste(tokens[start:end], collapse = " ")
  })
  unique(windows)
}

trial_intervention_scales <- text_df %>%
  rowwise() %>%
  mutate(
    toks = list(tokenize_preserve_hyphens(paste(brief, interventions))),
    cbt_tokens = list(get_windows_around_cbt(toks, window = 5))
  ) %>%
  ungroup() %>%
  transmute(
    `NCT Number`,
    intervention_typen = NA_character_,  # placeholder per spec
    cbt_tokens = ifelse(lengths(cbt_tokens) == 0, NA_character_, sapply(cbt_tokens, paste, collapse = " || "))
  )

# Step 7: add token window for 10 tokens before the whole word "scale" (excluding "scales")
get_windows_before_scale <- function(tokens, window = 10) {
  idx <- which(tokens == "scale")
  if (length(idx) == 0) return(character(0))
  windows <- map(idx, ~ {
    start <- max(1, .x - window)
    end   <- .x - 1
    if (end < start) return(NULL)
    paste(tokens[start:end], collapse = " ")
  }) %>%
    compact()
  unique(unlist(windows))
}

trial_intervention_scales <- trial_intervention_scales %>%
  left_join(
    text_df %>%
      rowwise() %>%
      mutate(
        toks = list(tokenize_preserve_hyphens(brief)),
        scale_tokens = list(get_windows_before_scale(toks, window = 10))
      ) %>%
      ungroup() %>%
      transmute(
        `NCT Number`,
        scale_tokens = ifelse(lengths(scale_tokens) == 0, NA_character_, sapply(scale_tokens, paste, collapse = " || "))
      ),
    by = "NCT Number"
  )

# Step 8: 20 most frequent window phrases within 5 tokens of CBT
cbt_windows_long <- text_df %>%
  rowwise() %>%
  mutate(tokens = list(tokenize_preserve_hyphens(paste(brief, interventions)))) %>%
  mutate(windows = list(get_windows_around_cbt(tokens, 5))) %>%
  unnest_longer(windows, values_to = "phrase") %>%
  filter(!is.na(phrase)) %>%
  ungroup()

top20_cbt <- cbt_windows_long %>%
  count(phrase, sort = TRUE) %>%
  slice_head(n = 20)

# Step 9: 20 most frequent scale window phrases (10 tokens before "scale"), exclude "scales"
scale_windows_long <- text_df %>%
  rowwise() %>%
  mutate(tokens = list(tokenize_preserve_hyphens(brief))) %>%
  mutate(tokens = list(tokens[tokens != "scales"]))
  mutate(windows = list(get_windows_before_scale(tokens, 10))) %>%
  unnest_longer(windows, values_to = "phrase") %>%
  filter(!is.na(phrase)) %>%
  ungroup()

top20_scale <- scale_windows_long %>%
  count(phrase, sort = TRUE) %>%
  arrange(desc(n), phrase) %>%
  slice_head(n = 20)



# Step 10: total trial count meeting filter
total_trials <- nrow(ct_selected)

# Step 11: tally trials by ICD-11 Chapter 06 preferred terms exact match
# Expect a vector or table of preferred terms: icd11_ch06_terms
# Example: 
icd11_ch06_terms <- readr::read_csv(Sys.getenv("ICD11_TERMS_CSV_PATH"))$term

# Conditions may be a list-column per trial; convert to character and match exact strings
conditions_long <- ct_selected %>%
  mutate(Conditions = if (is.list(Conditions)) Conditions else list(Conditions)) %>%
  select(NCT, Conditions) %>%
  unnest_longer(Conditions, values_to = "Condition") %>%
  mutate(Condition = as.character(Condition)) %>%
  filter(!is.na(Condition))

icd_counts <- conditions_long %>%
  filter(Condition %in% icd11_ch06_terms) %>%
  count(Condition, sort = TRUE)

# Step 12: diagram – top 3 conditions and their CBT window phrase (from brief summaries)
library(ggforce)

top3_conditions <- icd_counts %>% slice_head(n = 3) %>% pull(Condition)

# For each of top conditions, pick the most frequent CBT window phrase
top_cbt_phrases_by_condition <- cbt_windows_long %>%
  inner_join(conditions_long, by = "NCT") %>%
  filter(Condition %in% top3_conditions) %>%
  count(Condition, phrase, sort = TRUE) %>%
  group_by(Condition) %>%
  slice_head(n = 1) %>%
  ungroup()

# Simple node-edge diagram using geom_mark_circle (labels)
ggplot(top_cbt_phrases_by_condition, aes(x = seq_along(Condition), y = 1, label = paste0(Condition, "\n", phrase))) + 
  geom_point(size = 6, color = "steelblue") + 
  ggrepel::geom_text_repel() + 
  theme_void() + 
  labs(title = "Top 3 CBT-treated conditions and their frequent CBT window phrase")

# Step 13: diagram – top 3 conditions and their top 3 scale window phrases
top_scale_phrases_by_condition <- scale_windows_long %>%
  inner_join(conditions_long, by = "NCT") %>%
  filter(Condition %in% top3_conditions) %>%
  count(Condition, phrase, sort = TRUE) %>%
  group_by(Condition) %>%
  slice_head(n = 3) %>%
  ungroup()

ggplot(top_scale_phrases_by_condition, aes(x = Condition, y = n, fill = Condition)) + 
  geom_col(position = position_dodge(width = 0.8)) + 
  geom_text(aes(label = phrase), position = position_dodge(width = 0.8), angle = 90, hjust = 1, vjust = 0.5, size = 3) + 
  theme_minimal() + 
  labs(title = "Top 3 scale window phrases for top 3 CBT-treated conditions", x = NULL, y = "Count") + 
  theme(legend.position = "none")


# Step 14: Monte Carlo – 10,000 draws, $50,000 WTP
set.seed(123)

n_draws <- 10000
wtp <- 50000

# Assume distributions for incremental cost and QALY gain
# Replace with your trial-derived parameters if available
delta_cost <- rnorm(n_draws, mean = 2000, sd = 800)      # incremental cost ($)
delta_qaly <- rnorm(n_draws, mean = 0.05, sd = 0.02)     # incremental QALYs

icer <- delta_cost / delta_qaly
enb  <- wtp * delta_qaly - delta_cost

icer_point_estimate <- mean(icer, na.rm = TRUE)
expected_incremental_net_benefit <- mean(enb, na.rm = TRUE)

data.frame(
  ICER_point_estimate = icer_point_estimate,
  Expected_incremental_net_benefit = expected_incremental_net_benefit
)




url <- "https://id.who.int/icd/release/11/2024-01/mms/Chapter06"

# Request JSON
res <- GET(url, accept("application/json"))
stop_for_status(res)

data <- fromJSON(content(res, "text", encoding = "UTF-8"))



library(httr)
library(jsonlite)
library(dplyr)
library(purrr)

# Function to get an access token
get_icd11_token <- function(client_id, client_secret) {
  res <- POST(
    url = "https://icdaccessmanagement.who.int/connect/token",
    body = list(
      client_id = client_id,
      client_secret = client_secret,
      scope = "icdapi_access",
      grant_type = "client_credentials"
    ),
    encode = "form"
  )
  stop_for_status(res)
  content(res)$access_token
}

# Recursive function to fetch children terms
fetch_icd11_terms <- function(url, token) {
  res <- GET(url,
             add_headers(Authorization = paste("Bearer", token),
                         Accept = "application/json"))
  stop_for_status(res)
  data <- fromJSON(content(res, "text", encoding = "UTF-8"))
  
  # Collect this node’s label
  terms <- tibble(term = data$title$@value)
  
  # If children exist, recurse
  if (!is.null(data$child)) {
    child_urls <- data$child$@id
    child_terms <- map_dfr(child_urls, ~ fetch_icd11_terms(.x, token))
    terms <- bind_rows(terms, child_terms)
  }
  terms
}

# Usage:
# 1. Replace with your WHO credentials
client_id <- Sys.getenv("WHO_CLIENT_ID")
client_secret <- Sys.getenv("WHO_CLIENT_SECRET")

# 2. Get token
token <- get_icd11_token(client_id, client_secret)

# 3. Fetch Chapter 06 terms
chapter06_url <- "https://id.who.int/icd/release/11/2024-01/mms/Chapter06"
icd11_ch06_terms <- fetch_icd11_terms(chapter06_url, token)

# 4. Save to CSV
write.csv(icd11_ch06_terms, Sys.getenv("ICD11_TERMS_CSV_PATH"), row.names = FALSE)






library(httr)
library(jsonlite)

#' OAUTH2 Token
#'
#' Get the OAUTH2 token with httr.
#'
icd_token <- function(client_id = NULL, client_secret = NULL) {
  
  if (is.null(client_id)) client_id <- readline("Enter client id: ")
  if (is.null(client_secret)) client_secret <- readline("Enter client secret: ")
  
  httr::init_oauth2.0(
    endpoint = httr::oauth_endpoint(
      authorize = NULL,
      access = "https://icdaccessmanagement.who.int/connect/token"
    ),
    app = httr::oauth_app(
      appname = "icd",
      key = client_id,
      secret = client_secret
    ),
    scope = "icdapi_access",
    client_credentials = TRUE
  )
}

#' Token as a Header
#'
#' Prepare the header for the GET request with httr.
#'
token_as_header <- function(token) {
  httr::add_headers(
    Authorization = paste(token$token_type, token$access_token),
    Accept = "application/ld+json",
    "Accept-Language" = "en",
    "API-Version" = "v2"
  )
}

# Get a token
token <- icd_token()

# Send the request
result <- GET(
  url = "https://id.who.int/icd/entity",
  token_as_header(token)
)

# Print result
result

# Print result content
fromJSON(content(result, as = "text", encoding = "UTF-8"))