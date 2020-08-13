<template>
  <div :class="['spinner', mask ? 'mask' : '']">
    <PulseLoader loading color="#9e9e9e" />
    <span v-if="Boolean(message)">{{ message }}</span>
  </div>
</template>

<script>
import PulseLoader from "vue-spinner/src/PulseLoader";

export default {
  components: { PulseLoader },
  props: {
    mask: { type: Boolean, default: false },
    message: { type: String, default: "" }
  }
};
</script>

<style lang="scss">
.spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 80px;

  &.mask {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    z-index: auto;
    width: 100%;
    height: 100%;
  }
}
</style>
