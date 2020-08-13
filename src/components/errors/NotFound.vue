<template>
  <ErrorBase class="my-5">
    <i class="fa fa-exclamation-circle" slot="icon" />
    <span slot="header">找不到頁面</span>
    <span slot="description">
      我們似乎無法找到您要瀏覽的頁面，點擊進來的連結可能發生故障或者被移除了。
    </span>
  </ErrorBase>
</template>

<script>
import ErrorBase from "@/components/errors/ErrorBase";

export default {
  components: {
    ErrorBase
  }
};
</script>
