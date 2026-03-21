import { useEffect, useState } from 'react'

/**
 * Hook to handle haptic feedback on mobile devices.
 * Stubs for Capacitor plugins are used here as insurance.
 */
export const useHaptics = () => {
    // Check if running on Capacitor (Native) or Web
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Capacitor) {
            setIsNative(true);
        }
    }, []);

    const lightTap = async () => {
        if (isNative && window.Capacitor.Plugins.Haptics) {
            await window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
        }
    };

    const mediumTap = async () => {
        if (isNative && window.Capacitor.Plugins.Haptics) {
            await window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' });
        }
    };

    const successFeedback = async () => {
        if (isNative && window.Capacitor.Plugins.Haptics) {
            await window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' });
        }
    };

    const errorFeedback = async () => {
        if (isNative && window.Capacitor.Plugins.Haptics) {
            await window.Capacitor.Plugins.Haptics.notification({ type: 'ERROR' });
        }
    };

    return { lightTap, mediumTap, successFeedback, errorFeedback, isNative };
};
