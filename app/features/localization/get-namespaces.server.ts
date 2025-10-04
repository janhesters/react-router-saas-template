import fs from 'node:fs';
import path from 'node:path';

/**
 * Dynamically discovers all available i18n namespaces by reading
 * translation files from the locales directory.
 *
 * @param language - The language code to scan (defaults to 'en')
 * @returns Array of namespace names
 */
export const getNamespaces = (language = 'en'): string[] => {
  const localesPath = path.resolve('./public/locales', language);

  try {
    return fs
      .readdirSync(localesPath)
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
  } catch (error) {
    console.error(`Failed to read namespaces from ${localesPath}:`, error);
    return ['common']; // Fallback to at least 'common'
  }
};
