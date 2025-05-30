import type en from './en';

export default {
  'drag-and-drop': {
    extensions: '{{extensions}} bis zu {{maxFileSize}}',
    heading: 'Ziehe Dateien hierher oder <1>wähle Dateien</1> aus',
  },
  dropzone: {
    'empty-state': {
      'drag-drop_one':
        'Datei hierher ziehen oder <1>Datei auswählen</1>, um sie hochzuladen',
      'drag-drop_other':
        'Dateien hierher ziehen oder <1>Dateien auswählen</1>, um sie hochzuladen',
      'max-size': 'Maximale Dateigröße: {{size}}',
      title_one: 'Datei hochladen',
      title_other: '{{count}} Dateien hochladen',
    },
    'file-status': {
      'file-size': '{{size}}',
      'file-too-large':
        'Datei ist größer als {{maxSize}} (Größe: {{currentSize}})',
      'remove-file': 'Datei entfernen',
      'upload-failed': 'Hochladen fehlgeschlagen: {{message}}',
      'upload-success': 'Datei erfolgreich hochgeladen',
      uploading: 'Datei wird hochgeladen...',
    },
    'max-files-error': {
      message_one:
        'Du kannst nur bis zu {{maxFiles}} Dateien hochladen, bitte entferne {{overflow}} Datei.',
      message_other:
        'Du kannst nur bis zu {{maxFiles}} Dateien hochladen, bitte entferne {{overflow}} Dateien.',
    },
    'upload-button': {
      upload: 'Dateien hochladen',
      uploading: 'Wird hochgeladen...',
    },
    'upload-success': {
      message_one: '{{count}} Datei erfolgreich hochgeladen',
      message_other: '{{count}} Dateien erfolgreich hochgeladen',
    },
  },
} satisfies typeof en;
