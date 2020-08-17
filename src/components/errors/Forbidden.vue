<template>
  <ErrorBase class="my-5">
    <i class="fa fa-times-circle" slot="icon" />
    <span slot="header">Forbidden</span>
    <span slot="description">
      Access is denied to the requested resource. The user might not have enough
      permission.
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
