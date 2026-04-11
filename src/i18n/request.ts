import { getRequestConfig } from 'next-intl/server'

import { defaultLocale, isLocale } from './config'
import { getMessages } from './getMessages'

/**
 * next-intl server config.
 *
 * Resolves the active locale from the request (locale prefix injected by the
 * i18n middleware, or the `forje_locale` cookie), falling back to the default
 * locale. Messages are loaded via the deep-merge loader so missing keys in a
 * locale bundle transparently fall back to English.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = requested && isLocale(requested) ? requested : defaultLocale

  return {
    locale,
    messages: await getMessages(locale),
  }
})
