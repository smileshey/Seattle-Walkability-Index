import * as React from 'react';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import { useMediaQuery } from '@mui/material';
import '../dist/styles/navBar.css';

export default function BasicMenu() {
  // Media query for different view types
  const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
  const isMobileLandscape = useMediaQuery('(max-height: 600px) and (orientation: landscape)');
  const isDesktop = useMediaQuery('(min-width: 601px) and (min-height: 601px)');

  return (
    <>
      {/* Conditionally render NavBar based on orientation */}
      {(isDesktop || isMobilePortrait || isMobileLandscape) && (
        <Box
          className={`navbar-container ${
            isDesktop
              ? 'desktop'
              : isMobilePortrait
              ? 'mobile-portrait'
              : 'mobile-landscape'
          }`}
        >
          {/* Title in the center of the navbar */}
          <div
            className={`navbar-title ${
              isDesktop
                ? 'desktop'
                : isMobilePortrait
                ? 'mobile-portrait'
                : 'mobile-landscape'
            }`}
          >
            Walkability in Seattle
          </div>

          {/* Static Menu Items directly in the NavBar */}
          <Box className="navbar-links-container">
            <Button
              className={`navbar-link ${
                isDesktop
                  ? 'desktop'
                  : isMobilePortrait
                  ? 'mobile-portrait'
                  : 'mobile-landscape'
              }`}
              onClick={() =>
                window.open(
                  'https://github.com/smileshey/Seattle-Walkability-Index?tab=readme-ov-file#how-it-works',
                  '_blank'
                )
              }
            >
              How it works
            </Button>
            <Button
              className={`navbar-link ${
                isDesktop
                  ? 'desktop'
                  : isMobilePortrait
                  ? 'mobile-portrait'
                  : 'mobile-landscape'
              }`}
              onClick={() =>
                window.open(
                  'https://seattlecitygis.maps.arcgis.com/home/index.html',
                  '_blank'
                )
              }
            >
              Data
            </Button>
            <Button
              className={`navbar-link ${
                isDesktop
                  ? 'desktop'
                  : isMobilePortrait
                  ? 'mobile-portrait'
                  : 'mobile-landscape'
              }`}
              onClick={() => window.open('https://github.com/smileshey/', '_blank')}
            >
              GitHub
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
}



















