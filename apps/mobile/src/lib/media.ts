import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

type Aspect = readonly [number, number];

/** Picks a single photo; returns null when the user cancels or denies access. */
export async function pickImage(aspect: Aspect = [1, 1]): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [...aspect],
    quality: 0.85,
  });

  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/**
 * Copies the picked file into the document directory and returns only the file
 * name: iOS rotates the container path on every install.
 */
export async function persistImage(uri: string, fileName: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }
  const source = new File(uri);
  const target = new File(Paths.document, fileName);
  await source.copy(target, { overwrite: true });
  return fileName;
}

/** Resolves a stored file name back to a displayable uri. */
export function mediaUri(fileName: string | null): string | null {
  if (fileName === null || fileName === '') {
    return null;
  }
  if (fileName.includes('://') || fileName.startsWith('data:')) {
    return fileName;
  }
  if (Platform.OS === 'web') {
    return null;
  }
  return new File(Paths.document, fileName).uri;
}
