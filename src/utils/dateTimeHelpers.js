// Functions for DateTime usage
// Copyright © 2022-2025 Kenneth Jagenheim. All rights reserved.
//

//const DateTime = require('luxon').DateTime;
import { DateTime } from 'luxon';

export function getTimestamp() {
  return DateTime.now().toUnixInteger();
}

export function getObservationTime(timestamp) {
  return DateTime.fromSeconds(timestamp).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
}

// Convert Unix timestamp in seconds to Eve display format
export function toEveDate(timestamp) {
  return String(new Date(timestamp * 1000)).slice(0, 24);
}

export function isoDateTimeToIntl(isoDateTime, locales) {
  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };
  if (!locales) {
    locales = Intl.DateTimeFormat().resolvedOptions().locale;
  }
  if (!isoDateTime) {
    isoDateTime = new Date.toISOString();
  }
  if (!isoDateTime.includes('Z')) {
    isoDateTime = isoDateTime + 'Z';
  }
  const dateTime = new Date(isoDateTime);
  const localDateTime = new Intl.DateTimeFormat(locales, options).format(dateTime);
  return localDateTime;
}

export function timestampToIntl(timestamp, locales) {
  return isoDateTimeToIntl(new Date(timestamp * 1000).toISOString(), locales);
}
