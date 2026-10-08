import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface UserLocationData {
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  displayCity: string;
  displayDistrict: string;
  displayLocation: string;
  isLive: boolean;
}

interface LocationContextType {
  location: UserLocationData;
  isLoading: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  errorMsg: string | null;
  requestLocation: (showAlert?: boolean) => Promise<boolean>;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
}

const DEFAULT_LOCATION: UserLocationData = {
  city: 'Chopda',
  district: 'Jalgaon',
  state: 'Maharashtra',
  country: 'India',
  postalCode: '425107',
  latitude: 21.2483,
  longitude: 75.3023,
  displayCity: 'Chopda',
  displayDistrict: 'Jalgaon',
  displayLocation: 'Chopda, Jalgaon',
  isLive: false,
};

const LocationContext = createContext<LocationContextType>({
  location: DEFAULT_LOCATION,
  isLoading: false,
  permissionStatus: 'undetermined',
  errorMsg: null,
  requestLocation: async () => false,
  showLocationModal: false,
  setShowLocationModal: () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<UserLocationData>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  const fetchCurrentLocation = useCallback(async (showAlert: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Request Foreground Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        const msg = 'Location permission is required to detect your farm area and local weather.';
        setErrorMsg(msg);
        setIsLoading(false);
        if (showAlert) {
          Alert.alert(
            'Location Access Needed',
            msg + ' Using default location: Chopda, Jalgaon.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }

      // 2. Get Current Position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;

      // 3. Reverse Geocode to obtain human-readable Address
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocoded && geocoded.length > 0) {
        const address = geocoded[0];
        const detectedCity = address.city || address.subregion || address.district || address.name || 'Chopda';
        const detectedDistrict = address.district || address.subregion || address.region || 'Jalgaon';
        const detectedState = address.region || 'Maharashtra';
        const detectedCountry = address.country || 'India';
        const detectedPostal = address.postalCode || '425107';

        const updated: UserLocationData = {
          city: detectedCity,
          district: detectedDistrict,
          state: detectedState,
          country: detectedCountry,
          postalCode: detectedPostal,
          latitude,
          longitude,
          displayCity: detectedCity,
          displayDistrict: detectedDistrict,
          displayLocation: `${detectedCity}, ${detectedDistrict}`,
          isLive: true,
        };

        setLocation(updated);
        setIsLoading(false);

        if (showAlert) {
          Alert.alert(
            'Location Updated',
            `Detected Location: ${detectedCity}, ${detectedDistrict} (${detectedState})`,
            [{ text: 'Great!' }]
          );
        }
        return true;
      } else {
        // Fallback with coordinates
        setLocation((prev) => ({
          ...prev,
          latitude,
          longitude,
          isLive: true,
        }));
        setIsLoading(false);
        return true;
      }
    } catch (err: any) {
      console.warn('Error fetching location:', err);
      const msg = err?.message || 'Could not fetch current location';
      setErrorMsg(msg);
      setIsLoading(false);
      if (showAlert) {
        Alert.alert(
          'Location Detection',
          'Could not retrieve live GPS location. Using default location: Chopda, Jalgaon.',
          [{ text: 'OK' }]
        );
      }
      return false;
    }
  }, []);

  // Request location automatically once on startup
  useEffect(() => {
    fetchCurrentLocation(false);
  }, [fetchCurrentLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        permissionStatus,
        errorMsg,
        requestLocation: fetchCurrentLocation,
        showLocationModal,
        setShowLocationModal,
      }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => useContext(LocationContext);
