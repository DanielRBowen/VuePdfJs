Vue.component("line-chart", {
	extends: VueChartJs.Line,
	props: {
		data: Array,
		options: Object,
		labels: Array,
		label: String,
		displayLegend: Boolean,
		scales: {
			type: Object,
			default: function () {
				return {
					xAxes: [{
						ticks: {
							autoSkip: false
						}
					}]
				};
			}
		}
	},
	mounted() {
		this.renderLineChart();
	},
	computed: {
		chartData: function () {
			return this.data;
		},
		chartLabels: function () {
			return this.labels;
		},
		chartLabel: function () {
			return this.label;
		}
	},
	methods: {
        renderLineChart: function () {
            let isIE = /*@cc_on!@*/false || !!document.documentMode;
            let isEdge = !isIE && !!window.StyleMedia;
            let chartBackground = "#51bcda55";

            if (isEdge === true) {
                chartBackground = "#baf0ff";
            }

			this.renderChart(
				{
					labels: this.chartLabels,
					datasets: [
						{
                            label: this.chartLabel,
                            backgroundColor: chartBackground,
							borderColor: "#51bcda",
							borderWidth: 4,
							data: this.chartData
						}
					]
				},
				{
					responsive: true,
					maintainAspectRatio: false,
					scales: this.scales,
					legend: {
						display: this.displayLegend
					}
				}
			);
		}
	},
	watch: {
		data: function () {

			if (typeof this._chart !== 'undefined') {
				this._chart.destroy(); //This seems not to be needed but was in the top anwser here: https://stackoverflow.com/questions/43728332/vue-chart-js-chart-is-not-updating-when-data-is-changing
			}

			this.renderLineChart();
		}
	}
});