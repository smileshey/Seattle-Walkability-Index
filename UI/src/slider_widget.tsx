import React, { useState } from 'react';
import { Box, Slider, Typography, Tooltip, IconButton, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { handleRecalculate } from './walkscore_calculator';
import TopNeighborhoods from './top_neighborhoods';
import { Neighborhood, getTopNeighborhoods } from './neighborhood_utils';

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

const SliderWidget = ({ view, webMap, triggerRecalculate }: { view: __esri.MapView; webMap: __esri.WebMap; triggerRecalculate: () => void }) => {
  const [values, setValues] = useState({
    slope: 2,
    sidewalk: 2,
    amenity: 2,
    canopy: 2,  // Add a new state for canopy
  });
  const [previousValues, setPreviousValues] = useState(values); // Store previous values
  const [isLoading, setIsLoading] = useState(false);
  const [topNeighborhoods, setTopNeighborhoods] = useState<Neighborhood[] | null>(null);
  const [recalculated, setRecalculated] = useState(false); // Track whether recalculation is triggered

  const handleSliderChange = (name: string) => (event: Event, value: number | number[]) => {
    setValues({
      ...values,
      [name]: value as number,
    });
  };

  const handleRecalculateButton = async () => {
    setIsLoading(true);
    setTopNeighborhoods(null);

    // Store the current values as previous values before recalculating
    setPreviousValues(values);

    const topNeighborhoods = await handleRecalculate(view, webMap, values);
  
    if (topNeighborhoods && topNeighborhoods.length > 0) {
      setTopNeighborhoods(topNeighborhoods);
    }
  
    setIsLoading(false);
    setRecalculated(true);
    triggerRecalculate();
  };

  const handleReset = () => {
    setValues(previousValues);  // Reset to the previous values
    setIsLoading(false);       // Ensure the loading circle is not shown
    setTopNeighborhoods(null); // Clear the top neighborhoods to show sliders again
    setRecalculated(false);    // Reset recalculation state to show sliders and original header
  };

  return (
    <Box
      sx={{
        width: 280,  // Increase the width of the container to fit the labels on one line
        padding: 1,
        background: 'white',
        borderRadius: 3,
        boxShadow: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.1,
      }}
    >
      {/* Conditional Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {recalculated ? (
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
            Your Most Walkable Neighborhoods
          </Typography>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              What's Most Important to You?
            </Typography>
            <Tooltip title="Adjust the sliders to change the walkscore displayed on the map. The more important a feature is, the more heavily the algorithm will weigh that feature" arrow>
              <IconButton size="small" sx={{ padding: 0 }}>
                <InfoIcon sx={{ fontSize: '.9rem' }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      <Box sx={{ borderBottom: '1px solid #ddd', marginBottom: 1, width: '100%' }}></Box>

      {/* Conditional Rendering for Loading and Top Neighborhoods */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
          <div className="loading-circle">Loading...</div>
        </Box>
      ) : topNeighborhoods ? (
        <TopNeighborhoods neighborhoods={topNeighborhoods} view={view} webMap={webMap} />
      ) : (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: .5 }}>
            <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic' }}>Flat Ground</Typography>
            <Slider
              size="small"
              value={values.slope}
              onChange={handleSliderChange('slope')}
              aria-labelledby="slope-slider"
              min={0}
              max={4}
              step={1}
              marks={marks}
              valueLabelDisplay="auto"
              valueLabelFormat={valueLabelFormat}
              sx={{ width: '150px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: .5 }}>
            <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic' }}>Calm Traffic</Typography>
            <Slider
              size="small"
              value={values.sidewalk}
              onChange={handleSliderChange('sidewalk')}
              aria-labelledby="sidewalk-slider"
              min={0}
              max={4}
              step={1}
              marks={marks}
              valueLabelDisplay="auto"
              valueLabelFormat={valueLabelFormat}
              sx={{ width: '150px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: .5 }}>
            <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic' }}>Business Density</Typography>
            <Slider
              size="small"
              value={values.amenity}
              onChange={handleSliderChange('amenity')}
              aria-labelledby="amenity-slider"
              min={0}
              max={4}
              step={1}
              marks={marks}
              valueLabelDisplay="auto"
              valueLabelFormat={valueLabelFormat}
              sx={{ width: '150px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: .5 }}>
            <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic' }}>Canopy Coverage</Typography> 
            <Slider
              size="small"
              value={values.canopy}
              onChange={handleSliderChange('canopy')}
              aria-labelledby="canopy-slider"
              min={0}
              max={4}
              step={1}
              marks={marks}
              valueLabelDisplay="auto"
              valueLabelFormat={valueLabelFormat}
              sx={{ width: '150px' }}
            />
          </Box>
        </Box>
      )}

      <Box sx={{ borderBottom: '1px solid #ddd', margin: '1px 0', width: '100%' }}></Box> {/* Bolded line */}

      {/* Conditional Button or Summary Display */}
      {recalculated ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '8px', gap: '8px' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Slope: {values.slope}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Calm: {values.sidewalk}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Business: {values.amenity}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Canopy: {values.canopy} {/* Display the canopy value */}
            </Typography>
          </Box>
          <Button
            onClick={handleReset}
            color="secondary"
            sx={{
              fontSize: '0.75rem',
              backgroundColor: '#f50057',
              color: 'white',
              '&:hover': {
                backgroundColor: '#c51162',
              },
              width: '100%',
            }}
            variant="contained"
          >
            Reset
          </Button>
        </>
      ) : (
        <Button onClick={handleRecalculateButton} color="primary" sx={{ fontSize: '0.65rem', width: '100%' }}>
          Recalculate Walkscore
        </Button>
      )}
    </Box>
  );
};

export default SliderWidget;






























