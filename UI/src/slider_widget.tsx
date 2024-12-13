import React, { useState } from 'react';
import { Box, Slider, Typography, Tooltip, IconButton, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    case 0:
      return 'Not';
    case 1:
      return 'A little';
    case 2:
      return 'Either way';
    case 3:
      return 'A Lot';
    case 4:
      return 'Very';
    default:
      return '';
  }
};

// New slider captions list
const sliderCaptions = [
  'Flat Ground',
  'Calm Streets',
  'Business Density',
  'Crime'
];

const SliderWidget = ({ view, webMap, triggerRecalculate }: { view: __esri.MapView; webMap: __esri.WebMap; triggerRecalculate: () => void }) => {
  const [values, setValues] = useState({
    slope: 2,
    streets: 2,
    amenity: 2,
    crime: 2,
  });
  const [previousValues, setPreviousValues] = useState(values);
  const [isLoading, setIsLoading] = useState(false);
  const [topNeighborhoods, setTopNeighborhoods] = useState<Neighborhood[] | null>(null);
  const [recalculated, setRecalculated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Combine conditions for mobile portrait and landscape
  const isMobile = useMediaQuery('(max-width:1000px) and (orientation: portrait), (min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isDesktop = useMediaQuery('(min-width: 1001px)'); // Use this to determine if the device is a desktop

  // Create an instance of VisibilityState
  const visibilityState = new VisibilityState({ webMap });

  const handleSliderChange = (name: string) => (event: Event, value: number | number[]) => {
    setValues({
      ...values,
      [name]: value as number,
    });
  };

  const handleRecalculateButton = async () => {
    setIsLoading(true);
    setTopNeighborhoods(null); // Clear out old neighborhoods
    setPreviousValues(values);

    try {
      // Call handleRecalculate with updated slider values and visibilityState instance
      const recalculatedNeighborhoods = await handleRecalculate(view, webMap, values, isDesktop, visibilityState);

      if (recalculatedNeighborhoods && recalculatedNeighborhoods.length > 0) {
        setTopNeighborhoods(recalculatedNeighborhoods);
        setRecalculated(true);
      }

      setIsLoading(false);
      triggerRecalculate(); // Trigger recalculation of widgets
    } catch (error) {
      console.error('Error during recalculation:', error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setValues(previousValues);
    setIsLoading(false);
    setTopNeighborhoods(null);
    setRecalculated(false);
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

          {/* Conditional Rendering for Loading and Top Neighborhoods */}
          {isLoading ? (
            <Box className="loading-container">
              <div className="loading-circle">Loading...</div>
            </Box>
          ) : topNeighborhoods ? (
            <TopNeighborhoods neighborhoods={topNeighborhoods} view={view} webMap={webMap} showTextList={true} />
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
            <Button
              onClick={handleReset}
              className="slider-reset-button"
            >
              Reset
            </Button>
          ) : (
            <Button
              onClick={handleRecalculateButton}
              className="slider-recalculate-button"
            >
              Recalculate Walkscore
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default SliderWidget;







