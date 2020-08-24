<template>
  <ErrorBase>
    <i class="fa fa-times-circle" slot="icon" />
    <span slot="header">Unauthorized</span>
    <span slot="description">
      Required authentication information is either missing or not valid for the
      resource.
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
