import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { getFarmerProfile } from '@/services/diaryStorage';
import { getCoordinatesForLocation } from '@/services/imdWeather';

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
  isRegisteredLocation?: boolean;
}

interface LocationContextType {
  location: UserLocationData;
  isLoading: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  errorMsg: string | null;
  requestLocation: (showAlert?: boolean) => Promise<boolean>;
  reloadFromProfile: () => Promise<void>;
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
  isRegisteredLocation: false,
};

const LocationContext = createContext<LocationContextType>({
  location: DEFAULT_LOCATION,
  isLoading: false,
  permissionStatus: 'undetermined',
  errorMsg: null,
  requestLocation: async () => false,
  reloadFromProfile: async () => {},
  showLocationModal: false,
  setShowLocationModal: () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<UserLocationData>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  // Load location registered in farmer profile during app registration
  const reloadFromProfile = useCallback(async () => {
    try {
      const profile = await getFarmerProfile();
      if (profile && (profile.district || profile.village)) {
        const rawCity = profile.village
          ? profile.village.split(',')[0].trim()
          : (profile.taluka || profile.district);
        const rawDistrict = profile.district || 'Jalgaon';
        const rawState = profile.state || 'Maharashtra';
        const coords = await getCoordinatesForLocation(rawCity, rawDistrict, rawState);

        const updated: UserLocationData = {
          city: rawCity,
          district: rawDistrict,
          state: rawState,
          country: 'India',
          postalCode: profile.pincode || '',
          latitude: coords.lat,
          longitude: coords.lon,
          displayCity: rawCity,
          displayDistrict: rawDistrict,
          displayLocation: `${rawCity}, ${rawDistrict}`,
          isLive: true,
          isRegisteredLocation: true,
        };

        setLocation(updated);
      }
    } catch (err) {
      console.warn('Could not load registered profile location:', err);
    }
  }, []);

  const fetchCurrentLocation = useCallback(async (showAlert: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Request Foreground Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        // Fallback gracefully to registered farm profile location
        await reloadFromProfile();
        setIsLoading(false);
        if (showAlert) {
          Alert.alert(
            'GPS Access Needed',
            'Using your registered farm location for weather & advisory.',
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
          isRegisteredLocation: false,
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
      await reloadFromProfile();
      setIsLoading(false);
      return false;
    }
  }, [reloadFromProfile]);

  // Initialize with location entered in application registration
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await reloadFromProfile();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [reloadFromProfile]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        permissionStatus,
        errorMsg,
        requestLocation: fetchCurrentLocation,
        reloadFromProfile,
        showLocationModal,
        setShowLocationModal,
      }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => useContext(LocationContext);
