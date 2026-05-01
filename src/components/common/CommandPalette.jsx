// In your App or Layout component
import { useCommandPalette } from './CommandPalette';

function App() {
  const { isOpen, open, close, toggle } = useCommandPalette();

  return (
    <>
      <button onClick={toggle} className="...">
        <FiCommand className="w-4 h-4" />
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>
      
      <CommandPalette 
        isOpen={isOpen} 
        onClose={close} 
        onToggle={toggle} 
      />
    </>
  );
}