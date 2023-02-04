const DateTime = require('luxon').DateTime;

function getTimestamp() {
  return DateTime.now().toUnixInteger();
}

function getObservationTime(timestamp) {
  return DateTime.fromSeconds(timestamp).toLocaleString(
    DateTime.DATETIME_MED_WITH_WEEKDAY
  );
}

// Convert Unix timestamp in seconds to Eve display format
function toEveDate(timestamp) {
  return String(new Date(timestamp * 1000)).slice(0, 24);
}

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
    locales = Intl.DateTimeFormat().resolvedOptions().locale;
  }
  if (!isoDateTime) {
    isoDateTime = new Date.toISOString();
  }
  if (!isoDateTime.includes('Z')) {
    isoDateTime = isoDateTime + 'Z';
  }
  const dateTime = new Date(isoDateTime);
  const localDateTime = new Intl.DateTimeFormat(
    locales,
    options
  ).format(dateTime);
  return localDateTime;
}

function timestampToIntl(timestamp, locales) {
  return isoDateTimeToIntl(
    new Date(timestamp * 1000).toISOString(),
    locales
  );
}

module.exports.getTimestamp = getTimestamp;
module.exports.getObservationTime = getObservationTime;
module.exports.toEveDate = toEveDate;
module.exports.isoDateTimeToIntl = isoDateTimeToIntl;
module.exports.timestampToIntl = timestampToIntl;
