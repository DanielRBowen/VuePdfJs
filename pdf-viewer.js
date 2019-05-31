// Needs: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.min.js"></script>
// And: <script src='https://unpkg.com/panzoom@7.1.1/dist/panzoom.min.js'></script>

Vue.component('pdf-viewer', {
    props: ['pdfData'],
    template: `
<div>
    <div class="pdf-overlay" v-show="isOpen">
        <div class="pdf-overlay-text">
            <vue-pdfjs :bytes="pdfData" v-on:close="closeOverlay" style="width:100vw; height:100vh;">
            <template v-slot:header>
                 <b-button v-on:click.prevent="closeOverlay" class="close" aria-hidden="true">
                    <i class="nc-icon nc-simple-remove"></i>
                </b-button>
            </template>
            </vue-pdfjs>
        </div>
    </div>
    <b-button variant="info" v-on:click="openOverlay">
        <slot>Display PDF</slot>
    </b-button>
</div>
`,
    data() {
        return {
            isOpen: false,
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