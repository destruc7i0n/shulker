export const escapeUnicode = (str: string) =>
  str.replace(/[^\x00-\x7F]/g, (char: string) => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))

export const fixMinecraftUsername = (username: string) => username.replace(/(§[A-Z-a-z0-9])/g, '')
