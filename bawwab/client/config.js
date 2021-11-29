/* Global configuration */

export const publicData = '/storage/public';
export const privateData = '/storage/home';
export const autosaveInterval = 10*60*1000; /* ms */
/* Make sure to keep at least 1 hour of autosaves by adjusting secondly */;
export const autosaveKeep = {secondly: 6, hourly: 12, daily: 14};

/* Websocket endpoint for process manager */
export const processManagerUrl = new URL ('/api/process/notify', window.location.href);

