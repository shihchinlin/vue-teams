<template>
  <ErrorBase class="my-5" :search="false" :back="false">
    <i class="fa fa-wrench" slot="icon" />
    <span slot="header">服務維護中</span>
    <span slot="description">
      這項服務或功能現在工程人員正在進行維護，您可以選擇
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
