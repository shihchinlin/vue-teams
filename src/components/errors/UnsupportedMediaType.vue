<template>
  <ErrorBase>
    <i class="fa fa-file-excel" slot="icon" />
    <span slot="header">Unsupported Media Type</span>
    <span slot="description">
      The content type of the request is a format that is not supported by the
      service.
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
