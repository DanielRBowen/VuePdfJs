if (document.getElementById("demo") !== null) {
	const demo = new Vue({
		el: '#demo',
		data() {
			return {
				images: ["orange.jpg", "apple juice.jpg", "root_beer.jpg"]
			};
		},
		computed: {
		},
		watch: {
		},
		methods: {
		},
		mounted() {
            this.$refs["demo-lightbox"].show()
		}
	});
}