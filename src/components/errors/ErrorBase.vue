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
        <span
          class="text-primary cursor-pointer"
          v-if="back"
          @click="$router.back()"
        >
          回上一頁
        </span>
      </div>
    </div>
    <div class="mt-sm-5">
      <!-- <SearchBar autofocus v-if="search" /> -->
    </div>
  </div>
</template>

<script>
// import SearchBar from "@/components/search/SearchBar";

export default {
  components: {
    // SearchBar
  },
  props: {
    back: { type: Boolean, default: true },
    search: { type: Boolean, default: true },
  },
};
</script>

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

  .search-bar__root {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;

    .search-bar__input {
      background-color: $white;
    }

    .search-bar__dropdown {
      transform: translate3d(0px, 41px, 0px) !important;
    }

    .search-bar__toggle {
      color: $gray-dark;
    }
  }
}
</style>
