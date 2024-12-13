import * as fs from "fs";
import {
  getSlopeScaler,
  getEffectiveSpeedLimitScaler,
  getBusinessDensityScaler,
  getCrimeDensityScaler,
  getCrashDensityScaler,
} from "../UI/src/scaler_calculations";

// Define slider ranges
const sliderRanges = {
  slope: [0, 1, 2, 3, 4],
  streets: [0, 1, 2, 3, 4],
  amenity: [0, 1, 2, 3, 4],
  crime: [0, 1, 2, 3, 4],
};

// Generate combinations of slider values
const generateCombinations = (ranges: { [key: string]: number[] }) => {
  const keys = Object.keys(ranges);
  const combinations: { [key: string]: number }[] = [];

  const recurse = (index: number, current: { [key: string]: number }) => {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }

    const key = keys[index];
    ranges[key].forEach((value) => {
      current[key] = value;
      recurse(index + 1, current);
    });
  };

  recurse(0, {});
  return combinations;
};

// Load walkscore data from JSON file
const loadWalkscores = (filePath: string) => {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

// Precalculate walkscores
const precalculateWalkscores = (
  combinations: { [key: string]: number }[],
  features: any[]
) => {
  const precalculated: Record<
    string,
    { IndexID: number; personalized_walkscore: number }[]
  > = {};

  combinations.forEach((combination) => {
    const key = JSON.stringify(combination);

    precalculated[key] = features.map((attributes) => {
      const slopeScaler = getSlopeScaler(attributes.effective_slope, combination.slope);
      const speedLimitScaler = getEffectiveSpeedLimitScaler(attributes.Max_Speed_Limit, combination.streets);
      const businessDensityScaler = getBusinessDensityScaler(attributes.business_density, combination.amenity);
      const crimeDensityScaler = getCrimeDensityScaler(attributes.crime_density_normalized, combination.crime);
      const crashDensityScaler = getCrashDensityScaler(attributes.crash_density_normalized, combination.streets);

      const baseWalkscore = attributes.unadjusted_walkscore || 0.001;

      return {
        IndexID: attributes.IndexID,
        personalized_walkscore:
          baseWalkscore *
          slopeScaler *
          speedLimitScaler *
          businessDensityScaler *
          crimeDensityScaler *
          crashDensityScaler,
      };
    });
  });

  return precalculated;
};

// Main execution
const precalculate = () => {
  console.log("Loading walkscores data...");

  const walkscores = loadWalkscores("./walkscores.json");

  console.log("Generating slider combinations...");
  const sliderCombinations = generateCombinations(sliderRanges);

  console.log("Calculating walkscores for all combinations...");
  const precalculatedData = precalculateWalkscores(sliderCombinations, walkscores);

  fs.writeFileSync("./precalculated_walkscores.json", JSON.stringify(precalculatedData, null, 2));
  console.log("Walkscore data saved to precalculated_walkscores.json");
};

precalculate();


  