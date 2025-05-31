import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { useFavorites } from '../../hooks/useFavorites';

const FavoriteButton = ({ 
  item, 
  size = 'medium',
  color = 'warning',
  showTooltip = true,
  onClick 
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isItemFavorite = isFavorite(item._id);

  const handleClick = (e) => {
    e.stopPropagation(); // Evitar que clique no card
    const result = toggleFavorite(item);
    onClick?.(result);
  };

  const button = (
    <IconButton
      onClick={handleClick}
      size={size}
      sx={{
        color: isItemFavorite ? `${color}.main` : 'text.secondary',
        transition: 'all 0.2s ease',
        '&:hover': {
          color: `${color}.main`,
          transform: 'scale(1.1)',
        },
      }}
    >
      {isItemFavorite ? <Star /> : <StarBorder />}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={isItemFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default FavoriteButton;
