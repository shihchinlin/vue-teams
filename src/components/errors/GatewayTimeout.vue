<template>
  <ErrorBase>
    <i class="fa fa-wrench" slot="icon" />
    <span slot="header">Gateway Timeout</span>
    <span slot="description">
      The server, while acting as a proxy, did not receive a timely response
      from the upstream server it needed to access in attempting to complete the
      request.
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
