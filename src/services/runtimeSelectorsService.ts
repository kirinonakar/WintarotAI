import type { ApiProvider } from '../types/app.js';
import { runtimeViewStateStore } from './runtimeViewStateStore.js';

export const getSelectedProvider = (): ApiProvider => {
    return runtimeViewStateStore.getSnapshot().apiSettings.provider;
};
