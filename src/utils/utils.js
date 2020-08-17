import moment from "moment";
moment.locale("zh-tw");

export function formatDateTimeFromNow(datetime) {
  return datetime === "" ? datetime : moment(datetime).fromNow();
}

export function formatNameInitials(name) {
  return name
    ? name
        .split(" ")
        .map((n, i, a) => (i === 0 || i + 1 === a.length ? n[0] : null))
        .join("")
    : name;
}
