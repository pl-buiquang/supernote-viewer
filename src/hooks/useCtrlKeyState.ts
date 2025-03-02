import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks whether the Ctrl key (or Command key on Mac) is currently pressed
 * @returns boolean indicating if Ctrl/Command key is pressed
 */
const useCtrlKeyState = (): boolean => {
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl key on Windows/Linux or Command key on Mac
      if (event.ctrlKey || event.metaKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // If the released key is Ctrl or Command, set state to false
      if (event.key === 'Control' || event.key === 'Meta') {
        setIsCtrlPressed(false);
      }
    };

    // Add event listeners when component mounts
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array since we don't need to re-run the effect

  return isCtrlPressed;
};

export default useCtrlKeyState;
