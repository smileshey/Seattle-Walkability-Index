import React, { useState } from 'react';
import { Box, Slider, Typography, Tooltip, IconButton, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { handleRecalculate } from './walkscore_calculator';
import TopNeighborhoods from './top_neighborhoods';
import { Neighborhood } from './neighborhood_utils';
import { useMediaQuery } from '@mui/material';

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
      // Updated call to handleRecalculate with all arguments
      const recalculatedNeighborhoods = await handleRecalculate(view, webMap, values, isDesktop);

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
    <Box
      sx={{
        width: isMobile ? '110%' : '125%',
        padding: isMobile ? 0.6 : 1,
        background: 'white',
        borderRadius: 3,
        boxShadow: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 0.1 : 0.1,
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
            {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>

      {isExpanded && (
        <>
          <Box sx={{ borderBottom: '1px solid #ddd', marginBottom: isMobile ? 0.2 : 1, width: '100%' }}></Box>

          {/* Conditional Rendering for Loading and Top Neighborhoods */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
              <div className="loading-circle">Loading...</div>
            </Box>
          ) : topNeighborhoods ? (
            <TopNeighborhoods neighborhoods={topNeighborhoods} view={view} webMap={webMap} showTextList={true} />
          ) : (
            <Box>
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
                  sx={{ width: isMobile ? '120px' : '150px' }}
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
                  sx={{ width: isMobile ? '120px' : '150px' }}
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
                  sx={{ width: isMobile ? '120px' : '150px' }}
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
                  sx={{ width: isMobile ? '120px' : '150px' }}
                />
              </Box>
            </Box>
          )}
        </>
      )}

      {isExpanded && (
        <>
          <Box sx={{ borderBottom: '1px solid #ddd', margin: '1px 0', width: '100%' }}></Box>
          {recalculated ? (
            <>
              <Button
                onClick={handleReset}
                color="secondary"
                sx={{
                  fontSize: isMobile ? '0.6rem' : '0.75rem',
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
                fontSize: isMobile ? '0.55rem' : '0.65rem',
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




