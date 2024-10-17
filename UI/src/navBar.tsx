import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// Custom styled container for the navbar
const NavBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '80%', // Default width for desktop and mobile landscape
  backgroundColor: 'rgba(255, 255, 255, 0.8)', // 40% transparency
  borderRadius: '0px 0px 10px 0px', // Rounded on top-left, top-right, and bottom-left
  padding: '10px',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'normal',
  alignItems: 'center',
  pointerEvents: 'auto',
}));

// Custom styled menu to be full-width of the NavBar
const FullWidthMenu = styled(Menu)<{ isMobilePortrait: boolean }>(({ isMobilePortrait }) => ({
  '.MuiPaper-root': {
    width: isMobilePortrait ? '60%' : '20%', // Wider dropdown for mobile portrait
    left: '0 !important',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '0 0 10px 10px',
    boxShadow: 'none', // Remove shadow from the dropdown menu
  },
}));

export default function BasicMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Media query for different view types
  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(max-width: 1000px) and (orientation: landscape)');
  const isDesktop = useMediaQuery('(min-width: 1000px)');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {/* Conditionally render based on screen size */}
      {(isDesktop || isMobilePortrait || isMobileLandscape) && (
        <NavBar
          sx={{
            width: isMobilePortrait ? '60%' : isMobileLandscape ? '40%' : '20%',
            justifyContent: isMobilePortrait ? 'normal' : 'normal', // Adjust alignment for mobile portrait
          }}
        >
          {/* Button for opening the menu (only the sandwich icon) */}
          <Button
            id="basic-button"
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            sx={{ color: 'black' }}
          >
            <MenuIcon />
          </Button>

          {/* Title in the center of the navbar */}
          <div
            style={{
              color: 'black',
              fontWeight: 'bold',
              fontSize: isMobilePortrait ? '14px' : '18px', // Smaller text in mobile portrait
              marginLeft: isMobilePortrait ? '0px' : '1px', // Adjust margin for mobile portrait
              flexGrow: isMobilePortrait ? 1 : 'unset', // Let the text grow in mobile portrait
              textAlign: isMobilePortrait ? 'left' : 'left', // Align text in mobile portrait
            }}
          >
            Walkability in Seattle
          </div>

          {/* Full-width Dropdown Menu */}
          {(!isMobilePortrait || open) && (
            <FullWidthMenu
              isMobilePortrait={isMobilePortrait} // Pass the portrait flag
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                style: {
                  marginTop: '9.5px',
                },
              }}
            >
              <MenuItem
                onClick={() =>
                  window.open(
                    'https://github.com/smileshey/Seattle-Walkability-Index?tab=readme-ov-file#how-it-works',
                    '_blank'
                  )
                }
              >
                How it works
              </MenuItem>
              <MenuItem
                onClick={() =>
                  window.open('https://seattlecitygis.maps.arcgis.com/home/index.html', '_blank')
                }
              >
                Data Source
              </MenuItem>
              <MenuItem
                onClick={() =>
                  window.open('https://https://github.com/smileshey/Seattle-Walkability-Index.com', '_blank')
                }
              >
                GitHub
              </MenuItem>
            </FullWidthMenu>
          )}
        </NavBar>
      )}
    </>
  );
}














