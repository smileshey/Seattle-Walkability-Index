import React, { useState } from 'react';
import { Box, Slider, Typography, Tooltip, IconButton, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { handleRecalculate } from './walkscore_calculator';
import TopNeighborhoods from './top_neighborhoods';
import { Neighborhood } from './neighborhood_utils';
import { useMediaQuery } from '@mui/material';
import VisibilityState from './visibility_state';

const marks = [
  { value: 0 },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
];

const valueLabelFormat = (value: number) => {
  switch (value) {
    case 0: return 'Not';
    case 1: return 'A little';
    case 2: return 'Either way';
    case 3: return 'A Lot';
    case 4: return 'Very';
    default: return '';
  }
};

// New slider captions list
const sliderCaptions = [
  'Flat Ground',
  'Calm Streets',
  'Business Density',
  'Low Crime'
];

const BASE_LAYERS = {
  FISHNET: "walkscore_fishnet",
  NEIGHBORHOODS: "walkscore_neighborhoods",
};

const PERSONALIZED_LAYERS = {
  FISHNET: "personalized_walkscore_fishnet",
  NEIGHBORHOODS: "personalized_neighborhood_walkscore",
};

const SliderWidget = ({ view, webMap, triggerRecalculate }: { view: __esri.MapView; webMap: __esri.WebMap; triggerRecalculate: () => void }) => {
  const [values, setValues] = useState({
    slope: 2,
    streets: 2,
    amenity: 2,
    crime: 2,
  });
  // This holds the last-set slider values used for the recalc
  const [previousValues, setPreviousValues] = useState(values);

  const [isLoading, setIsLoading] = useState(false);
  const [topNeighborhoods, setTopNeighborhoods] = useState<Neighborhood[] | null>(null);
  const [recalculated, setRecalculated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isDesktop = useMediaQuery('(min-width: 1001px)');
  const visibilityState = new VisibilityState({ webMap });

  const handleSliderChange = (name: string) => (event: Event, value: number | number[]) => {
    setValues({
      ...values,
      [name]: value as number,
    });
  };

  const handleRecalculateButton = async () => {
    setIsLoading(true);
    setTopNeighborhoods(null);
    setPreviousValues(values);  // Save the slider settings we’re about to use

    try {
      const recalculatedNeighborhoods = await handleRecalculate(
        view,
        webMap,
        values,
        isDesktop,
        visibilityState
      );

      if (recalculatedNeighborhoods && recalculatedNeighborhoods.length > 0) {
        setTopNeighborhoods(recalculatedNeighborhoods);
      }

      setRecalculated(true);
      setIsLoading(false);
      triggerRecalculate();
    } catch (error) {
      console.error("Error during recalculation:", error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    console.log("Reset triggered. Synchronizing toggle state.");

    visibilityState.initializeDefaultVisibility();

    // Remove temporary layers
    const temporaryLayerTitles = [
      PERSONALIZED_LAYERS.FISHNET,
      PERSONALIZED_LAYERS.NEIGHBORHOODS,
    ];

    temporaryLayerTitles.forEach((title) => {
      const layer = webMap.allLayers.find((layer) => layer.title === title) as FeatureLayer;
      if (layer) {
        console.log(`Removing temporary layer: ${title}`);
        webMap.remove(layer);
      }
    });

    setRecalculated(false);
    setTopNeighborhoods(null);
    // Restore the slider values that were set before recalc (or default if you want)
    setValues(previousValues);
    setIsLoading(false);

    console.log("Application reset completed. Default visibility restored and UI reset.");
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box className="slider-widget-container">
      <Box className="slider-widget-header">
        <div className="slider-widget-title">
          {recalculated ? 'Your Most Walkable Neighborhoods' : "What's Most Important to You?"}
        </div>

        <Box className="slider-widget-icons">
          <Tooltip
            title="Adjust the sliders to change the walkscore displayed on the map. The more important a feature is, the more heavily the algorithm will weigh that feature"
            arrow
          >
            <IconButton size="small">
              <InfoIcon className="slider-info-icon" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={toggleExpand}>
            {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>

      {isExpanded && (
        <>
          <Box className="slider-divider"></Box>

          {/* Show either 'Loading...', top neighborhoods, or the sliders */}
          {isLoading ? (
            <Box className="loading-container">
              <div className="loading-circle">Loading...</div>
            </Box>
          ) : topNeighborhoods ? (
            <>
              {/* Top Neighborhoods */}
              <TopNeighborhoods
                neighborhoods={topNeighborhoods}
                view={view}
                webMap={webMap}
                showTextList={true}
              />

              {/* 
                Display the chosen slider values 
                e.g. "Your Selections: Slope=2, Streets=2, Amenity=1, Crime=4" 
              */}
            <Box mt={2}>
              <Typography 
                variant="body2" 
                style={{ fontSize: '0.5rem', fontStyle: 'italic' ,color : 'grey'}}
              >
                &nbsp;Slope:{previousValues.slope},
                &nbsp;Streets:{previousValues.streets},
                &nbsp;Business:{previousValues.amenity},
                &nbsp;Crime:{previousValues.crime}
              </Typography>
            </Box>
            </>
          ) : (
            <Box className="slider-content">
              {['slope', 'streets', 'amenity', 'crime'].map((feature, index) => (
                <Box key={feature} className="slider-row">
                  <Typography variant="caption" className="slider-caption">
                    {sliderCaptions[index]}
                  </Typography>
                  <Slider
                    size="small"
                    value={values[feature as keyof typeof values]}
                    onChange={handleSliderChange(feature)}
                    aria-labelledby={`${feature}-slider`}
                    min={0}
                    max={4}
                    step={1}
                    marks={marks}
                    valueLabelDisplay="auto"
                    valueLabelFormat={valueLabelFormat}
                    className="slider-element"
                  />
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {isExpanded && (
        <>
          <Box className="slider-divider"></Box>
          {recalculated ? (
            <Button onClick={handleReset} className="slider-reset-button">
              Reset
            </Button>
          ) : (
            <Button onClick={handleRecalculateButton} className="slider-recalculate-button">
              Recalculate Walkscore
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default SliderWidget;








