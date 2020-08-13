<template>
  <ErrorBase class="my-5" :search="false" :back="false">
    <i class="fa fa-times-circle" slot="icon" />
    <span slot="header">未認證授權</span>
    <span slot="description">
      尚未授權足夠的權限瀏覽，請聯絡總公司資訊處申請權限。
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
