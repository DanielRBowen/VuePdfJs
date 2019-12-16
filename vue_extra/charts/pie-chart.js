Vue.component("pie-chart", {
	extends: VueChartJs.Pie,
	props: {
		data: Array,
		options: Object,
		labels: Array,
		label: String,
		displayLegend: Boolean,
		tooltips: {
			type: Object,
			default: () => {
				return {
					enabled: true,
					label: (tooltipItem, data) => {
						let label = data.labels[tooltipItem.index];
						let val = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
						let total = data.datasets[tooltipItem.datasetIndex].data.reduce((accumulator, a) => { return accumulator + a; });
						return label + ': ' + val + ' (' + (100 * (val / total)).toFixed(2) + '%)';
					}
				};
			}
		}
	},
	mounted() {
		this.renderPieChart();
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
		renderPieChart: function () {
			this.renderChart(
				{
					labels: this.chartLabels,
					datasets: [
						{
							label: this.chartLabel,
							backgroundColor: this.getRandomColors(this.chartLabels.length),
							data: this.chartData
						}
					]
				},
				{
					responsive: true,
					maintainAspectRatio: false,
					tooltips: this.tooltips,
					legend: {
						display: this.displayLegend
					}
				}
			);
		},
		getRandomColor() {
			var letters = '0123456789ABCDEF';
			var color = '#';

			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}

			return color;
		},
		getRandomColors(length) {
			let colors = [];

			for (let colorIndex = 0; colorIndex < length; colorIndex++) {
				colors[colorIndex] = this.getRandomColor();
			}

			return colors;
		}
	},
	watch: {
		data() {

			if (typeof this._chart !== 'undefined') {
				this._chart.destroy(); //This seems not to be needed but was in the top anwser here: https://stackoverflow.com/questions/43728332/vue-chart-js-chart-is-not-updating-when-data-is-changing
			}

			this.renderPieChart();
		}
	}
});