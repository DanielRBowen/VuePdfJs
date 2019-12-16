// application/pdf
// https://stackoverflow.com/questions/2937465/what-is-correct-content-type-for-excel-files
Vue.component('download-button', {
    props: {
        payload: {
            type: String,
            default: ''
        },
        filename: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
    },
    template: `
			<a v-on:click="download">
				<slot></slot>
			</a>
			`,
    data() {
        return {
            downloadOnChange: false
        };
    },
    methods: {
        download() {
            let payload = this.payload;
            let filename = this.filename;

            if (typeof payload === 'undefined' || payload === null || payload === '') {
                this.$emit('download');
                this.downloadOnChange = true;
                return;
            }

            const createBlob = data => {

                // base64 string
                var base64str = payload;

                // decode base64 string, remove space for IE compatibility
                var binary = atob(base64str.replace(/\s/g, ''));
                var len = binary.length;
                var buffer = new ArrayBuffer(len);
                var view = new Uint8Array(buffer);
                for (var i = 0; i < len; i++) {
                    view[i] = binary.charCodeAt(i);
                }

                // create the blob object with content-type             
                var blob = new Blob([view], { type: this.type });
                var url = URL.createObjectURL(blob);
                return blob;
            };

            const buildDownloadLink = (blob, fileName) => {
                let link = document.createElement("a");
                link.setAttribute("href", URL.createObjectURL(blob));
                link.setAttribute("download", fileName);
                link.style = "visibility:hidden";
                return link;
            };

            const invokeDownload = link => {
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const isHtmlDownloadAllowed = document.createElement("a").download !== undefined;
            const isSaveBlobAllowed = navigator.msSaveBlob;

            isSaveBlobAllowed ? navigator.msSaveBlob(createBlob(payload), filename) :
                isHtmlDownloadAllowed ? invokeDownload(buildDownloadLink(createBlob(payload), filename)) :
                    console.log("Feature unsupported");
        }
    },
    watch: {
        payload() {
            if (this.downloadOnChange === true && typeof this.payload !== 'undefined' && this.payload !== null) {
                this.downloadOnChange === false;
                this.download();
            }
        }
    }
});