<template>
  <ErrorBase
    class="my-5"
    style="animation-duration: 3s; animation-timing-function: ease-in"
    :search="false"
    :back="false"
  >
    <i class="fa fa-exclamation-triangle" slot="icon" />
    <span slot="header">錯誤的伺服器請求</span>
    <span slot="description">
      當前的資料請求發生錯誤，可能是請求格式錯誤或伺服器正在維護中，您可以選擇
      <span class="text-primary cursor-pointer" @click="reload()">
        重新整理
      </span>
      或者稍後再試。
    </span>
  </ErrorBase>
</template>

<script>
import ErrorBase from "@/components/errors/ErrorBase";

export default {
  components: {
    ErrorBase
  },
  methods: {
    reload() {
      location.reload();
    }
  }
};
</script>
