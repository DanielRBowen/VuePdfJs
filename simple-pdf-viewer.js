// Needs: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.min.js"></script>
// And: <script src='https://unpkg.com/panzoom@7.1.1/dist/panzoom.min.js'></script>

Vue.component('simple-pdf-viewer', {
    props: ['pdfData'],
    template: `
<div>
	<div class="pdf-overlay" v-show="isOpen">
		<div class="pdf-overlay-text">
			<div style="margin-left:200px" class="zoomable">
				<canvas id="the-canvas"></canvas>
				<b-form>
					<b-button variant="info" v-on:click.prevent="previous"><i class="fa fa-arrow-left" aria-hidden="true"></i></b-button>
					<b-button variant="info" v-on:click.prevent="next"><i class="fa fa-arrow-right" aria-hidden="true"></i></b-button>
					&nbsp; &nbsp;
					<span><input type="text" v-on:blur.prevent="flipToPage" v-model="currentPage" v-on:keypress.enter.prevent="flipToPage" class="form-control"> / <span>{{ pageCount }}</span></span>
                    <b-button v-on:click.prevent="closeOverlay" class="close" aria-hidden="true">
                        <i class="nc-icon nc-simple-remove"></i>
                    </b-button>
				</b-form>
			</div>
		</div>
	</div>
	<b-button variant="info" v-on:click="openOverlay">
		<slot>Display PDF</slot>
	</b-button>
</div>
`,
    data() {
        return {
            currentPage: 1,
            previousPage: 1,
            pageCount: 1,
            pdfDoc: null,
            pageRendering: false,
            pageNumPending: null,
            canvas: null,
            ctx: null,
            panzoomInstance: null,
            scale: 1,
            isOpen: false
        };
    },
    computed: {
    },
    methods: {
        renderPage(num) {
            let self = this;
            self.pageRendering = true;
            // Using promise to fetch the page
            this.pdfDoc.getPage(num).then((page) => {
                let viewport = page.getViewport({ scale: self.scale });

                if (typeof self.canvas === 'undefined' || self.canvas === null) {
                    self.canvas = document.getElementById('the-canvas');
                }

                self.canvas.height = viewport.height;
                self.canvas.width = viewport.width;

                if (typeof self.ctx === 'undefined' || self.ctx === null) {
                    self.ctx = self.canvas.getContext('2d');
                }

                // Render PDF page into canvas context
                let renderContext = {
                    canvasContext: self.ctx,
                    viewport: viewport
                };

                let renderTask = page.render(renderContext);

                // Wait for rendering to finish
                renderTask.promise.then(() => {
                    self.pageRendering = false;
                    if (self.pageNumPending !== null) {
                        // New page rendering is pending
                        self.renderPage(self.pageNumPending);
                        self.pageNumPending = null;
                    }
                });
            });

            // Update page counters
            self.currentPage = num;
        },
        queueRenderPage(num) {
            if (this.pageRendering) {
                this.pageNumPending = num;
            } else {
                this.renderPage(num);
            }
        },
        next() {
            let next = this.currentPage + 1;
            if (next > this.pageCount) {
                this.currentPage = 1;
            } else {
                this.currentPage = next;
            }
        },
        previous() {
            let previous = this.currentPage - 1;
            if (previous < 1) {
                this.currentPage = this.pageCount;
            } else {
                this.currentPage = previous;
            }
        },
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
        },
        loadPdf() {
            let pdfData = atob(this.pdfData);

            if (typeof this.loadingTask !== 'undefined' || this.loadingTask === null) {
                this.loadingTask.destroy();
            }

            this.loadingTask = this.pdfjsLib.getDocument({ data: pdfData });

            this.loadingTask.promise.then((pdf) => {
                this.pdfDoc = pdf;
                this.pageCount = pdf.numPages;
                this.renderPage(this.currentPage);
            });
        },
        flipToPage() {
            // This function is here because I get an error from simply entering the currentPage into this.pdfDoc.getPage(num). It needs to be the next or previous pages or pdf.js won't like it.
            if (this.previousPage === this.currentPage || this.currentPage < 1 || this.currentPage > this.pageCount) {
                return;
            }

            let pageGoal = this.currentPage;
            let flipAhead = pageGoal > this.previousPage;

            if (flipAhead) {
                for (index = this.previousPage; index <= pageGoal; index++) {
                    this.queueRenderPage(index);
                }
            } else {
                for (index = this.previousPage; index >= pageGoal; index--) {
                    this.queueRenderPage(index);
                }
            }
        }
    },
    mounted() {
        this.pdfjsLib = window['pdfjs-dist/build/pdf'];
        this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.worker.min.js';
    },
    watch: {
        pdfData() {
            if (typeof this.pdfData === 'undefined' || this.pdfData === null) {
                return;
            } else {
                this.loadPdf();

                let area = document.querySelector('.zoomable');
                this.panzoomInstance = panzoom(area, { maxZoom: 3, minZoom: 0.8, zoomDoubleClickSpeed: 1, onTouch(e) { return false; } });
                this.panzoomInstance.on('zoom', (e) => {
                    this.scale = this.panzoomInstance.getTransform().scale;
                });

                this.openOverlay();

                //var wnd = window.open("about:blank", "");
                //wnd.document.write('<canvas id="the-canvas"></canvas> <b-form><b-button variant="info" v-on: click.prevent="previous">Previous</b-button> <b-button variant="info" v-on: click.prevent="next">Next</b-button>& nbsp; & nbsp; <span>Page: <span> {{ currentPage }}</span> / <span>{{ pageCount }}</span></span></b - form >');
                //wnd.document.body.innerHTML = "<canvas id='the - canvas'></canvas><b-form><b-button variant='info' v-on:click.prevent='previous'>Previous</b-button><b-button variant='info' v-on:click.prevent='next'>Next</b-button>&nbsp; &nbsp;<span>Page: <span> {{ currentPage }}</span> / <span>{{ pageCount }}</span></span></b-form>";
                //wnd.document.body.innerHTML = this.pdfData;
                //wnd.document.close();
            }
        },
        currentPage() {
            if (this.currentPage !== null && typeof this.currentPage !== 'undefined' && this.currentPage > 0 && this.currentPage <= this.pageCount) {
                if (this.currentPage === this.previousPage + 1 || this.currentPage === this.previousPage - 1 || (this.currentPage === this.pageCount && this.previousPage === 1) || (this.currentPage === 1 && this.previousPage === this.pageCount)) {
                    this.queueRenderPage(this.currentPage);
                    this.previousPage = this.currentPage;
                }
            }
        },
        scale() {
            this.queueRenderPage(this.currentPage);
        }
    }
});