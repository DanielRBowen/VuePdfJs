
/*
// https://github.com/DanielRBowen/VuePdfJs
// Original source from: https://github.com/rossta/vue-pdfjs-demo

<head>
    <link type="text/css" rel="stylesheet" href="vue-pdfjs.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.4.0/css/perfect-scrollbar.min.css" />
</head>

<body>
    <div id="app">
        <pdf-viewer :pdf-data="pdfData" v-on:pull="pullPdf"><button>Show Pdf</button></pdf-viewer>
    </div>

    <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js"
        integrity="sha256-pasqAKBDmFT4eHoN2ndd6lN370kFiGUFyTiUHWhU7k8=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.4.0/perfect-scrollbar.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.min.js"></script>
    <script src="https://unpkg.com/vue"></script>
    <script src="download-pdf.js"></script>
    <script src="vue-pdfjs.js"></script>
    <script src="demo.js"></script>
</body>

*/

// Needs JQuery
// Needs Vue <script src="https://unpkg.com/vue"></script>
// Needs: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.min.js"></script>
// Needs: <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js"></script>
// Needs: <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.4.0/perfect-scrollbar.min.js"></script>

// Needs: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery.perfect-scrollbar/1.4.0/css/perfect-scrollbar.min.css" />
// Needs: <link type="text/css" rel="stylesheet" href="vue-pdfjs.css" />

Vue.component('pdf-viewer', {
    props: ['pdfData'],
    template: `
<div>
    <div class="pdf-overlay" v-show="isOpen">
        <vue-pdfjs :bytes="pdfData" v-on:close="closeOverlay" style="width:100vw; height:100vh;" />
    </div>
    <a v-on:click="openOverlay">
        <slot>Display PDF</slot>
    </a>
</div>
`,
    data() {
        return {
            isOpen: false,
            ps: null
        };
    },
    methods: {
        openOverlay() {
            if (typeof this.pdfData === 'undefined' || this.pdfData === null) {
                this.$emit('pull');
                return;
            }
            this.isOpen = true;
        },
        closeOverlay() {
            this.isOpen = false;
        }
    },
    watch: {
        pdfData() {
            if (typeof this.pdfData === 'undefined' || this.pdfData === null) {
                return;
            } else {
                this.openOverlay();
            }
        }
    }
});



function log(message, el) {
    //console.log(message)
};

function floor(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.floor(value * multiplier) / multiplier;
}

//Constants
const PIXEL_RATIO = window.devicePixelRatio || 1;
const VIEWPORT_RATIO = 0.98;

Vue.directive('scroll', {
    inserted(el, binding) {
        const callback = binding.value;
        if (binding.modifiers.immediate) {
            callback();
        }
        const throttledScroll = _.throttle(callback, 300);
        el.addEventListener('scroll', throttledScroll, true);
    }
})

// Directives - visible
const instances = new WeakMap();

function createObserver(el, vnode, modifiers, callback) {
    const observer = new IntersectionObserver(entries => {
        const entry = entries[0];
        if (entry.isIntersecting) {
            callback();
            if (modifiers.once) {
                disconnectObserver(observer, el);
            }
        }
    })

    // Observe when element is inserted in DOM
    vnode.context.$nextTick(() => observer.observe(el))

    return observer;
}

function disconnectObserver(observer, el) {
    log('Disconnecting observer', el);
    if (observer) observer.disconnect();
}

Vue.directive('visible', {
    bind(el, { value, modifiers }, vnode) {
        log("Binding element", el);
        if (typeof window.IntersectionObserver === 'undefined') {
            log('IntersectionObserver API is not available in your browser.')
        } else {
            const observer = createObserver(el, vnode, modifiers, () => {
                log("Element is visible", el)
                const callback = value;
                if (typeof callback === "function") callback();
            })
            instances.set(el, { observer })
        }
    },
    unbind(el) {
        if (instances.has(el)) {
            const { observer } = instances.get(el);
            disconnectObserver(observer, el);
            instances.delete(el);
        }
    },
    update(el, { value, oldValue }, vnode) {
        if (value === oldValue) return;

        const { observer } = instances.get(el)
        disconnectObserver(observer, el);
        bind(el, { value }, vnode);
    }
})



Vue.component('vue-pdfjs', {
    template: `
<div class="pdf-viewer">
    <header class="pdf-viewer__header box-shadow btn-toolbar justify-content-around">
        <div class="pdf-preview-toggle btn-group">
            <a @click.prevent.stop="togglePreview" class="btn"><i class="fa fa-th-list" aria-hidden="true"></i></a>
        </div>

        <PDFZoom
            :scale="scale"
            @change="updateScale"
            @fit="updateFit"
            class="header-item d-none d-md-block"
            />

        <PDFPaginator
            v-model="currentPage"
            :pageCount="pageCount"
            class="header-item"
            />

        <div class="btn-group">
            <a @click.prevent.stop="close" class="btn">
                <i class="fa fa-times" aria-hidden="true"></i>
            </a>
        </div>

        <slot name="header"></slot>
    </header>

    <PDFData
    class="pdf-viewer__main"
    :bytes="bytes"
    @page-count="updatePageCount"
    @page-focus="updateCurrentPage"
    @document-rendered="onDocumentRendered"
    @document-errored="onDocumentErrored"
    >
    <template v-slot:preview="{pages}">
        <PDFPreview
        v-show="isPreviewEnabled"
        class="pdf-viewer__preview"
        v-bind="{pages, scale, currentPage, pageCount, isPreviewEnabled}"
        />
    </template>

    <template v-slot:document="{pages}">
        <PDFDocument
        class="pdf-viewer__document"
        :class="{ 'preview-enabled': isPreviewEnabled }"
        v-bind="{pages, scale, optimalScale, fit, currentPage, pageCount, isPreviewEnabled, minScale}"
        @scale-change="updateScale"
        />
    </template>
    </PDFData>
</div>
`,
    props: {
        bytes: String
    },
    data() {
        return {
            scale: 1.0,
            optimalScale: 3.0,
            minScale: 0.8,
            fit: '1',
            currentPage: 1,
            pageCount: 1,
            isPreviewEnabled: false
        };
    },
    methods: {
        onDocumentRendered(e) {
            this.$emit('document-errored', e);
        },

        onDocumentErrored(e) {
            this.$emit('document-errored', e);
        },

        updateScale({ scale, isOptimal = false }) {
            const roundedScale = floor(scale, 2);
            if (isOptimal) this.optimalScale = roundedScale;
            this.scale = roundedScale;

            if (this.scale < this.minScale) {
                this.scale = this.minScale;
            }
        },

        updateFit(fit) {
            this.fit = fit;
        },

        updatePageCount(pageCount) {
            this.pageCount = pageCount;
        },

        updateCurrentPage(pageNumber) {
            this.currentPage = pageNumber;
        },

        togglePreview() {
            this.isPreviewEnabled = !this.isPreviewEnabled;
        },

        close() {
            this.$emit('close');
        }
    },
    watch: {
        bytes() {
            this.currentPage = undefined;
        }
    },
    mounted() {
        document.body.classList.add('overflow-hidden');
    },
});




Vue.component('PDFZoom', {
    template: `
    <div class="pdf-zoom btn-group">
        <a @click.prevent.stop="zoomIn" class="btn" :disabled="isDisabled"><i class="fa fa-search-plus" aria-hidden="true"></i></a>
        <a @click.prevent.stop="zoomOut" class="btn" :disabled="isDisabled"><i class="fa fa-search-minus" aria-hidden="true"></i></a>
        <a @click.prevent.stop="fitWidth" class="btn" :disabled="isDisabled"><i class="fa fa-expand" aria-hidden="true"></i></a>
        <a @click.prevent.stop="fitAuto" class="btn" :disabled="isDisabled"><i class="fa fa-compress" aria-hidden="true"></i></a>
    </div>
`,
    props: {
        scale: {
            type: Number,
            default: 1.0
        },
        increment: {
            type: Number,
            default: 0.25,
        },
    },
    computed: {
        isDisabled() {
            return !this.scale;
        },
    },
    methods: {
        zoomIn() {
            this.updateScale(this.scale + this.increment);
        },

        zoomOut() {
            if (this.scale <= this.increment) return;
            this.updateScale(this.scale - this.increment);
        },

        updateScale(scale) {
            this.$emit('change', { scale });
        },

        fitWidth() {
            this.$emit('fit', 'width');
        },

        fitAuto() {
            this.$emit('fit', 'auto');
        },
    }
});





Vue.component('PDFPaginator', {
    template: `
    <template v-if="pageCount > 0">
    <div class="input-group">
        <div class="input-group-prepend">
            <a class="btn" @click.prevent.stop="prevPage">
                <i class="fa fa-minus" aria-hidden="true"></i>
            </a>
        </div>
        <input
            :value="value"
            @input="input"
            min="1"
            :max="pageCount"
            type="number"
            class="form-control page-input"
            />
        <div class="input-group-append">
            <div class="input-group-text page-count" style="margin: 10px 0; padding: 0 10px; font-size: .875rem;">/ <span>{{ pageCount }}</span></div>
        </div>

        <div class="input-group-append">
            <a class="btn"  @click.prevent.stop="nextPage">
                <i class="fa fa-plus" aria-hidden="true"></i>
            </a>
        </div>

    </div>
    </template>
      <input v-else type="number" class="form-control" />
`,
    props: {
        value: Number,
        pageCount: Number,
    },
    methods: {
        input(event) {
            this.$emit('input', parseInt(event.target.value, 10));
        },
        prevPage() {
            if (this.value > 1)
                this.value--;
            this.$emit('input', this.value);
        },
        nextPage() {
            if (this.value < this.pageCount)
                this.value++;
            this.$emit('input', this.value);
        },
    },
    watch: {
        pageCount() {
            this.$emit('input', 1);
        },
    }
});



function getDocumentFromBytes(bytes) {
    //let pdfData = Buffer.from(bytes, "base64").toString("binary");
    let pdfData = atob(bytes);

    loadingTask = this.pdfjsLib.getDocument({ data: pdfData });

    return loadingTask;
}


// pdf: instance of PDFData
// see docs for PDF.js for more info
function getPages(pdf, first, last) {
    const allPages = _.range(first, last + 1).map(number => pdf.getPage(number));
    return Promise.all(allPages);
}



const BUFFER_LENGTH = 10;
function getDefaults() {
    return {
        pages: [],
        cursor: 0,
    };
}


Vue.component('PDFData', {
    template: `
`,
    props: {
        bytes: {
            type: String,
            required: false,
        },
    },

    data() {
        return Object.assign(getDefaults(), {
            pdf: undefined,
        });
    },

    watch: {
        bytes: {
            handler(bytes) {
                if (typeof bytes === undefined || bytes === null || bytes === undefined) {
                    return;
                }

                getDocumentFromBytes(bytes)
                    .promise
                    .then(pdf => (this.pdf = pdf))
                    .catch(response => {
                        this.$emit("document-errored", {
                            text: "Failed to retrieve PDF",
                            response
                        });
                        log('Failed to retrieve PDF', response)
                    });
            },
            immediate: true
        },

        pdf(pdf, oldPdf) {
            if (!pdf) return;
            if (oldPdf) Object.assign(this, getDefaults());

            this.$emit('page-count', this.pageCount);
            this.fetchPages();
        },
    },

    computed: {
        pageCount() {
            return this.pdf ? this.pdf.numPages : 0;
        },
    },

    mounted() {
        this.pdfjsLib = window['pdfjs-dist/build/pdf'];
        this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.worker.min.js';
    },

    methods: {
        fetchPages(currentPage = 0) {
            if (!this.pdf) return;
            if (this.pageCount > 0 && this.pages.length === this.pageCount) return;

            const startIndex = this.pages.length;
            if (this.cursor > startIndex) return;

            const startPage = startIndex + 1;
            const endPage = Math.min(Math.max(currentPage, startIndex + BUFFER_LENGTH), this.pageCount);
            this.cursor = endPage;

            log(`Fetching pages ${startPage} to ${endPage}`);
            getPages(this.pdf, startPage, endPage)
                .then((pages) => {
                    const deleteCount = 0;
                    this.pages.splice(startIndex, deleteCount, ...pages);
                    return this.pages;
                })
                .catch((response) => {
                    this.$emit('document-errored', { text: 'Failed to retrieve pages', response });
                    log('Failed to retrieve pages', response);
                });

            if (typeof document.pdfPs === 'undefined' || document.pdfPs === null) {
                $('.pdf-scroll').each(function () { document.pdfPs = new PerfectScrollbar($(this)[0]); });
            }

            document.pdfPs.update();
        },

        onPageRendered({ text, page }) {
            log(text, page);
        },

        onPageErrored({ text, response, page }) {
            log('Error!', text, response, page);
        },
    },

    created() {
        this.$on('page-rendered', this.onPageRendered);
        this.$on('page-errored', this.onPageErrored);
        this.$on('pages-fetch', this.fetchPages);
    },

    render(h) {
        return h('div', [
            this.$scopedSlots.preview({
                pages: this.pages,
            }),
            this.$scopedSlots.document({
                pages: this.pages,
            }),
        ]);
    },

});



Vue.component('PDFPreview', {
    template: `
    <ScrollingDocument
    class="pdf-preview pdf-scroll"
    @pages-fetch="onPagesFetch"
    v-bind="{pages, pageCount, currentPage}"
    v-slot="{page, isPageFocused}"
    :is-parent-visible="isPreviewEnabled"
    >
    <PDFThumbnail
      v-bind="{scale, page, isPageFocused}"
      @thumbnail-rendered="onThumbnailRendered"
      @thumbnail-errored="onThumbnailErrored"
      @page-focus="onPageFocused"
      />
  </ScrollingDocument>
`,
    props: {
        pages: {
            required: true,
        },
        pageCount: {
            type: Number,
            default: 0,
        },
        scale: {
            type: Number,
            default: 1.0,
        },
        currentPage: {
            type: Number,
            default: 1,
        },
        isPreviewEnabled: {
            default: false,
        },
    },

    methods: {
        onPagesFetch(currentPage) {
            this.$parent.$emit('pages-fetch', currentPage);
        },

        onPageFocused(pageNumber) {
            this.$parent.$emit('page-focus', pageNumber);
        },

        onThumbnailRendered(payload) {
            this.$el.dispatchEvent(new Event('scroll'));
            this.$parent.$emit('thumbnail-rendered', payload);
        },

        onThumbnailErrored(payload) {
            this.$parent.$emit('thumbnail-errored', payload);
        },
    }
});



Vue.component('ScrollingDocument', {
    template: `
    <div
    class="scrolling-document"
    v-scroll.immediate="updateScrollBounds"
    >
    <ScrollingPage
      v-for="page in pages"
      :key="page.pageNumber"
      v-bind="{page, clientHeight, scrollTop, focusedPage, enablePageJump}"
      v-slot="{isPageFocused, isElementFocused}"
      @page-jump="onPageJump"
      >
      <div
        class="scrolling-page"
        >
        <slot v-bind="{page, isPageFocused, isElementFocused}"></slot>
      </div>
    </ScrollingPage>

    <div v-visible="fetchPages" class="observer"></div>
  </div>
`,
    props: {
        pages: {
            required: true,
        },
        enablePageJump: {
            type: Boolean,
            default: false,
        },
        currentPage: {
            type: Number,
            default: 1,
        },
        isParentVisible: {
            default: true,
        },
    },

    data() {
        return {
            focusedPage: undefined,
            scrollTop: 0,
            clientHeight: 0
        };
    },

    computed: {
        pagesLength() {

            return this.pages.length;
        },
    },

    methods: {
        fetchPages(currentPage) {
            this.$emit('pages-fetch', currentPage);
        },

        onPageJump(scrollTop) {
            this.$emit('page-jump', scrollTop);
        },

        updateScrollBounds() {
            const { scrollTop, clientHeight } = this.$el;
            this.scrollTop = scrollTop;
            this.clientHeight = clientHeight;
        },
    },

    watch: {
        isParentVisible: 'updateScrollBounds',

        pagesLength(count, oldCount) {
            if (oldCount === 0) this.$emit('pages-reset');

            // Set focusedPage after new pages are mounted
            this.$nextTick(() => {
                this.focusedPage = this.currentPage;
            });
        },

        currentPage(currentPage) {
            if (currentPage > this.pages.length) {
                this.fetchPages(currentPage);
            } else {
                this.focusedPage = currentPage;
            }
        },
    },

    mounted() {
    }
});



Vue.component('ScrollingPage', {
    template: `
`,
    props: {
        page: {
            type: Object, // instance of PDFPageProxy returned from pdf.getPage
            required: true,
        },
        focusedPage: {
            type: Number,
            default: undefined,
        },
        scrollTop: {
            type: Number,
            default: 0,
        },
        clientHeight: {
            type: Number,
            default: 0
        },
        enablePageJump: {
            type: Boolean,
            default: false,
        },
    },

    data() {
        return {
            elementTop: 0,
            elementHeight: 0,
        };
    },

    computed: {
        isPageFocused() {
            return this.page.pageNumber === this.focusedPage;
        },

        isElementFocused() {
            const { elementTop, bottom, elementHeight, scrollTop, clientHeight } = this;
            if (!elementHeight) return;

            const halfHeight = (elementHeight / 2);
            const halfScreen = (clientHeight / 2);
            const delta = elementHeight >= halfScreen ? halfScreen : halfHeight;
            const threshold = scrollTop + delta;

            return elementTop < threshold && bottom >= threshold;
        },

        bottom() {
            return this.elementTop + this.elementHeight;
        },

        scrollBottom() {
            return this.scrollTop + this.clientHeight;
        },
    },

    methods: {
        jumpToPage() {
            if (!this.enablePageJump || this.isElementFocused || !this.isPageFocused) return;

            this.$emit('page-jump', this.elementTop);
        },

        updateElementBounds() {
            const { offsetTop, offsetHeight } = this.$el;
            this.elementTop = offsetTop;
            this.elementHeight = offsetHeight;
        },
    },

    watch: {
        scrollTop: 'updateElementBounds',
        clientHeight: 'updateElementBounds',
        isPageFocused: 'jumpToPage',
    },

    created() {
        this.$on('update-visibility', this.updateElementBounds);
    },

    mounted() {
        this.updateElementBounds();
    },

    render() {
        const { isPageFocused, isElementFocused } = this;
        return this.$scopedSlots.default({
            isPageFocused,
            isElementFocused,
        });
    }
});



Vue.component('PDFThumbnail', {
    template: `
    <div
    @click="focusPage"
    v-visible.once="drawPage"
    :class="{ focused: isPageFocused }"
    class="pdf-thumbnail"
    >
    <img
      v-if="src"
      :src="src"
      class="box-shadow"
      />
    <div
      v-else
      class="placeholder box-shadow"
      >
      <div>
        Loading
      </div>
    </div>
    <span class="page-number">{{ pageNumber }}</span>
  </div>
`,
    props: {
        page: {
            type: Object, // instance of PDFPageProxy returned from pdf.getPage
            required: true,
        },
        scale: {
            required: true,
        },
        isPageFocused: {
            type: Boolean,
            default: false,
        },
    },

    data() {
        return {
            src: undefined,
        };
    },

    computed: {
        viewport() {
            return this.page.getViewport({ scale: 1.0 });
        },

        pageNumber() {
            return this.page.pageNumber;
        },
    },

    methods: {
        focusPage() {
            this.$emit('page-focus', this.pageNumber);
        },

        drawPage() {
            if (this.renderTask) return;

            const { viewport } = this;
            const canvas = document.createElement('canvas')
            const canvasContext = canvas.getContext('2d')
            const renderContext = { canvasContext, viewport };
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            this.renderTask = this.page.render(renderContext);
            this.renderTask
                .promise
                .then(() => {
                    this.src = canvas.toDataURL();

                    // Zeroing the width and height causes Firefox to release graphics
                    // resources immediately, which can greatly reduce memory consumption.
                    canvas.width = 0;
                    canvas.height = 0;
                })
                .then(() => {
                    this.$emit('thumbnail-rendered', {
                        page: this.page,
                        text: `Rendered thumbnail ${this.pageNumber}`,
                    });
                })
                .catch(response => {
                    this.destroyRenderTask();
                    this.$emit('thumbnail-errored', {
                        response,
                        page: this.page,
                        text: `Failed to render thumbnail ${this.pageNumber}`,
                    });
                });
        },

        destroyPage(_newPage, page) {
            // PDFPageProxy#_destroy
            // https://mozilla.github.io/pdf.js/api/draft/PDFPageProxy.html
            if (page) page._destroy();

            this.destroyRenderTask();
        },

        destroyRenderTask() {
            if (!this.renderTask) return;

            // RenderTask#cancel
            // https://mozilla.github.io/pdf.js/api/draft/RenderTask.html
            this.renderTask.cancel();
            delete this.renderTask;
        },

        updateVisibility() {
            this.$parent.$emit('update-visibility');
        },
    },

    watch: {
        page: 'destroyPage',
        src: 'updateVisibility',
        scale: 'updateVisibility',
    },

    mounted() {
        log(`Page ${this.pageNumber} mounted`);
    },

    beforeDestroy() {
        this.destroyPage(undefined, this.page);
    }
});



Vue.component('PDFPage', {
    template: `
    <canvas v-visible.once="drawPage" v-bind="canvasAttrs"></canvas>
`,
    props: {
        page: {
            type: Object, // instance of PDFPageProxy returned from pdf.getPage
            required: true,
        },
        scale: {
            type: Number,
            required: true,
        },
        optimalScale: {
            type: Number,
            required: true,
        },
        isPageFocused: {
            type: Boolean,
            default: false,
        },
        isElementFocused: {
            type: Boolean,
            default: false,
        },
    },

    computed: {
        actualSizeViewport() {
            return this.viewport.clone({ scale: this.scale });
        },

        canvasStyle() {
            const { width: actualSizeWidth, height: actualSizeHeight } = this.actualSizeViewport;
            const [pixelWidth, pixelHeight] = [actualSizeWidth, actualSizeHeight]
                .map(dim => Math.ceil(dim / PIXEL_RATIO));
            return `width: ${pixelWidth}px; height: ${pixelHeight}px;`;
        },

        canvasAttrs() {
            let { width, height } = this.viewport;
            [width, height] = [width, height].map(dim => Math.ceil(dim));
            const style = this.canvasStyle;

            return {
                width,
                height,
                style,
                class: 'pdf-page box-shadow',
            };
        },

        pageNumber() {
            return this.page.pageNumber;
        },
    },

    methods: {
        focusPage() {
            if (this.isPageFocused) return;

            this.$emit('page-focus', this.pageNumber);
        },

        drawPage() {
            if (this.renderTask) return;

            const { viewport } = this;
            const canvasContext = this.$el.getContext('2d');
            const renderContext = { canvasContext, viewport };

            // PDFPageProxy#render
            // https://mozilla.github.io/pdf.js/api/draft/PDFPageProxy.html
            this.renderTask = this.page.render(renderContext);
            this.renderTask
                .promise
                .then(() => {
                    this.$emit('page-rendered', {
                        page: this.page,
                        text: `Rendered page ${this.pageNumber}`,
                    });
                })
                .catch(response => {
                    this.destroyRenderTask();
                    this.$emit('page-errored', {
                        response,
                        page: this.page,
                        text: `Failed to render page ${this.pageNumber}`,
                    });
                });
        },

        updateVisibility() {
            this.$parent.$emit('update-visibility');
        },

        destroyPage(page) {
            // PDFPageProxy#_destroy
            // https://mozilla.github.io/pdf.js/api/draft/PDFPageProxy.html
            if (page) page._destroy();

            this.destroyRenderTask();
        },

        destroyRenderTask() {
            if (!this.renderTask) return;

            // RenderTask#cancel
            // https://mozilla.github.io/pdf.js/api/draft/RenderTask.html
            this.renderTask.cancel();
            delete this.renderTask;
        },
    },

    watch: {
        scale: 'updateVisibility',

        page(_newPage, oldPage) {
            this.destroyPage(oldPage);
        },

        isElementFocused(isElementFocused) {
            if (isElementFocused) this.focusPage();
        },
    },

    created() {
        // PDFPageProxy#getViewport
        // https://mozilla.github.io/pdf.js/api/draft/PDFPageProxy.html
        this.viewport = this.page.getViewport({ scale: this.optimalScale });
    },

    mounted() {
        log(`Page ${this.pageNumber} mounted`);
    },

    beforeDestroy() {
        this.destroyPage(this.page);
    }
});





Vue.component('PDFDocument', {
    template: `
    <ScrollingDocument
    class="pdf-document pdf-scroll"
    v-bind="{pages, pageCount, currentPage}"
    v-slot="{page, isPageFocused, isElementFocused}"
    :enable-page-jump="true"
    @page-jump="onPageJump"
    @pages-fetch="onPagesFetch"
    @pages-reset="fitAuto"
    >
    <PDFPage
      v-bind="{scale, optimalScale, page, isPageFocused, isElementFocused}"
      @page-rendered="onPageRendered"
      @page-errored="onPageErrored"
      @page-focus="onPageFocused"
    />
  </ScrollingDocument>
`,
    props: {
        pages: {
            required: true,
        },
        pageCount: {
            type: Number,
            default: 0,
        },
        scale: {
            type: Number,
            default: 1.0,
        },
        optimalScale: {
            type: Number,
        },
        fit: {
            type: String,
        },
        currentPage: {
            type: Number,
            default: 1,
        },
        isPreviewEnabled: {
            default: false,
        },
    },

    computed: {
        defaultViewport() {
            if (!this.pages.length) return { width: 0, height: 0 };
            const [page] = this.pages;

            return page.getViewport({ scale: 1.0 });
        },

        isPortrait() {
            const { width, height } = this.defaultViewport;
            return width <= height;
        },
    },

    methods: {
        pageWidthScale() {
            const { defaultViewport, $el } = this;
            if (!defaultViewport.width) return 0;

            return ($el.clientWidth * PIXEL_RATIO) * VIEWPORT_RATIO / defaultViewport.width;
        },

        pageHeightScale() {
            const { defaultViewport, $el } = this;
            if (!defaultViewport.height) return 0;

            return ($el.clientHeight * PIXEL_RATIO) * VIEWPORT_RATIO / defaultViewport.height;
        },
        // Determine an ideal scale using viewport of document's first page, the pixel ratio from the browser
        // and a subjective scale factor based on the screen size.
        fitWidth() {
            const scale = this.pageWidthScale();
            this.updateScale(scale, { isOptimal: !this.optimalScale });
        },

        fitHeight() {
            const scale = this.isPortrait ? this.pageHeightScale() : this.pageWidthScale();
            this.updateScale(scale);
        },

        fitAuto() {
            const scale = Math.min(this.pageWidthScale(), this.pageHeightScale());
            this.updateScale(scale);
        },

        updateScale(scale, { isOptimal = false } = {}) {
            if (!scale) return;

            if (scale < this.minScale) {
                scale = this.minScale;
            }

            this.$emit('scale-change', { scale, isOptimal });
        },

        onPageJump(scrollTop) {
            this.$el.scrollTop = scrollTop; // triggers 'scroll' event
        },

        onPagesFetch(currentPage) {
            this.$parent.$emit('pages-fetch', currentPage);
        },

        onPageFocused(pageNumber) {
            this.$parent.$emit('page-focus', pageNumber);
        },

        onPageRendered(payload) {
            this.$parent.$emit('page-rendered', payload);
        },

        onPageErrored(payload) {
            this.$parent.$emit('page-errored', payload);
        },
    },

    watch: {
        fit(fit) {
            switch (fit) {
                case 'width':
                    this.fitWidth();
                    break;

                case 'auto':
                    this.fitAuto();
                    break;

                default:
                    break;
            }
        },
        pageCount: 'fitAuto',
        isPreviewEnabled: 'fitAuto'
    }
});