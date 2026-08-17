import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing, type AppLocale } from './routing';
import faAuthForm from '../../messages/fa/auth-form.json';
import faResetPassword from '../../messages/fa/reset-password.json';
import faSearchUi from '../../messages/fa/search-ui.json';
import faAccountNav from '../../messages/fa/account-nav.json';
import faMetadata from '../../messages/fa/metadata.json';
import faSiteUi from '../../messages/fa/site-ui.json';
import faTraditional from '../../messages/fa/traditional.json';
import enAuthForm from '../../messages/en/auth-form.json';
import enResetPassword from '../../messages/en/reset-password.json';
import enSearchUi from '../../messages/en/search-ui.json';
import enAccountNav from '../../messages/en/account-nav.json';
import enMetadata from '../../messages/en/metadata.json';
import enSiteUi from '../../messages/en/site-ui.json';
import enTraditional from '../../messages/en/traditional.json';
import psAuthForm from '../../messages/ps/auth-form.json';
import psResetPassword from '../../messages/ps/reset-password.json';
import psSearchUi from '../../messages/ps/search-ui.json';
import psAccountNav from '../../messages/ps/account-nav.json';
import psMetadata from '../../messages/ps/metadata.json';
import psSiteUi from '../../messages/ps/site-ui.json';
import psTraditional from '../../messages/ps/traditional.json';

type Messages = Record<string, unknown>;

function mergeMessages(...sources: Messages[]): Messages {
  const result: Messages = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      const current = result[key];
      if (current && typeof current === 'object' && !Array.isArray(current) && value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = mergeMessages(current as Messages, value as Messages);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

const modulesByLocale: Record<AppLocale, Messages[]> = {
  fa: [faAuthForm, faResetPassword, faSearchUi, faAccountNav, faMetadata, faSiteUi, faTraditional],
  en: [enAuthForm, enResetPassword, enSearchUi, enAccountNav, enMetadata, enSiteUi, enTraditional],
  ps: [psAuthForm, psResetPassword, psSearchUi, psAccountNav, psMetadata, psSiteUi, psTraditional],
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as AppLocale)) locale = routing.defaultLocale;
  try {
    const base = (await import(`../../messages/${locale}.json`)).default as Messages;
    return { locale, messages: mergeMessages(base, ...modulesByLocale[locale as AppLocale]) };
  } catch {
    notFound();
  }
});
