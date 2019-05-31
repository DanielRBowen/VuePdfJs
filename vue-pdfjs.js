
/*
// https://github.com/DanielRBowen/VuePdfJs
// Original source from: https://github.com/rossta/vue-pdfjs-demo

    <div id="app">
        <vue-pdfjs :bytes="bytes"></vue-pdfjs>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.min.js"></script>
    <script src="https://unpkg.com/vue"></script>
*/
// Needs: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.min.js"></script>
// Needs: <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js"></script>

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
            isOpen: false
        };
    },
    methods: {
        openOverlay() {
            if (typeof this.pdfData === 'undefined' || this.pdfData === null) {
                this.$emit('pull');
                return;
            }
            this.isOpen = true;
            $('.sidebar .sidebar-wrapper, .main-panel').perfectScrollbar('destroy');
        },
        closeOverlay() {
            this.isOpen = false;
            $('.sidebar .sidebar-wrapper, .main-panel').perfectScrollbar();
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
    <header class="pdf-viewer__header box-shadow">
    <div class="pdf-preview-toggle">
        <a @click.prevent.stop="togglePreview" class="icon"><PreviewIcon /></a>
    </div>

    <PDFZoom
        :scale="scale"
        @change="updateScale"
        @fit="updateFit"
        class="header-item"
        />

    <PDFPaginator
        v-model="currentPage"
        :pageCount="pageCount"
        class="header-item"
        />

    <a @click.prevent.stop="close" class="icon">
        <CloseIcon  />
    </a>

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
        v-bind="{pages, scale, optimalScale, fit, currentPage, pageCount, isPreviewEnabled}"
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
            optimalScale: 2.0,
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


Vue.component('ZoomInIcon', {
    template: `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><path d="M93.2,84.8L70.6,62.3c4.3-6,6.8-13.3,6.8-21.2C77.4,21,61.2,4.8,41.1,4.8C21,4.8,4.8,21,4.8,41.1S21,77.4,41.1,77.4   c7.8,0,15.1-2.5,21-6.7l22.6,22.6c2,2,5.4,2,7.4,0l1.1-1.1C95.2,90.2,95.2,86.9,93.2,84.8z M41.1,66.6c-14.1,0-25.5-11.4-25.5-25.5   S27,15.6,41.1,15.6c14.1,0,25.5,11.4,25.5,25.5S55.2,66.6,41.1,66.6z"></path><path d="M53.1,36.5h-7.6v-7.6c0-2.5-2-4.5-4.5-4.5s-4.5,2-4.5,4.5v7.6H29c-2.5,0-4.5,2-4.5,4.5s2,4.5,4.5,4.5h7.6v7.6   c0,2.5,2,4.5,4.5,4.5s4.5-2,4.5-4.5v-7.6h7.6c2.5,0,4.5-2,4.5-4.5S55.6,36.5,53.1,36.5z"></path></g></svg>
    `
});

Vue.component('ZoomOutIcon', {
    template: `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><path d="M93.2,84.8L70.6,62.3c4.3-6,6.8-13.3,6.8-21.2C77.4,21,61.2,4.8,41.1,4.8C21,4.8,4.8,21,4.8,41.1S21,77.4,41.1,77.4   c7.8,0,15.1-2.5,21-6.7l22.6,22.6c2,2,5.4,2,7.4,0l1.1-1.1C95.2,90.2,95.2,86.9,93.2,84.8z M41.1,66.6c-14.1,0-25.5-11.4-25.5-25.5   S27,15.6,41.1,15.6c14.1,0,25.5,11.4,25.5,25.5S55.2,66.6,41.1,66.6z"></path><path d="M29,36.5c-2.5,0-4.5,2-4.5,4.5s2,4.5,4.5,4.5h24.2c2.5,0,4.5-2,4.5-4.5s-2-4.5-4.5-4.5H29z"></path></g></svg>
    `
});

Vue.component('ExpandIcon', {
    template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" enable-background="new 0 0 16 16" x="0px" y="0px"><g><path d="M6 16h-6v-6h2v4h4zM16 6h-2v-4h-4v-2h6zM1 16c-.256 0-.512-.098-.707-.293-.391-.391-.391-1.023 0-1.414l5-5c.391-.391 1.023-.391 1.414 0s.391 1.023 0 1.414l-5 5c-.195.195-.451.293-.707.293zM10 7c-.256 0-.512-.098-.707-.293-.391-.391-.391-1.023 0-1.414l5-5c.391-.391 1.023-.391 1.414 0s.391 1.023 0 1.414l-5 5c-.195.195-.451.293-.707.293z"></path></g></svg>
    `
});

Vue.component('ShrinkIcon', {
    template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" enable-background="new 0 0 16 16" x="0px" y="0px"><g><path d="M15 7h-6v-6h2v4h4zM7 15h-2v-4h-4v-2h6zM10 7c-.256 0-.512-.098-.707-.293-.391-.391-.391-1.023 0-1.414l5-5c.391-.391 1.023-.391 1.414 0s.391 1.023 0 1.414l-5 5c-.195.195-.451.293-.707.293zM1 16c-.256 0-.512-.098-.707-.293-.391-.391-.391-1.023 0-1.414l5-5c.391-.391 1.023-.391 1.414 0s.391 1.023 0 1.414l-5 5c-.195.195-.451.293-.707.293z"></path></g></svg>
    `
});


Vue.component('PreviewIcon', {
    template: `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><g><path d="M31,14H13c-0.552,0-1-0.448-1-1s0.448-1,1-1h18c0.553,0,1,0.448,1,1S31.553,14,31,14z"></path><path d="M31,17H13c-0.552,0-1-0.448-1-1s0.448-1,1-1h18c0.553,0,1,0.448,1,1S31.553,17,31,17z"></path><path d="M26,20H13c-0.552,0-1-0.447-1-1s0.448-1,1-1h13c0.553,0,1,0.447,1,1S26.553,20,26,20z"></path><path d="M31,25H13c-0.552,0-1-0.447-1-1s0.448-1,1-1h18c0.553,0,1,0.447,1,1S31.553,25,31,25z"></path><path d="M31,28H13c-0.552,0-1-0.447-1-1s0.448-1,1-1h18c0.553,0,1,0.447,1,1S31.553,28,31,28z"></path><path d="M17,31h-4c-0.552,0-1-0.447-1-1s0.448-1,1-1h4c0.553,0,1,0.447,1,1S17.553,31,17,31z"></path><path d="M31,3H13c-0.552,0-1-0.448-1-1s0.448-1,1-1h18c0.553,0,1,0.448,1,1S31.553,3,31,3z"></path><path d="M31,6H13c-0.552,0-1-0.448-1-1s0.448-1,1-1h18c0.553,0,1,0.448,1,1S31.553,6,31,6z"></path><path d="M22,9h-9c-0.552,0-1-0.448-1-1s0.448-1,1-1h9c0.553,0,1,0.448,1,1S22.553,9,22,9z"></path><path d="M7.504,10H2.496C1.12,10,0,8.88,0,7.504V2.496C0,1.12,1.12,0,2.496,0h5.008C8.88,0,10,1.12,10,2.496v5.008   C10,8.88,8.88,10,7.504,10z M2.496,2C2.223,2,2,2.223,2,2.496v5.008C2,7.777,2.223,8,2.496,8h5.008C7.777,8,8,7.777,8,7.504V2.496   C8,2.223,7.777,2,7.504,2H2.496z"></path><path d="M7.504,21H2.496C1.12,21,0,19.88,0,18.504v-5.008C0,12.12,1.12,11,2.496,11h5.008C8.88,11,10,12.12,10,13.496v5.008   C10,19.88,8.88,21,7.504,21z M2.496,13C2.223,13,2,13.223,2,13.496v5.008C2,18.777,2.223,19,2.496,19h5.008   C7.777,19,8,18.777,8,18.504v-5.008C8,13.223,7.777,13,7.504,13H2.496z"></path><path d="M7.504,32H2.496C1.12,32,0,30.88,0,29.504v-5.008C0,23.12,1.12,22,2.496,22h5.008C8.88,22,10,23.12,10,24.496v5.008   C10,30.88,8.88,32,7.504,32z M2.496,24C2.223,24,2,24.223,2,24.496v5.008C2,29.777,2.223,30,2.496,30h5.008   C7.777,30,8,29.777,8,29.504v-5.008C8,24.223,7.777,24,7.504,24H2.496z"></path></g></svg>
    `
});


Vue.component('CloseIcon', {
    template: `
    <!--<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
        <path d="M1.41 0l-1.41 1.41.72.72 1.78 1.81-1.78 1.78-.72.69 1.41 1.44.72-.72 1.81-1.81 1.78 1.81.69.72 1.44-1.44-.72-.69-1.81-1.78 1.81-1.81.72-.72-1.44-1.41-.69.72-1.78 1.78-1.81-1.78-.72-.72z" />
    </svg>-->

    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
     width="16.000000pt" height="16.000000pt" viewBox="0 0 16.000000 16.000000"
     preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0.000000,16.000000) scale(0.100000,-0.100000)"
    fill="#000000" stroke="none">
    <path d="M0 153 c0 -4 14 -22 32 -40 l32 -33 -34 -35 c-44 -45 -30 -59 15 -15
    l35 34 35 -34 c45 -44 59 -30 15 15 l-34 35 34 35 c44 45 30 59 -15 15 l-35
    -34 -33 32 c-32 31 -47 39 -47 25z"/>
    </g>
    </svg>
    `
});


Vue.component('PDFZoom', {
    template: `
    <div class="pdf-zoom">
        <a @click.prevent.stop="zoomIn" class="icon" :disabled="isDisabled"><ZoomInIcon /></a>
        <a @click.prevent.stop="zoomOut" class="icon" :disabled="isDisabled"><ZoomOutIcon /></a>
        <a @click.prevent.stop="fitWidth" class="icon" :disabled="isDisabled"><ExpandIcon /></a>
        <a @click.prevent.stop="fitAuto" class="icon" :disabled="isDisabled"><ShrinkIcon /></a>
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
    <div class="pdf-paginator">
        <template v-if="pageCount">
        <input
            :value="value"
            @input="input"
            min="1"
            :max="pageCount"
            type="number"
            /> / <span>{{ pageCount }}</span>
        </template>
    <input v-else type="number" />
  </div>
`,
    props: {
        value: Number,
        pageCount: Number,
    },
    methods: {
        input(event) {
            this.$emit('input', parseInt(event.target.value, 10));
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
    class="pdf-preview"
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
      <div class="content">
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
    class="pdf-document"
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
        isPreviewEnabled: 'fitAuto',
    }
});