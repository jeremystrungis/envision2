import * as React from "react"
// [Tauri] Import the appWindow object to manage window events
import { appWindow } from '@tauri-apps/api/window';

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    let unlisten: (() => void) | undefined;

    const checkSize = async () => {
      try {
        const size = await appWindow.innerSize();
        setIsMobile(size.width < MOBILE_BREAKPOINT);
      } catch (error) {
        console.error("Failed to get window size:", error);
        // Fallback for non-Tauri environments during development
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }
    };

    // Set the initial size
    checkSize();

    // Listen for window resize events
    const listen = async () => {
      try {
        unlisten = await appWindow.on('resize', () => checkSize());
      } catch (error) {
         console.error("Failed to set up resize listener:", error);
      }
    };
    listen();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [])

  return !!isMobile
}
