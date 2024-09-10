import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';

// Custom styled container for the navbar
const NavBar = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '80%',
  backgroundColor: 'rgba(255, 255, 255, 0.8)', // 40% transparency
  borderRadius: '10px',
  padding: '10px',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'normal', // Adjusted to space items evenly
  alignItems: 'center',
  pointerEvents: 'auto',
});

// Custom styled menu to be full-width of the NavBar
const FullWidthMenu = styled(Menu)({
  '.MuiPaper-root': {
    width: '25%', // Full width of the navbar
    left: '0 !important', // Align the dropdown with the left of the NavBar
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // White with slight transparency
    borderRadius: '0 0 10px 10px', // Rounded bottom corners
  },
});

export default function BasicMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <NavBar>
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
      <div style={{ color: 'black', fontWeight: 'bold', fontSize: '18px', marginLeft: '1px' }}>
        Walkability in Seattle
      </div>

      {/* Full-width Dropdown Menu */}
      <FullWidthMenu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'bottom', // Anchors the dropdown below the button
          horizontal: 'left', // Aligns with the left side of the button
        }}
        transformOrigin={{
          vertical: 'top', // Ensures the menu grows downwards from the top
          horizontal: 'left',
        }}
        PaperProps={{
          style: {
            marginTop: '10px', // Adds space between the navbar and the dropdown
          },
        }}
      >
        <MenuItem onClick={handleClose}>How it works</MenuItem>
        <MenuItem onClick={handleClose}>Data Source</MenuItem>
        <MenuItem onClick={() => window.open('https://github.com', '_blank')}>
          GitHub
        </MenuItem>
      </FullWidthMenu>
    </NavBar>
  );
}










