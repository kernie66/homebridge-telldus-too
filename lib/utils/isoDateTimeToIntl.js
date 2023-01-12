function isoDateTimeToIntl(isoDateTime, locales) {
  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };
  if (!locales) {
    locales = Intl.DateTimeFormat().resolvedOptions().locale
  }
  if (!isoDateTime) {
    isoDateTime = new Date.toISOString()
  }
  if (!isoDateTime.includes('Z')) {
    isoDateTime = isoDateTime + 'Z'
  }
  const dateTime = new Date(isoDateTime);
  const localDateTime = new Intl.DateTimeFormat(locales, options).format(dateTime);
  return localDateTime
}

module.exports = isoDateTimeToIntl