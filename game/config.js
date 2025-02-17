import appJson from './app.json';
import { API_URL } from '@env'

export const appVersion = appJson.expo.version;
export const apiUrl = API_URL || '';