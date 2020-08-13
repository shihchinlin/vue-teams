<template>
  <ErrorBase class="my-5" :search="false" :back="false">
    <i class="fa fa-wrench" slot="icon" />
    <span slot="header">服務發生錯誤</span>
    <span slot="description">
      這項服務或功能發生異常，請回報總公司資訊處。
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
