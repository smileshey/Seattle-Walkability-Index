import React, { useState } from 'react';
import { Box, Slider, Typography, Button } from '@mui/material';
import { handleRecalculate } from './walkscore_calculator';
import { Neighborhood } from './neighborhood_utils';

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

const MobileSliderWidget = ({ view, webMap, triggerRecalculate }: { view: __esri.MapView; webMap: __esri.WebMap; triggerRecalculate: () => void }) => {
  const [values, setValues] = useState({
    slope: 2,
    sidewalk: 2,
    amenity: 2,
    canopy: 2,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSliderChange = (name: string) => (event: Event, value: number | number[]) => {
    setValues({
      ...values,
      [name]: value as number,
    });
  };

  const handleRecalculateButton = async () => {
    setIsLoading(true);
    await handleRecalculate(view, webMap, values);
    setIsLoading(false);
    triggerRecalculate();
  };

  return (
    <Box
      sx={{
        width: '100%',
        padding: '10px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 3,
        boxShadow: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ width: '100%', textAlign: 'center', fontWeight: 'italic' }}>
          Flat Ground
        </Typography>
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
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ width: '100%', textAlign: 'center', fontWeight: 'italic' }}>
          Calm Traffic
        </Typography>
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
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ width: '100%', textAlign: 'center', fontWeight: 'italic' }}>
          Business Density
        </Typography>
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
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ width: '100%', textAlign: 'center', fontWeight: 'italic' }}>
          Canopy Coverage
        </Typography>
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
        />
      </Box>

      <Button onClick={handleRecalculateButton} color="primary" sx={{ fontSize: '0.75rem', width: '100%' }}>
        Recalculate Walkscore
      </Button>
    </Box>
  );
};

export default MobileSliderWidget;
