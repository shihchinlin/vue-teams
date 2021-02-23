<template>
  <div
    :class="[
      'card-wrapper',
      'mask-wrapper',
      'mb-0',
      is_entering_card ? 'hovered' : '',
      isHashtagged ? 'focused' : '',
      isCardSelectable ? 'draggable' : ''
    ]"
    @mouseenter="enterCard"
    @mouseleave="leaveCard"
    :draggable="isCardSelectable"
    @dragstart="handleCardDragStart($event, { name: name })"
    @dragend="handleCardDragEnd($event, { name: name })"
  >
    <div class="mask d-none rounded cursor-grab text-nowrap overflow-hidden" />
    <b-card
      ref="card"
      no-body
      class="h-100 w-100 mb-0 bordered bg-white border-info"
      :name="name"
    >
      <b-card-body class="p-2"><slot></slot></b-card-body>
    </b-card>
  </div>
</template>

<script>
export default {
  name: "Card",
  props: {
    name: { type: String, required: true }
  },
  data: () => {
    return {
      is_entering_card: false,
      card_thumbnail: null
    };
  },
  computed: {
    isHashtagged() {
      let hash = decodeURIComponent(window.location.hash);
      return hash && hash === "#" + this.name;
    },
    isCardSelectable() {
      return (
        this.$store.hasModule("card") &&
        this.$store.state.card.capabilities.selectable
      );
    }
  },
  methods: {
    enterCard() {
      this.is_entering_card = true;
    },
    leaveCard() {
      this.is_entering_card = false;
    },
    handleCardDragStart(event, card) {
      if (this.isCardSelectable) {
        event.dataTransfer.setData(
          "text",
          JSON.stringify({ type: "card", content: card })
        );
        event.dataTransfer.setDragImage(this.card_thumbnail, 10, 10);
        event.dataTransfer.effectAllowed = "link";
        event.dataTransfer.dropEffect = "link";
        if (this.$store.hasModule("card"))
          this.$store.commit("card/TOGGLE_DRAGGING", true);
      }
    },
    handleCardDragEnd(event, card) {
      if (this.$store.hasModule("card"))
        this.$store.commit("card/TOGGLE_DRAGGING", false);
    }
  },
  created() {
    this.card_thumbnail = new Image();
    this.card_thumbnail.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA+CAYAAAC875yHAAAE70lEQVR4Xu2ca2wUVRSAz52Z7nYfJbSlTdst9MFKZWsqQmooqD8k6wNsCMH4iqi1NYWkFEN/lRhT/CEx1h+IiWgJRjEkJKCtJTThFYNCW39giKlUUYu2RftYt+uy7T5m5pqZttPuLrud2XGH7Xj33917zr3nfPfM3Dtn7h0E4T/zAfvj72xHthesLLUEc1xEdUQRAQIKUYAQii+4CGsxxsBjHjBgRNPgSePdJ6ihT1v6z+4DgNCsR5LjL5U8WPcuX9EGGC9CbzU0mUL4lWD31q5bfZ1CryLAHSWVr7VyFR9raMai7+pF/sqWc0PXzwgALSNFdbdJ5CkbU0xTfN5AmwEdLK8+8pw3t1aZOpEWCOyn+vaiX+6pdWcEYClBopzAoIUbQMNFtSEGAxOpztEIRvNNylvVoUbe8BSgO0yuHgi50fCKmhADVBTA8XwTOHoO6RCHcpcGHbvA6JNWLlIDHj5AAMrBSQDKoRRHJiZAivWSS1gG3FgAvVYaE4BqAGYwQACqBlj8KsfwiIpsh8zCc0RiXsJiBJbWYoaNHgYCkACUcXHKE9E0AoU02oUPPgM84QPj6uXwyNPV8qxMYSlNAV462Qn3NnVIOEKXW8BWWJjCeBY2TVOAXx87BY43uiSrfBeaocS+cmErVUpw87LnNE2rbC1cXfcAf/6xH5Y+2Sp5zV7eDwWFtv8Mou4Bfn/pCth2HJWADR6vg3Ub1///AJ4//DnY2vvEFw1/NzwKG7c4ZUEgAGcwjazaCSgwvSh151ugrOcgAahkEgkHaIaynvcJQAJQVgzMCalZxpAIBIBkAfzmyzNQ2vyVOFJjZVmwpuNtadTIJHLHSST8Hnj1mRYo7B2SoOXcbJN2lBCABGDy74EkAmcYC9ma2edWhgl/mxpvEiEAASAYDIK7fDeg4PS2uV8/eh6qntgkhS8BuMAs7JnwQOD+JgnYtZ2V4GyuJwDnLxXjLWMIQBmLagJwBlKiL5UIQAIw6jpLmYSqz+cDn2OPZOAPLU7YVPOsVP5j7W5Id02J5aGKHFjbeUCqu9jUCved7BfLOI2G3BuHpSeRvqvXIGfb3E6yyYv7oHhlqYwbjjyRlAEomHvb64WAPyBanp2zLMwDlmXB454Q/8talh21+d81Ni7Wma0WMJnC9y66XC4AHgNF05CZlSmPjEyplAIo0+aUEiMAVQ7HXQU43tEIy0uLVbqgXp2iKLBYrQk1dFcBJmRxkpSUZMfnm6ApwG/bu2DVnlNJQqCu2b9O1EPF+krFjWgKkOd5uPVAIxgm/IoNTbbC2BcNUL5ujeJuNAUoWCdA7O48C5wvdSAyS8yw4anHFMMTFDQHmJCVKawUH2BRDctgKmo3TqLPwinMIWHTYgH8x4RCZI+0DKzkmIMMSPFEyEEbAlAlAZXqJAIJQJUEVKqTCEwqwBgHrjGFYCrDoLJrfaibPdMJ4MifeOC6314znhmksvXhqrZeDJhDP6G37M736oMr9mrbtT56ezPteqPw2RPDSHGdH3isv68PJXGcOIZiC35rM4rQNhc4tn7CVLUnsT/dNV3tP7/hu9Hfu6Woc+at3nzM9NBpxPEkEuMMtxB523znHu4dudkjiEXCYhqKql5/2WjflR1gctONhvQFQgcBHZ3JWRThxvHCFjFZHwqbDPgnRw3cn0fZG4eODPR+KKQ8Z338F3t4uXmrTqs8AAAAAElFTkSuQmCC";
  },
  watch: {
    isHashtagged: {
      immediate: true,
      handler(now, prev) {
        if (now)
          this.$nextTick(() => {
            setTimeout(() => {
              this.$el.scrollIntoView();
            }, 3000);
          });
      }
    }
  }
};
</script>

<style lang="scss">
div.card-wrapper {
  &.mask-wrapper {
    position: relative;

    > .mask {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 999;
      background-color: rgba(0, 0, 0, 0);
    }
  }

  &.hovered {
    box-shadow: map-get($shadow, "box_hovered");
  }

  &.focused {
    box-shadow: map-get($shadow, "box_focused");
  }

  > .mask {
    z-index: 1000;
  }

  &.draggable {
    &.hovered {
      box-shadow: map-get($shadow, "box_focused");
    }

    > .mask {
      display: flex !important;
      align-items: center;
      justify-content: center;
      background-color: transparentize($danger, 0.5) !important;
      opacity: 0.2;

      &::after {
        display: block;
        margin-top: auto;
        margin-bottom: auto;
        content: "- Drag -";
        color: $danger !important;
        font-size: 3.5rem;
      }
    }
  }

  > div.card {
    box-shadow: map-get($shadow, "box");

    &.bordered {
      border-left-width: 8px;
      border-right-width: 0;
      border-top-width: 0;
      border-bottom-width: 0;
    }
  }
}
</style>
