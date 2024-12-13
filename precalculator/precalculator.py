import json
import itertools
from scaler_calculations import (
    get_slope_scaler,
    get_effective_speed_limit_scaler,
    get_business_density_scaler,
    get_crime_density_scaler,
    get_crash_density_scaler,
)

# Define slider ranges
slider_ranges = {
    "slope": [0, 1, 2, 3, 4],
    "streets": [0, 1, 2, 3, 4],
    "amenity": [0, 1, 2, 3, 4],
    "crime": [0, 1, 2, 3, 4],
}

# Load walkscore data from JSON
def load_walkscores(file_path):
    with open(file_path, "r") as f:
        return json.load(f)

# Generate slider combinations
def generate_combinations(ranges):
    keys = ranges.keys()
    values = ranges.values()
    return [dict(zip(keys, combo)) for combo in itertools.product(*values)]

# Precalculate walkscore combinations
def precalculate_walkscores(combinations, features):
    precalculated = {}
    for combination in combinations:
        key = json.dumps(combination)
        precalculated[key] = [
            {
                "IndexID": feature["IndexID"],
                "personalized_walkscore": (
                    feature["unadjusted_walkscore"]
                    * get_slope_scaler(feature["effective_slope"], combination["slope"])
                    * get_effective_speed_limit_scaler(feature["Max_Speed_Limit"], combination["streets"])
                    * get_business_density_scaler(feature["business_density"], combination["amenity"])
                    * get_crime_density_scaler(feature["crime_density_normalized"], combination["crime"])
                    * get_crash_density_scaler(feature["crash_density_normalized"], combination["streets"])
                )
                + 0.001  # Ensure non-zero
            }
            for feature in features
        ]
    return precalculated

# Main function
def main():
    print("Loading walkscores.json...")
    with open("walkscores.json", "r") as f:
        walkscores_data = json.load(f)
    
    # Extract features array
    if "features" not in walkscores_data:
        raise ValueError("Invalid walkscores.json structure: Missing 'features' key.")
    
    features = [feature["attributes"] for feature in walkscores_data["features"]]

    print(f"Loaded {len(features)} features.")

    print("Generating combinations...")
    slider_combinations = generate_combinations(slider_ranges)

    print("Calculating walkscore combinations...")
    precalculated_data = precalculate_walkscores(slider_combinations, features)

    # Save to a JSON file
    output_file = "walkscore_combinations.json"
    with open(output_file, "w") as f:
        json.dump(precalculated_data, f, indent=2)

    print(f"Walkscore combinations saved to {output_file}")


if __name__ == "__main__":
    main()
