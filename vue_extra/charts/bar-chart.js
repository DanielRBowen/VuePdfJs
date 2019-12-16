Vue.component("bar-chart", {
	extends: VueChartJs.Bar,
	props: ["data", "options", "labels", "label", "scales", "displayLegend"],
	mounted() {
		this.renderBarChart();
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
		renderBarChart: function () {
			this.renderChart(
				{
					labels: this.chartLabels,
					datasets: [
						{
							label: this.chartLabel,
							backgroundColor: this.getRandomColors(this.chartLabels.length),
							borderColor: "#3B2C2F",
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
		data: function () {

			if (typeof this._chart !== 'undefined') {
				this._chart.destroy(); //This seems not to be needed but was in the top anwser here: https://stackoverflow.com/questions/43728332/vue-chart-js-chart-is-not-updating-when-data-is-changing
			}

			this.renderBarChart();
		}
	}
});