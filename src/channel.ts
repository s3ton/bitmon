// GitHub Pages hosts both PWAs on one origin; isolate their local data by channel.
export const CHANNEL = /\/preview(?:\/|$)/.test(location.pathname) ? 'preview' : 'stable'
