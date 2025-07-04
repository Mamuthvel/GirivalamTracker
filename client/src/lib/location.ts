interface LocationCallbacks {
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void;
  onError: (error: string) => void;
}

let watchId: number | null = null;

export function startLocationTracking(memberId: number, callbacks: LocationCallbacks) {
  if (!navigator.geolocation) {
    callbacks.onError('Geolocation is not supported by this browser');
    return;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000, // 30 seconds
  };

  const success = (position: GeolocationPosition) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    callbacks.onLocationUpdate(location);

    // Update location on server
    fetch(`/api/members/${memberId}/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(location),
    }).catch(error => {
      console.error('Failed to update location:', error);
    });
  };

  const error = (err: GeolocationPositionError) => {
    let message = 'Unknown location error';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location access denied. Please enable location permissions to share your location with the group.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable. Please check your device settings.';
        break;
      case err.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
    }
    
    callbacks.onError(message);
  };

  // Start watching position
  watchId = navigator.geolocation.watchPosition(success, error, options);

  // Also get initial position
  navigator.geolocation.getCurrentPosition(success, error, options);

  return watchId;
}

export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
