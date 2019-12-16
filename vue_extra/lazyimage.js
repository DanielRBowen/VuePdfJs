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


//https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/
Vue.component("lazyimage", {
    template: `
    <figure v-lazyload>
        <img :data-url="source" :alt="alt">
    </figure>
`,
    props: {
        source: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            required: false,
            default: "Image"
        }
    }
});