<template>
  <ErrorBase
    class="my-5"
    style="animation-duration: 3s; animation-timing-function: ease-in"
    :search="false"
    :back="false"
  >
    <i class="fa fa-box-open" slot="icon" />
    <span slot="header">無內容</span>
    <span slot="description"> 找不到可以顯示的內容。 </span>
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
