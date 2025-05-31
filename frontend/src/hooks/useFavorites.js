import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('kpcloud_favorites') || '[]');
    setFavorites(savedFavorites);
  }, []);

  // Salvar favoritos no localStorage
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    localStorage.setItem('kpcloud_favorites', JSON.stringify(newFavorites));
  };

  // Verificar se um item é favorito
  const isFavorite = (itemId) => {
    return favorites.some(fav => fav.id === itemId);
  };

  // Adicionar aos favoritos
  const addToFavorites = (item) => {
    if (!isFavorite(item._id)) {
      const favoriteItem = {
        id: item._id,
        name: item.originalName || item.name,
        type: item.originalName ? 'file' : 'folder',
        mimetype: item.mimetype,
        size: item.size,
        createdAt: item.createdAt,
        addedToFavoritesAt: new Date().toISOString(),
        owner: item.owner
      };
      
      const newFavorites = [...favorites, favoriteItem];
      saveFavorites(newFavorites);
      toast.success('Adicionado aos favoritos!');
      return true;
    }
    return false;
  };

  // Remover dos favoritos
  const removeFromFavorites = (itemId) => {
    const newFavorites = favorites.filter(fav => fav.id !== itemId);
    saveFavorites(newFavorites);
    toast.success('Removido dos favoritos!');
  };

  // Toggle favorito
  const toggleFavorite = (item) => {
    if (isFavorite(item._id)) {
      removeFromFavorites(item._id);
      return false;
    } else {
      return addToFavorites(item);
    }
  };

  // Limpar todos os favoritos
  const clearFavorites = () => {
    saveFavorites([]);
    toast.success('Favoritos limpos!');
  };

  return {
    favorites,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearFavorites
  };
};
