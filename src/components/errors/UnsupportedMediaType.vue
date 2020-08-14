<template>
  <ErrorBase class="my-5" :search="false" :back="false">
    <i class="fa fa-file-excel" slot="icon" />
    <span slot="header">不支援討論功能</span>
    <span slot="description">
      目前的檢視內容不支援討論功能，請由左邊選單選擇一個主題。
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
