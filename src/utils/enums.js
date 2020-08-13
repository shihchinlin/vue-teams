// Definations of breakpoints are based on Bootstrap
export const Breakpoints = Object.freeze({
  up: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  },
  down: {
    xs: 575.98,
    sm: 767.98,
    md: 991.98,
    lg: 1199.98,
    xl: 9999
  }
});

export const ShowOnMenuStatus = Object.freeze({
  [true]: "顯示",
  [false]: "隠藏"
});

export const ShowOnMobileStatus = Object.freeze({
  [true]: "顯示",
  [false]: "隠藏"
});

export const PathTypes = Object.freeze({
  TabView: "TabView",
  GridView: "GridView",
  DocumentView: "DocumentView",
  IframeView: "IframeView",
  CardView: "CardView",
  TableauView: "TableauView",
  MCpisView: "MCpisView"
});

export const PathStatus = Object.freeze({
  Published: "Published",
  Modifying: "Modifying",
  Building: "Building",
  Suspended: "Suspended"
});

export const PathStatusText = Object.freeze({
  Published: "發佈中",
  Modifying: "編輯中",
  Building: "建置中",
  Suspended: "停用中"
});

export const Visibilities = Object.freeze({
  [null]: "全部",
  "0100": "總公司",
  "1010": "北分",
  "3030": "南分",
  "4040": "企分",
  "5050": "行分",
  "6060": "國分",
  "7070": "數分",
  "8080": "研究院",
  "9090": "學院"
});

export const BMSystemType = Object.freeze({
  M: "業務會報",
  F: "FR"
});

export const BMRoleType = Object.freeze({
  SECRETARY: "S",
  MANAGER: "M",
  HELPER: "H"
});

export const BMRoleTypeText = Object.freeze({
  S: "秘書",
  M: "與會主管",
  H: "幫手"
});

export const BMActionItemType = Object.freeze({
  MONTH: "M",
  LAST_MONTH: "LM",
  NONECLOSE: "N"
});

export const BMAuditType = Object.freeze({
  E: "尚未新增",
  S: "送審中",
  Y: "審核通過",
  N: "尚未送審",
  R: "審核不通過"
});

export const BMPageIcon = Object.freeze({
  議程: "fa fa-stream",
  上月會議記錄: "fa fa-clipboard-list",
  重要待辦事項: "fa fa-clipboard-check",
  報告案: "fa fa-file-video",
  其他文件: "fa fa-copy"
});

export const MicrosoftGraphStatus = Object.freeze({
  LoggedOut: "LoggedOut",
  LoggingIn: "LoggingIn",
  LoggedIn: "LoggedIn",
  Forbidden: "Forbidden",
  GatewayTimeout: "GatewayTimeout",
  InternalServerError: "InternalServerError",
  ServiceUnavailable: "ServiceUnavailable",
  Unauthorized: "Unauthorized"
});

export const UserPresences = Object.freeze({
  Available: { value: "Available", color_variant: "success" },
  AvailableIdle: { value: "AvailableIdle", color_variant: "success" },
  Away: { value: "Away", color_variant: "warning" },
  BeRightBack: { value: "BeRightBack", color_variant: "warning" },
  Busy: { value: "Busy", color_variant: "danger" },
  BusyIdle: { value: "BusyIdle", color_variant: "danger" },
  DoNotDisturb: { value: "DoNotDisturb", color_variant: "danger" },
  Offline: { value: "Offline", color_variant: "secondary" },
  PresenceUnknown: { value: "PresenceUnknown", color_variant: "secondary" }
});
