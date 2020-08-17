<template>
  <ErrorBase class="my-5">
    <i class="fa fa-wrench" slot="icon" />
    <span slot="header">Service Unavailable</span>
    <span slot="description">
      The service is temporarily unavailable for maintenance or is overloaded.
      You may repeat the request after a delay, the length of which may be
      specified in a Retry-After header.
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
