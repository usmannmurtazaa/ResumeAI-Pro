import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiX } from 'react-icons/fi';

/**
 * SWUpdatePrompt
 *
 * Listens for the `sw-update-available` event dispatched by src/index.js
 * when a new Service Worker has finished installing. Shows a persistent
 * toast prompting the user to reload the page to pick up the new version.
 *
 * The new Service Worker calls skipWaiting() in its install handler, so
 * no SKIP_WAITING message is needed here - a simple page reload is enough.
 *
 * Note on animation: the toast body uses Framer Motion for its entrance
 * (fade + lift). Exit animation is intentionally skipped because
 * react-hot-toast removes the DOM node synchronously on dismiss, which
 * would cut any exit animation off mid-frame.
 */
const SWUpdatePrompt = () => {
  const toastIdRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleUpdateAvailable = () => {
      // Avoid stacking multiple toasts if the event fires more than once
      if (toastIdRef.current) return;

      toastIdRef.current = toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex items-center gap-3 rounded-xl border border-gray-200/60 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-800/95"
            role="status"
            aria-live="polite"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                New version available
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reload to get the latest updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  toastIdRef.current = null;
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <FiRefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  toastIdRef.current = null;
                }}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:focus:ring-offset-gray-800"
                aria-label="Dismiss update notification"
              >
                <FiX className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ),
        {
          duration: Infinity,
          position: 'bottom-center',
        }
      );
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, []);

  return null;
};

export default SWUpdatePrompt;
