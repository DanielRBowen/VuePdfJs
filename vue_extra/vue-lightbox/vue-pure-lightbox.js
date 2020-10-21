Vue.component('lightbox-default-loader', {
	template: `
    <div class="lightbox__default-loader">
        <div class="lightbox__default-loader__element"></div>
    </div>
			`,
	data() {
		return {
		};
	},
	methods: {
	}
});

Vue.component('lightbox', {
    template: `
<div>
    <slot name="preview" :show="show">
      <a v-if="thumbnail" :href="images[0]" target="_blank" @click.prevent="show" class="lightbox__thumbnail">
        <img :src="thumbnail" :alt="alternateText">
      </a>
    </slot>
    <div class="lightbox" v-if="visible" @click="hide">
      <div class="lightbox__close" @click="hide">
        <slot name="icon-close">&times;</slot>
      </div>
      <div class="lightbox__element" @click.stop="">
        <div
          class="lightbox__arrow lightbox__arrow--left"
          @click.stop.prevent="previous"
          :class="{ 'lightbox__arrow--invisible': !hasPrevious }"
        >
          <slot name="icon-previous">
            <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/>
              <path d="M0-.5h24v24H0z" fill="none"/>
            </svg>
          </slot>
        </div>
        <div class="lightbox__image" @click.stop="">
          <slot name="loader"><lightbox-default-loader /></slot>

          <slot name="content" :url="images[index]" v-if="displayImage">
            <img :src="images[index]">
          </slot>
        </div>
        <div
          class="lightbox__arrow lightbox__arrow--right"
          @click.stop.prevent="next"
          :class="{ 'lightbox__arrow--invisible': !hasNext }"
        >
          <slot name="icon-next">
            <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/>
              <path d="M0-.25h24v24H0z" fill="none"/>
            </svg>
          </slot>
        </div>
      </div>
    </div>
  </div>
			`,
    props: {
        thumbnail: {
            type: String,
            default: null,
        },
        images: {
            type: Array,
        },
        openAtIndex: {
            type: Number,
            default: 0,
        },
        alternateText: {
            type: String,
            default: '',
        },
        value: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            visible: this.value,
            index: this.openAtIndex,
            displayImage: true,
        }
    },
    computed: {
        hasNext() {
            return (this.index + 1 < this.images.length)
        },
        hasPrevious() {
            return (this.index - 1 >= 0)
        },
    },
    watch: {
        value(newValue) {
            this.visible = newValue
        },
        visible(newVisibility) {
            this.$emit('input', newVisibility)
        },
    },
    methods: {
        show() {
            this.visible = true
            this.index = this.openAtIndex
        },
        hide() {
            this.visible = false
            this.index = this.openAtIndex
        },
        previous() {
            if (this.hasPrevious) {
                this.index -= 1
                this.tick()
            }
        },
        next() {
            if (this.hasNext) {
                this.index += 1
                this.tick()
            }
        },
        tick() {
            if (!this.$slots.loader) {
                return
            }
            this.displayImage = false
            Vue.nextTick(() => {
                this.displayImage = true
            })
        },
        eventListener(e) {
            if (this.visible) {
                switch (e.key) {
                    case 'ArrowRight':
                        return this.next()
                    case 'ArrowLeft':
                        return this.previous()
                    case 'ArrowDown':
                    case 'ArrowUp':
                    case ' ':
                        return e.preventDefault()
                    case 'Escape':
                        return this.hide()
                }
            }
        },
    },
    mounted() {
        window.addEventListener('keydown', this.eventListener)
    },
    destroyed() {
        window.removeEventListener('keydown', this.eventListener)
    }
});