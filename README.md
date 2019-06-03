# VuePdfJs
A Vue Pdf viewer using pdf.js for browser JavaScript.

[DEMO](https://danielrbowen.github.io/VuePdfJs/)

Ported to js and css files from [this](https://github.com/rossta/vue-pdfjs-demo).

I am using this to show reports in pdfs from a byte[] when passed up from a client to the Asp.Net server then sent to the browser using SignalR.

On the client:
```
var bytes = File.ReadAllBytes(resultingReportFileName);
File.Delete(resultingReportFileName);
return bytes;

var dataTransferObject = new DataTransferObject
{
  ConnectionId = connectionId,
  Bytes = bytes
};

await restService.PostAsync("reports/SubmitReportAsync", dataTransferObject);
```

Then on the server:
```
[HttpPost("[Action]")]
public async Task SubmitReportAsync([FromBody]DataTransferObject dataTransferObject)
{
    try
    {
        await _reportsHubContext.Clients.Client(dataTransferObject.ConnectionId).SendAsync("updatePdfReport", dataTransferObject.Bytes);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, ex.Message);
    }
}
```

Then in JS on the browser, in a vuex store:
```
state.connection.on('updatePdfReport', function (data) {
    state.pdfReport = data;
});
```

In the report vue component:
```
computed: {
        tryUpdate() {
            let newData = null;

            if (typeof store.state.pdfReport !== 'undefined') {
                newData = store.state.pdfReport;
            }

            let isThereNewData = newData !== null;

            if (isThereNewData) {
                this.pdfData = newData;
                store.commit('removeLoader', 'PullReport');
            }
        },
    },
    watch: {
        tryUpdate() {
        }
    },
```

Finally the data gets to the pdf-viewer component:
```
<pdf-viewer :pdf-data="pdfData" v-on:pull="pullReport"><b-button variant="info">Show Report</b-button></pdf-viewer>
```

Where the pullReport method will ask for a report through SignalR:
```
pullReport() {
            store.state.connection.invoke("requestreportasync", { fromDate: this.fromDate, toDate: this.toDate, UserName: store.state.currentUser });
        },
```

