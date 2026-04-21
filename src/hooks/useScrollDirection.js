import { useState, useEffect } from 'react';

/**
 * Custom hook to detect scroll direction
 * @param {number} threshold - Minimum scroll amount to trigger direction change
 * @returns {string} 'up', 'down', or null
 */
export const useScrollDirection = (threshold = 10) => {
  const [scrollDirection, setScrollDirection] = useState(null);
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (Math.abs(currentScrollY - prevScrollY) < threshold) {
        return;
      }

      const direction = currentScrollY > prevScrollY ? 'down' : 'up';
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY, scrollDirection, threshold]);

  return scrollDirection;
};

export default useScrollDirection;