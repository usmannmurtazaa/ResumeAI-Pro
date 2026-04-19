// src/hooks/useDocumentTitle.js
import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | ResumeAI Pro`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle;