import moment from "moment";
moment.locale("zh-tw");

export default {
  methods: {
    formatToday: format => {
      if (format) return moment().format(format);
      else return moment().format(moment().defaultFormat);
    },
    formatDateTimeFromNow: datetime => {
      return datetime === "" ? datetime : moment(datetime).fromNow();
    },
    formatNumberForRead: number => {
      if (parseFloat(number) !== number) return number;
      let value = number;
      let digits = Math.abs(Math.floor(number)).toString().length;
      let unit = "";
      if (digits >= 9) {
        value = number / 100000000;
        unit = "億";
      } else if (digits >= 5) {
        value = number / 10000;
        unit = "萬";
      } else {
        value = number;
        unit = "";
      }
      return Math.round(value * 100) / 100 + " " + unit;
    },
    formatNameInitials: name => {
      return name
        ? name
            .split(" ")
            .map((n, i, a) => (i === 0 || i + 1 === a.length ? n[0] : null))
            .join("")
        : name;
    }
  }
};
