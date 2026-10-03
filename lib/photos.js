// Evidence photos: take with the camera, upload to Storage, return the path.
// Paths match storage.rules: collections/{agreementId}/… and problems/{problemId}/…
import { getDownloadURL, putFile, ref } from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../firebase';

// Resolves to a local file uri, or null if cancelled / permission refused.
export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.6 });
  return result.canceled ? null : result.assets[0].uri;
}

// Uploads a local uri. Returns the Storage path to keep in Firestore.
export async function uploadPhoto(folder, localUri) {
  const path = `${folder}/${Date.now()}.jpg`;
  await putFile(ref(storage, path), localUri, { contentType: 'image/jpeg' });
  return path;
}

export function photoUrl(path) {
  return getDownloadURL(ref(storage, path));
}
