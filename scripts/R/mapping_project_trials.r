readRenviron("../../.Renviron.txt")

library(httr)
library(jsonlite)
library(dplyr)

# Base URL for v2 API
ctgov_base <- "https://clinicaltrials.gov/api/v2/studies"

# Define query parameters
ctgov_params <- list(
  format = "json",
  `query.locn` = "United States",
  `query.intr` = "cognitive behavioral therapy",
  pageSize = 100  # adjust as needed
)

# Make request
resp <- GET(ctgov_base, query = ctgov_params)

# Parse JSON
ct_data <- content(resp, as = "text", encoding = "UTF-8") |> fromJSON()

# Convert to tibble (studies are under 'studies')
ct_df <- as_tibble(ct_data$studies)

# Preview
print(ct_df)
ct_df$protocolSection$identificationModule$nctId
ct_df$protocolSection$identificationModule$orgStudyIdInfo
ct_df$protocolSection$descriptionModule$briefSummary
ct_df$protocolSection$conditionsModule$conditions
ct_df$protocolSection$designModule$studyType
ct_df$protocolSection$contactsLocationsModule$locations

ct_selected <- tibble(
  NCT = ct_df$protocolSection$identificationModule$nctId,
  OrgStudyId = ct_df$protocolSection$identificationModule$orgStudyIdInfo,
  BriefSummary = ct_df$protocolSection$descriptionModule$briefSummary,
  Conditions = ct_df$protocolSection$conditionsModule$conditions,
  StudyType = ct_df$protocolSection$designModule$studyType,
  Locations = ct_df$protocolSection$contactsLocationsModule$locations
)

ct_selected$Locations[1]


# Extract the first ZIP code for each trial
first_zip <- sapply(ct_selected$Locations, function(locs) {
  if (is.null(locs) || nrow(locs) == 0) {
    return(NA_character_)
  } else {
    return(locs$zip[1])  # first row's zip
  }
})

# Add it as a new column
ct_selected$FirstZip <- first_zip

head(ct_selected$FirstZip)


# 🔑 Flatten list-columns by collapsing into strings
ct_df_clean <- ct_df %>%
  mutate(across(where(is.list), ~ map_chr(., ~ paste(., collapse = "; "))))

# ✅ Now you can safely write to CSV
write_csv(
  ct_df_clean,
  Sys.getenv("TRIALS_CSV_PATH")
)

write_csv(ct_df, Sys.getenv("TRIALS_CSV_PATH"))

# Save entire object to JSON (preserves nested structure)
write_json(
  ct_df,
  Sys.getenv("TRIALS_JSON_PATH"),
  pretty = TRUE, auto_unbox = TRUE
)

install.packages("tidycensus")
library(tidycensus)

zcta <- tigris::zctas(cb = TRUE, year = 2020)

library(tigris)
library(sf)
library(dplyr)

# Keep only the ZCTA GEOID and geometry
zcta_centroids <- st_centroid(zctas)

options(tigris_use_cache = TRUE)

# Step 1: download ZCTA polygons (sf object)
zctas <- tigris::zctas(cb = TRUE, year = 2020)

# Step 2: compute centroids
zcta_centroids <- st_centroid(zctas)

# Step 3: inspect
head(zcta_centroids)

names(zctas)


trial_zips <- ct_selected %>%
  select(NCT, FirstZip) %>%
  mutate(FirstZip = sprintf("%05s", FirstZip)) %>%  # pad to 5 digits
  left_join(
    zcta_centroids %>% st_drop_geometry() %>% 
      select(GEOID20), 
    by = c("FirstZip" = "GEOID20")
  )


ct_with_zcta <- ct_selected %>%
  left_join(trial_zips, by = c("NCT", "FirstZip"))


states <- states(cb = TRUE, year = 2020)  # simplified state boundaries

# Using ZCTA centroids for plotting
trial_points <- trial_zips %>%
  left_join(st_drop_geometry(zcta_centroids), by = c("FirstZip" = "GEOID20"))

# 3. Extract centroid coordinates with GEOID
zcta_coords <- cbind(
  st_drop_geometry(zctas)[, c("ZCTA5CE20")],
  st_coordinates(zcta_centroids)
)

# 4. Join your trial ZIPs to centroid coordinates
trial_points <- ct_selected %>%
  select(NCT, FirstZip) %>%
  mutate(FirstZip = sprintf("%05s", FirstZip)) %>%
  left_join(zcta_coords, by = c("FirstZip" = "ZCTA5CE20"))

# 5. Convert to sf points
trial_points_sf <- st_as_sf(trial_points,
                            coords = c("X", "Y"),
                            crs = 4326)

# ---------------------------
# Part 3. ACS County Data
# ---------------------------
acs_base <- "https://api.census.gov/data/2023/acs/acs5"
acs_vars <- c("B19013_001E","B20017_001E","B23025_004E","B25077_001E")
var_str <- paste(acs_vars, collapse=",")

url <- paste0(acs_base,"?get=NAME,",var_str,"&for=county:*")
acs_raw <- fromJSON(url)
acs_df <- as_tibble(acs_raw[-1,])
names(acs_df) <- acs_raw[1,]

acs_df <- acs_df %>%
  mutate(GEOID = paste0(state, county)) %>%
  rename(
    Household_Income = B19013_001E,
    Median_Earnings = B20017_001E,
    Employment_Status_Scaled = B23025_004E,
    Median_Home_Value = B25077_001E
  )

# ---------------------------
# Part 3. ACS County Data
# ---------------------------
acs_base <- "https://api.census.gov/data/2023/acs/acs5"
acs_vars <- c("B19013_001E","B20017_001E","B23025_004E","B25077_001E")
var_str <- paste(acs_vars, collapse=",")

url <- paste0(acs_base,"?get=NAME,",var_str,"&for=county:*")
acs_raw <- fromJSON(url)
acs_df <- as_tibble(acs_raw[-1,])
names(acs_df) <- acs_raw[1,]

acs_df <- acs_df %>%
  mutate(GEOID = paste0(state, county)) %>%
  rename(
    Household_Income = B19013_001E,
    Median_Earnings = B20017_001E,
    Employment_Status_Scaled = B23025_004E,
    Median_Home_Value = B25077_001E
  )

write_csv(acs_df, Sys.getenv("ACS_COUNTY_CSV_PATH"))

# ---------------------------
# Part 4. BRFSS State Data
# ---------------------------
brfss_url <- "https://data.cdc.gov/resource/5eh7-pjx8.json"
brfss_query <- list(
  question = "During the past 30 days, how many days did poor physical or mental health keep you from doing your usual activities, such as self-care, work or recreation?",
  year = "2023"
)

brfss_resp <- GET(brfss_url, query = brfss_query)
brfss_data <- content(brfss_resp, as="text", encoding="UTF-8") |> fromJSON(flatten=TRUE)
brfss_df <- as_tibble(brfss_data)

write_csv(brfss_df, Sys.getenv("BRFSS_ACTIVITY_CSV_PATH"))


# Prepare empty vectors
nct_ids <- character()
first_locations <- character()

# Loop over each trial
for (i in seq_len(nrow(ct_df))) {
  trial <- ct_df$protocolSection[[i]]
  
  # --- NCT ID ---
  nct_id <- NA_character_
  if (!is.null(trial$identificationModule) &&
      !is.null(trial$identificationModule$nctId) &&
      length(trial$identificationModule$nctId) > 0) {
    nct_id <- trial$identificationModule$nctId[1]
  }
  
  # --- First location ---
  loc <- NA_character_
  if (!is.null(trial$contactsLocationsModule) &&
      !is.null(trial$contactsLocationsModule$locations) &&
      length(trial$contactsLocationsModule$locations) > 0) {
    # iterate through locations if you want, here just take the first
    loc <- trial$contactsLocationsModule$locations[[1]]$facility
  }
  
  # Store results
  nct_ids <- c(nct_ids, nct_id)
  first_locations <- c(first_locations, loc)
}

# Build dataframe
ct_location <- data.frame(
  NCT = nct_ids,
  location = first_locations,
  stringsAsFactors = FALSE
)

head(ct_location)





# 3. Extract centroid coordinates into a data frame
coords_df <- st_coordinates(zcta_centroids) %>%
  as.data.frame() %>%
  mutate(ZCTA5CE20 = zctas$ZCTA5CE20) %>%   # attach the ZCTA ID
  rename(X = X, Y = Y)                        # X = lon, Y = lat

# 4. Join your trial ZIPs to centroid coordinates
trial_points <- ct_selected %>%
  select(NCT, FirstZip) %>%
  mutate(FirstZip = sprintf("%05s", FirstZip)) %>%
  left_join(coords_df, by = c("FirstZip" = "ZCTA5CE20"))

# 5. Now you have X and Y columns in your dataframe
head(trial_points)



trial_points <- ct_selected %>%
  select(NCT, FirstZip, BriefSummary, Conditions, StudyType) %>%
  mutate(FirstZip = sprintf("%05s", FirstZip)) %>%
  left_join(coords_df, by = c("FirstZip" = "ZCTA5CE20"))


trial_points_sf <- st_as_sf(trial_points,
                            coords = c("X", "Y"),
                            crs = 4326)


# 1. Keep only trials with valid coordinates
trial_points_clean <- trial_points %>%
  filter(!is.na(X) & !is.na(Y))

# 2. Convert to sf points
trial_points_sf <- st_as_sf(trial_points_clean,
                            coords = c("X", "Y"),
                            crs = 4326)

# 3. Get state boundaries
states <- states(cb = TRUE, year = 2020)

# 4. Plot
# Plot: just dots
ggplot() +
  geom_sf(data = states, fill = "white", color = "gray70") +
  geom_sf(data = trial_points_sf, color = "red", size = 1, alpha = 0.7) +
  theme_minimal() +
  labs(title = "Clinical Trials with Valid Location Data",
       subtitle = "Plotted as simple dots")

ggplot() +
  geom_sf(data = states, fill = "white", color = "gray70") +
  geom_sf(data = trial_points_sf, color = "red", size = 2, alpha = 0.7) +
  coord_sf(
    xlim = c(-125, -60),   # longitude range (west to east)
    ylim = c(25, 50)       # latitude range (south to north)
  ) +
  theme_minimal() +
  labs(
    title = "Clinical Trials with Valid Location Data",
    subtitle = "Zoomed to the continental U.S."
  )