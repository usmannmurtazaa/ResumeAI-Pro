import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | ResumeAi Pro`;
  }, [title]);
};

export default useDocumentTitle;