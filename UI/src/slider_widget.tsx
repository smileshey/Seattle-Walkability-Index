import React, { useState } from 'react';
import { Box, Slider, Typography, Tooltip, IconButton, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Icons for expand/collapse
import { handleRecalculate } from './walkscore_calculator';
import TopNeighborhoods from './top_neighborhoods';
import { Neighborhood } from './neighborhood_utils';
import { useMediaQuery } from '@mui/material'; // Import useMediaQuery
import axios from 'axios';


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
    streets: 2, // Changed from sidewalk to streets
    amenity: 2,
    crime: 2,
  });
  const [previousValues, setPreviousValues] = useState(values);
  const [isLoading, setIsLoading] = useState(false);
  const [topNeighborhoods, setTopNeighborhoods] = useState<Neighborhood[] | null>(null);
  const [recalculated, setRecalculated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // State to track expand/collapse

  // Combine conditions for mobile portrait and landscape
  const isMobile = useMediaQuery('(max-width:1000px) and (orientation: portrait), (min-width: 600px) and (max-width: 1000px) and (orientation: landscape)');
  const isTabletPortrait = useMediaQuery('(min-width:601px) and (max-width:900px) and (orientation: portrait)');

  const handleSliderChange = (name: string) => (event: Event, value: number | number[]) => {
    setValues({
      ...values,
      [name]: value as number,
    });
  };

  const handleRecalculateButton = async () => {
    setIsLoading(true);
    setTopNeighborhoods(null);
    setPreviousValues(values);
  
    try {
      // Send a POST request to the server to log button click
      await axios.post('/recalculate', {
        values,
      });
  
      const topNeighborhoods = await handleRecalculate(view, webMap, values);
  
      if (topNeighborhoods && topNeighborhoods.length > 0) {
        setTopNeighborhoods(topNeighborhoods);
      }
      setIsLoading(false);
      setRecalculated(true);
      triggerRecalculate();
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
    setIsExpanded(!isExpanded); // Toggle between expanded and collapsed
  };

  return (
    <Box
      sx={{
        width: isMobile ? '110%' : '125%', // Set the width for mobile modes (portrait and landscape)
        padding: isMobile ? 0.6 : 1, // Apply similar padding for mobile modes
        background: 'white',
        borderRadius: 3,
        boxShadow: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 0.1 : 0.1, // Adjust gap between sliders for mobile modes
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.7rem' : '0.9rem' }}>
          {recalculated ? 'Your Most Walkable Neighborhoods' : "What's Most Important to You?"}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip
            title="Adjust the sliders to change the walkscore displayed on the map. The more important a feature is, the more heavily the algorithm will weigh that feature"
            arrow
          >
            <IconButton size="small" sx={{ padding: 0 }}>
              <InfoIcon sx={{ fontSize: isMobile ? '0.7rem' : '.9rem' }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={toggleExpand}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Only show content when expanded */}
      {isExpanded && (
        <>
          <Box sx={{ borderBottom: '1px solid #ddd', marginBottom: isMobile ? 0.2 : 1, width: '100%' }}></Box>

          {/* Conditional Rendering for Loading and Top Neighborhoods */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
              <div className="loading-circle">Loading...</div>
            </Box>
          ) : topNeighborhoods ? (
            <TopNeighborhoods neighborhoods={topNeighborhoods} view={view} webMap={webMap} />
          ) : (
            <Box>
              {/* Adjust spacing and font size for mobile */}
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? 0.2 : 0.5 }}>
                <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
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
                  sx={{ width: isMobile ? '120px' : '150px' }} // Adjust slider width for mobile modes
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? 0.2 : 0.5 }}>
                <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                  Calm Streets
                </Typography>
                <Slider
                  size="small"
                  value={values.streets} 
                  onChange={handleSliderChange('streets')}
                  aria-labelledby="streets-slider"
                  min={0}
                  max={4}
                  step={1}
                  marks={marks}
                  valueLabelDisplay="auto"
                  valueLabelFormat={valueLabelFormat}
                  sx={{ width: isMobile ? '120px' : '150px' }} // Adjust slider width for mobile modes
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? 0.2 : 0.5 }}>
                <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
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
                  sx={{ width: isMobile ? '120px' : '150px' }} // Adjust slider width for mobile modes
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? 0.2 : 0.5 }}>
                <Typography variant="caption" sx={{ width: '110px', textAlign: 'center', marginRight: '8px', fontWeight: 'italic', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                  Crime Density
                </Typography>
                <Slider
                  size="small"
                  value={values.crime}
                  onChange={handleSliderChange('crime')}
                  aria-labelledby="crime-slider"
                  min={0}
                  max={4}
                  step={1}
                  marks={marks}
                  valueLabelDisplay="auto"
                  valueLabelFormat={valueLabelFormat}
                  sx={{ width: isMobile ? '120px' : '150px' }} // Adjust slider width for mobile modes
                />
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Recalculate or Reset Button */}
      {isExpanded && (
        <>
          <Box sx={{ borderBottom: '1px solid #ddd', margin: '1px 0', width: '100%' }}></Box>
          {recalculated ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '2px', gap: '8px' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'normal',
                    fontSize: isMobile ? '0.6rem' : '0.75rem', // Adjust font size for mobile modes
                  }}
                >
                  Slope: {values.slope}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'normal',
                    fontSize: isMobile ? '0.6rem' : '0.75rem', // Adjust font size for mobile modes
                  }}
                >
                  Streets: {values.streets} {/* Changed from Calm to Streets */}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'normal',
                    fontSize: isMobile ? '0.6rem' : '0.75rem', // Adjust font size for mobile modes
                  }}
                >
                  Business: {values.amenity}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'normal',
                    fontSize: isMobile ? '0.6rem' : '0.75rem', // Adjust font size for mobile modes
                  }}
                >
                  Crime: {values.crime}
                </Typography>
              </Box>

              <Button
                onClick={handleReset}
                color="secondary"
                sx={{
                  fontSize: isMobile ? '0.6rem' : '0.75rem', // Smaller font size for mobile modes
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
            <Button
              onClick={handleRecalculateButton}
              color="primary"
              sx={{
                fontSize: isMobile ? '0.55rem' : '0.65rem', // Smaller font size for mobile modes
                width: '100%',
              }}
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

































