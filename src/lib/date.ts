import moment from "moment";

export function timestampToRelativeDate(timestamp: number | undefined) {
  if (timestamp === undefined) {
    return "Invalid Date";
  }

  const date = moment(timestamp);
  const now = moment();
  const diffDays = now.diff(date, "days");

  // Within past week - show relative date
  if (diffDays < 7) {
    return date.fromNow();
  }

  // Current year - show date without year
  if (date.year() === now.year()) {
    return date.format("Do MMM");
  }

  // Previous years - show date with year
  return date.format("Do MMM YYYY");
}
