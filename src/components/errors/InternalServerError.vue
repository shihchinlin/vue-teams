<template>
  <ErrorBase class="my-5">
    <i class="fa fa-wrench" slot="icon" />
    <span slot="header">Internal Server Error</span>
    <span slot="description">
      There was an internal server error while processing the request.
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
