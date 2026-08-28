import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraDirection,
  CameraSource,
  EncodingType,
} from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function isAndroidApp() {
  return isNativeApp() && Capacitor.getPlatform() === 'android';
}

export function supportsDeviceGeolocation() {
  return isNativeApp() || Boolean(globalThis.navigator?.geolocation);
}

async function requireNativeLocationPermission() {
  const status = await Geolocation.requestPermissions({
    permissions: ['location'],
  });
  if (status.location !== 'granted') {
    throw new Error('location-permission-denied');
  }
}

export async function getCurrentDevicePosition(options = {}) {
  if (isNativeApp()) {
    await requireNativeLocationPermission();
    return Geolocation.getCurrentPosition(options);
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation-unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export async function startDeviceLocationWatch(
  options,
  onPosition,
  onError
) {
  if (isNativeApp()) {
    await requireNativeLocationPermission();
    const id = await Geolocation.watchPosition(options, (position, error) => {
      if (error || !position) {
        onError(error);
      } else {
        onPosition(position);
      }
    });
    return { platform: 'native', id };
  }

  if (!navigator.geolocation) throw new Error('geolocation-unavailable');
  const id = navigator.geolocation.watchPosition(onPosition, onError, options);
  return { platform: 'web', id };
}

export async function clearDeviceLocationWatch(handle) {
  if (!handle) return;
  if (handle.platform === 'native') {
    await Geolocation.clearWatch({ id: handle.id });
  } else {
    navigator.geolocation?.clearWatch(handle.id);
  }
}

export async function captureTemporaryVerificationPhoto() {
  if (!isNativeApp()) return null;

  const permission = await Camera.requestPermissions({
    permissions: ['camera'],
  });
  if (permission.camera !== 'granted') {
    throw new Error('camera-permission-denied');
  }

  const photo = await Camera.takePhoto({
    quality: 35,
    targetWidth: 480,
    targetHeight: 480,
    correctOrientation: true,
    encodingType: EncodingType.JPEG,
    saveToGallery: false,
    source: CameraSource.Camera,
    cameraDirection: CameraDirection.Rear,
    editable: 'no',
    includeMetadata: false,
  });

  return {
    async discard() {
      if (!photo.uri) return;
      try {
        await Filesystem.deleteFile({ path: photo.uri });
      } catch {
        // Camera files live in temporary app cache. Some Android camera
        // providers expose content URIs that cannot be deleted directly;
        // those remain OS-managed temporary cache and are never uploaded.
      }
    },
  };
}
