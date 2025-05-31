import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      for (const shortcut of shortcuts) {
        const { key: shortcutKey, ctrl: needsCtrl, shift: needsShift, alt: needsAlt, action } = shortcut;
        
        if (
          key === shortcutKey.toLowerCase() &&
          ctrl === !!needsCtrl &&
          shift === !!needsShift &&
          alt === !!needsAlt
        ) {
          event.preventDefault();
          action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
