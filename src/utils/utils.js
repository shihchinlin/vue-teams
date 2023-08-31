import dayjs from "dayjs";
import "dayjs/locale/zh-tw";
import modules from "../store/modules";

dayjs.locale("zh-tw");

export function formatDateTimeFromNow(datetime) {
  return datetime === "" ? datetime : dayjs(datetime).fromNow();
}

export function formatNameInitials(name) {
  return name
    ? name
        .split(" ")
        .map((n, i, a) => (i === 0 || i + 1 === a.length ? n[0] : null))
        .join("")
    : name;
}

export const registerModule = (moduleName) => (store, state) => {
  if (!store.hasModule(moduleName)) {
    store.registerModule(moduleName, {
      namespaced: true,
      state: Object.assign({}, modules[moduleName].state, state),
      getters: modules[moduleName].getters,
      actions: modules[moduleName].actions,
      mutations: modules[moduleName].mutations,
    });
  }
};

export const registerMicrosoftModule = registerModule("microsoft");

export const registerCardModule = registerModule("card");

/**
 *
 * @param {string} onlineMeetingBody
 * @param {string} newContent
 * @param {string} containerSelector
 * @returns replaced body content.
 */
export const replaceOnlineMeetingBodyContent = (
  onlineMeetingBody,
  newContent,
  containerSelector
) => {
  let parser = new DOMParser();
  let serializer = new XMLSerializer();

  let bodyHtml = parser.parseFromString(`${onlineMeetingBody}`, "text/html");
  bodyHtml.querySelector(containerSelector).innerHTML = newContent;

  return serializer.serializeToString(bodyHtml);
};
