<template>
  <ErrorBase
    class="my-5"
    style="animation-duration: 3s; animation-timing-function: ease-in"
    :search="false"
    :back="false"
  >
    <i class="fa fa-file-excel" slot="icon" />
    <span slot="header">不支援的檔案類型</span>
    <span slot="description"> 檔案檢視器不支援此檔案類型或檔案路徑錯誤。 </span>
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
