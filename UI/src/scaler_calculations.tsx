export const getSlopeScaler = (slopeValue: number, importanceLevel: number): number => {
  if (slopeValue == null || slopeValue < 0) return 1.0;

  switch (importanceLevel) {
    case 0: // "Slope is not important"
      if (slopeValue < 2) return 1.0;
      if (2 <= slopeValue && slopeValue < 3) return 1.0;
      if (3 <= slopeValue && slopeValue < 4) return 1.0;
      if (4 <= slopeValue && slopeValue < 5) return 1.0;
      if (5 <= slopeValue && slopeValue < 7) return 1.0;
      if (7 <= slopeValue && slopeValue < 10) return 1.0;
      if (10 <= slopeValue && slopeValue < 15) return 1.0;
      if (15 <= slopeValue && slopeValue < 20) return 1.0;
      if (20 <= slopeValue && slopeValue < 25) return 1.0;
      return 1.0;
    case 1:
      if (slopeValue < 2) return 1.0;
      if (2 <= slopeValue && slopeValue < 3) return 1.0;
      if (3 <= slopeValue && slopeValue < 4) return 1.0;
      if (4 <= slopeValue && slopeValue < 5) return 0.99;
      if (5 <= slopeValue && slopeValue < 7) return 0.95;
      if (7 <= slopeValue && slopeValue < 10) return 0.9;
      if (10 <= slopeValue && slopeValue < 15) return 0.8;
      if (15 <= slopeValue && slopeValue < 20) return 0.7;
      if (20 <= slopeValue && slopeValue < 25) return 0.5;
      return 0.25;
    case 2:
      if (slopeValue < 2) return 1.0;
      if (2 <= slopeValue && slopeValue < 3) return 0.9;
      if (3 <= slopeValue && slopeValue < 4) return 0.7;
      if (4 <= slopeValue && slopeValue < 5) return 0.5;
      if (5 <= slopeValue && slopeValue < 7) return 0.3;
      if (7 <= slopeValue && slopeValue < 10) return 0.1;
      if (10 <= slopeValue && slopeValue < 15) return 0.01;
      if (15 <= slopeValue && slopeValue < 20) return 0.0;
      if (20 <= slopeValue && slopeValue < 25) return 0.0;
      return 0.0;
    case 3:
      if (slopeValue < 2) return 1.0;
      if (2 <= slopeValue && slopeValue < 3) return 1.0;
      if (3 <= slopeValue && slopeValue < 4) return 0.5;
      if (4 <= slopeValue && slopeValue < 5) return 0.3;
      if (5 <= slopeValue && slopeValue < 7) return 0.01;
      if (7 <= slopeValue && slopeValue < 10) return 0.0;
      if (10 <= slopeValue && slopeValue < 15) return 0;
      if (15 <= slopeValue && slopeValue < 20) return 0;
      if (20 <= slopeValue && slopeValue < 25) return 0;
      return 0.0;
    case 4: // "Slope is very important"
      if (slopeValue < 2) return 1.0;
      if (2 <= slopeValue && slopeValue < 3) return .5;
      if (3 <= slopeValue && slopeValue < 4) return 0.3;
      if (4 <= slopeValue && slopeValue < 5) return 0.01;
      if (5 <= slopeValue && slopeValue < 7) return 0.0;
      if (7 <= slopeValue && slopeValue < 10) return 0;
      if (10 <= slopeValue && slopeValue < 15) return 0;
      if (15 <= slopeValue && slopeValue < 20) return 0;
      if (20 <= slopeValue && slopeValue < 25) return 0;
      return 0.0;
    default:
      return 1.0;
  }
};

// Calm Streets Scaler based on Average Speed Limit with Importance Levels
export const getEffectiveSpeedLimitScaler = (speedLimitValue: number, importanceLevel: number): number => {
  if (speedLimitValue == null || speedLimitValue < 0) return 1.0;

  switch (importanceLevel) {
    case 0: // "Speed limit is not important"
      if (speedLimitValue < 15) return 1.0;
      if (15 <= speedLimitValue && speedLimitValue < 20) return 1.0;
      if (20 <= speedLimitValue && speedLimitValue < 25) return 1.0;
      if (25 <= speedLimitValue && speedLimitValue < 30) return 1.0;
      if (30 <= speedLimitValue && speedLimitValue < 35) return 1.0;
      if (35 <= speedLimitValue && speedLimitValue < 40) return 1.0;
      if (40 <= speedLimitValue && speedLimitValue < 45) return 1.0;
      if (45 <= speedLimitValue && speedLimitValue < 60) return 1.0;
      return 1.0;
    case 1:
      if (speedLimitValue < 15) return 1.0;
      if (15 <= speedLimitValue && speedLimitValue < 20) return 1.0;
      if (20 <= speedLimitValue && speedLimitValue < 25) return 1.0;
      if (25 <= speedLimitValue && speedLimitValue < 30) return 1.0;
      if (30 <= speedLimitValue && speedLimitValue < 35) return 1.0;
      if (35 <= speedLimitValue && speedLimitValue < 40) return 0.6;
      if (40 <= speedLimitValue && speedLimitValue < 45) return 0.3;
      if (45 <= speedLimitValue && speedLimitValue < 60) return 0.1;
      return 0.0;
    case 2: // Default importance level (updated to match the Python function)
      if (speedLimitValue <= 0) return 1.0;
      if (speedLimitValue < 15) return 0.95;
      if (15 <= speedLimitValue && speedLimitValue < 20) return 0.9;
      if (20 <= speedLimitValue && speedLimitValue < 25) return 0.85;
      if (25 <= speedLimitValue && speedLimitValue < 30) return 0.75;
      if (30 <= speedLimitValue && speedLimitValue < 35) return 0.6;
      if (35 <= speedLimitValue && speedLimitValue < 40) return 0.4;
      if (40 <= speedLimitValue && speedLimitValue < 45) return 0.2;
      if (45 <= speedLimitValue && speedLimitValue < 60) return 0.01;
      return 0.0;
    case 3:
      if (speedLimitValue <= 0) return 1.2;
      if (speedLimitValue < 15) return 1.2;
      if (15 <= speedLimitValue && speedLimitValue < 20) return 1.0;
      if (20 <= speedLimitValue && speedLimitValue < 25) return 0.8;
      if (25 <= speedLimitValue && speedLimitValue < 30) return 0.6;
      if (30 <= speedLimitValue && speedLimitValue < 35) return 0.3;
      if (35 <= speedLimitValue && speedLimitValue < 40) return 0.0;
      if (40 <= speedLimitValue && speedLimitValue < 45) return 0;
      if (45 <= speedLimitValue && speedLimitValue < 60) return 0;
      return 0.0;
    case 4: // "Speed limit is very important"
      if (speedLimitValue <= 0) return 1.5;
      if (speedLimitValue < 15) return 1.5;
      if (15 <= speedLimitValue && speedLimitValue < 20) return 1.0;
      if (20 <= speedLimitValue && speedLimitValue < 25) return 0.9;
      if (25 <= speedLimitValue && speedLimitValue < 30) return 0.3;
      if (30 <= speedLimitValue && speedLimitValue < 35) return 0;
      if (35 <= speedLimitValue && speedLimitValue < 40) return 0;
      if (40 <= speedLimitValue && speedLimitValue < 45) return 0;
      if (45 <= speedLimitValue && speedLimitValue < 60) return 0;
      return 0.0;
    default:
      return 1.0;
  }
};

/// business density scaler
export const getBusinessDensityScaler = (businessDensityValue: number, importanceLevel: number): number => {
  if (businessDensityValue == null || businessDensityValue < 0) return 1.0;

  switch (importanceLevel) {
    case 0: // "Business density is not important"
      return 1.0; // No scaling applied regardless of businessDensityValue

    case 1: // Slightly important
      if (businessDensityValue >= 9) return 1.5;
      if (businessDensityValue >= 8) return 1.4;
      if (businessDensityValue >= 7) return 1.3;
      if (businessDensityValue >= 6) return 1.2;
      if (businessDensityValue >= 5) return 1.1;
      return 1.0;

    case 2: // Default importance level (updated to match the Python function)
      if (businessDensityValue >= 9) return 2.0;
      if (businessDensityValue >= 8) return 1.8;
      if (businessDensityValue >= 7) return 1.6;
      if (businessDensityValue >= 6) return 1.4;
      if (businessDensityValue >= 5) return 1.2;
      return 1.0;

    case 3: // Higher importance
      if (businessDensityValue >= 9) return 5.0;
      if (businessDensityValue >= 8) return 2.0;
      if (businessDensityValue >= 7) return 1.5;
      if (businessDensityValue >= 6) return 1.0;
      if (businessDensityValue >= 5) return 1.0;
      return 0.5;

    case 4: // "Business density is very important"
      if (businessDensityValue >= 9.5) return 8.0;
      if (businessDensityValue >= 9.0) return 4.0;
      if (businessDensityValue >= 8.5) return 1.0;
      if (businessDensityValue >= 8) return 1.0;
      if (businessDensityValue >= 7) return 0.5;
      if (businessDensityValue >= 6) return 0.25;
      if (businessDensityValue >= 5) return 0.0;
      return 0.0;

    default:
      return 1.0; // Default case if importance level is not recognized
  }
};

// Tree canopy density scaler
export function getCanopyDensityScaler(canopyDensityValue: number | null | undefined, importanceLevel: number): number {
  if (canopyDensityValue === null || canopyDensityValue === undefined || canopyDensityValue <= 0) {
      return 1.0;
  }

  switch (importanceLevel) {
      case 0:
          return 1.0;

      case 1:
          if (canopyDensityValue >= 9) return 1.5;
          if (canopyDensityValue >= 8) return 1.4;
          if (canopyDensityValue >= 7) return 1.3;
          if (canopyDensityValue >= 6) return 1.2;
          if (canopyDensityValue >= 5) return 1.1;
          return 1.0;

      case 2:
          if (canopyDensityValue >= 9) return 2.0;
          if (canopyDensityValue >= 8) return 1.8;
          if (canopyDensityValue >= 7) return 1.6;
          if (canopyDensityValue >= 6) return 1.4;
          if (canopyDensityValue >= 5) return 1.2;
          return 1.0;

      case 3:
          if (canopyDensityValue >= 9) return 3.0;
          if (canopyDensityValue >= 8) return 2.5;
          if (canopyDensityValue >= 7) return 2.0;
          if (canopyDensityValue >= 6) return 1.5;
          if (canopyDensityValue >= 5) return 1.2;
          return 1.0;

      case 4:
          if (canopyDensityValue >= 9) return 10.0;
          if (canopyDensityValue >= 8) return 3.0;
          if (canopyDensityValue >= 7) return 1.0;
          if (canopyDensityValue >= 6) return 1.0;
          if (canopyDensityValue >= 5) return 0.0;
          return 0.0;

      default:
          return 1.0;
  }
}

/// Crime density scaler
export const getCrimeDensityScaler = (crimeDensityValue: number, importanceLevel: number): number => {
  if (crimeDensityValue == null || crimeDensityValue < 0) return 1.0;

  switch (importanceLevel) {
    case 0: // "Crime density is not important"
      return 1.0; // No scaling applied regardless of crimeDensityValue

    case 1: // Slightly important
      if (crimeDensityValue < 2.0) return 1.1;
      if (crimeDensityValue < 4.0) return 1.00;
      if (crimeDensityValue < 6.0) return 1.00;
      if (crimeDensityValue <= 7.0) return 1.0;
      return 1.0;

    case 2: // Default importance level (based on Python function)
      if (crimeDensityValue < 2.0) return 1.1;
      if (crimeDensityValue < 4.0) return 1.05;
      if (crimeDensityValue < 6.0) return 1.02;
      if (crimeDensityValue <= 7.0) return 1.0;
      return 1.0;

    case 3: // Higher importance
      if (crimeDensityValue < 2.0) return 1.5;
      if (crimeDensityValue < 4.0) return 1.2;
      if (crimeDensityValue < 6.0) return 1.05;
      if (crimeDensityValue <= 7.0) return 1.00;
      return 0.5;

    case 4: // "Crime density is very important"
      if (crimeDensityValue < 1.0) return 4.0;
      if (crimeDensityValue < 2.0) return 2.0;
      if (crimeDensityValue < 3.0) return 1.0;
      if (crimeDensityValue < 4.0) return 0.5;
      if (crimeDensityValue < 5.0) return 0.25;
      if (crimeDensityValue < 6.0) return 0.0;
      if (crimeDensityValue <= 7.0) return 0.0;
      return 0.0;

    default:
      return 1.0; // Default case if importance level is not recognized
  }
};





  