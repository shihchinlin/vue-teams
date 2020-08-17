<template>
  <div class="error clearfix w-75 mx-auto">
    <div class="icon text-dark float-sm-left mx-auto text-center mr-sm-3">
      <slot name="icon"></slot>
    </div>
    <div class="clearfix d-flex flex-column">
      <div class="m-0 py-2 h3 text-center text-sm-left">
        <slot name="header"></slot>
      </div>
      <div class="text-muted text-center text-sm-left">
        <slot name="description"></slot>
      </div>
    </div>
    <div class="mt-sm-5"></div>
  </div>
</template>

<style lang="scss">
.error {
  .icon {
    width: 5rem;
    height: 5rem;

    i {
      display: block;
      font-size: 4rem;
      line-height: 5rem;
    }
  }
}
</style>
