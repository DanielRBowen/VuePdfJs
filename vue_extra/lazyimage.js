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
	position: absolute;
	top: -20px;
	left: -35px;
	cursor: pointer;
}
 */

// Can try the  loading="lazy" attribute as shown here: https://web.dev/native-lazy-loading/
//https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/
Vue.component("lazyimage", {
    template: `
<div>
    <figure v-lazyload style="cursor: pointer;">
        <img :data-url="source" alt="…" v-on:click="toggleDetailed">
    </figure>
    <figure v-lazyload v-if="isDetailedDisplayed" class="detailed-image" style="z-index: 2100; position: absolute; top: -20px; left: -35px; cursor: pointer;">
        <img :data-url="detailedSource" alt="…" v-on:click="toggleDetailed">
    </figure>
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
        }
    },
    data() {
        return {
            isDetailedDisplayed: false
        };
    },
    methods: {
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