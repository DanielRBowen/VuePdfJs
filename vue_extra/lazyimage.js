Vue.directive('lazyload', {
    inserted: el => {
        function loadImage() {
            const imageElement = Array.from(el.children).find(
                el => el.nodeName === "IMG"
            );
            if (imageElement) {
                imageElement.addEventListener("load", () => {
                    setTimeout(() => el.classList.add("loaded"), 100);
                });
                imageElement.addEventListener("error", () => console.log("error"));
                imageElement.src = imageElement.dataset.url;
            }
        }

        function handleIntersect(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage();
                    observer.unobserve(el);
                }
            });
        }

        function createObserver() {
            const options = {
                root: null,
                threshold: "0"
            };
            const observer = new IntersectionObserver(handleIntersect, options);
            observer.observe(el);
        }
        if (window["IntersectionObserver"]) {
            createObserver();
        } else {
            loadImage();
        }
    }
});

/*
 * .detailed-image {
    z-index: 2100;
    position: relative;
    top: -250px;
    left: 0px;
    cursor: pointer;
}
 */

// Can try the  loading="lazy" attribute as shown here: https://web.dev/native-lazy-loading/
//https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/
Vue.component("lazyimage", {
    template: `
	<div>
		<figure v-lazyload style="cursor: pointer;">
			<img :data-url="source" alt="…" v-on:click="openDetailed" :class="thumbnailClass">
		</figure>

		<div class="lazyimage__lightbox" v-if="isDetailedDisplayed === true">
			<div class="lazyimage_lightbox__close" v-on:click="closeDetailed">
				<slot name="icon-close">&times;</slot>
			</div>
			<div class="lazyimage__element">

				<div v-lazyload v-if="isDetailedDisplayed" class="lazyimage_lightbox__image" v-on:click="closeDetailed">
					<img :data-url="detailedSource" alt="…">
				</div>
			</div>
		</div>
	</div>
`,
    props: {
        source: {
            type: String,
            required: true
        },
        detailedSource: {
            type: String,
            required: false
        },
        alt: {
            type: String,
            required: false,
            default: "…"
        },
        thumbnailClass: {
            type: String,
            required: false,
            default: "test"
        }
    },
    data() {
        return {
            isDetailedDisplayed: false
        };
    },
    methods: {
        openDetailed() {
            if (typeof this.detailedSource !== 'undefined' && this.detailedSource !== null) {
                this.isDetailedDisplayed = true;
                return;
            } else {
                this.isDetailedDisplayed = false;
            }
        },
        closeDetailed() {
            this.isDetailedDisplayed = false;
        },
        toggleDetailed() {
            if (typeof this.detailedSource !== 'undefined' && this.detailedSource !== null) {
                if (this.isDetailedDisplayed === true) {
                    this.isDetailedDisplayed = false;
                } else {
                    this.isDetailedDisplayed = true;
                }
            } else {
                this.isDetailedDisplayed = false;
            }
        }
    }
});
