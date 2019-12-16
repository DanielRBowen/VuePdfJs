Vue.component("datepicker", {
    template: `
	<input ref="datepicker" type="text" />
`,
    props: ['value'],
    data() {
        return {
            selectedDate: moment().format('MM/DD/YYYY')
        };
    },
    methods: {
        setUpDate() {
            $(this.$refs['datepicker']).datepicker({
                todayBtn: "linked",
                todayHighlight: true,
                autoclose: true,
                disableTouchKeyboard: true,
                startDate: "0d",
                orientation: "bottom auto"
            });

            $(this.$refs['datepicker']).change(() => {
                let selectedDate = $(this.$refs['datepicker']).val();
                this.selectedDate = selectedDate;
            });
        },
        datepickerUpdate(newDate) {
            $(this.$refs['datepicker']).val(newDate);
            $(this.$refs['datepicker']).datepicker('update', newDate);
        }
    },
    watch: {
        selectedDate() {
            this.$emit('input', this.selectedDate);
        }
    },
    mounted() {
        if (typeof this.value !== "undefined" && this.value !== '' && this.value !== null) {
            this.selectedDate = this.value;
            $(this.$refs['datepicker']).val(this.value);
        }

        this.setUpDate();
    }
});