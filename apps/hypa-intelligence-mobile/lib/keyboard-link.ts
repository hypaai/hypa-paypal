import * as Linking from 'expo-linking';

const SCHEME = 'hypaintelligence://';

/** The keyboard stamps each camera tap with the time. Kept here so the old screens the app restores can't replay one. */
const handledCameras = new Set<string>();

export function isOldCamera(camera: string) {
  return handledCameras.has(camera);
}

/** True once per camera tap. */
export function claimCamera(camera: string) {
  if (handledCameras.has(camera)) return false;
  handledCameras.add(camera);
  return true;
}

/** The last launch link acted on: the one that started this JS runtime, then any that arrived or were followed. */
let lastLink: string | null = null;
const started = Linking.getInitialURL().then((url) => {
  lastLink = url;
});
// A link that arrives while the app is open is handled by the router.
Linking.addEventListener('url', ({ url }) => {
  lastLink = url;
});

/**
 * The keyboard keeps the app's JS alive after its screen is closed. Reopening the app then rebuilds the
 * old screens and can miss the link that reopened it, because Android may answer the router too late.
 * Returns where that link leads, once: null when there is none or it was already acted on, for example
 * when Android rebuilds the screen from the same launch link. Sign-in links are left to the auth screen.
 */
export async function launchLinkPath(): Promise<string | null> {
  await started;
  const url = await Linking.getInitialURL();
  if (!url || url === lastLink) return null;
  lastLink = url;
  if (!url.startsWith(SCHEME) || url.startsWith(`${SCHEME}auth`)) return null;
  const camera = url.match(/[?&]camera=([^&#]+)/)?.[1];
  if (camera && isOldCamera(camera)) return null;
  return url.replace(/^hypaintelligence:\/\/\/?/, '/');
}
