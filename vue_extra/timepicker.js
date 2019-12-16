Vue.component("timepicker", {
    template: `
	<select v-model="selectedTime" class="form-control">
		<option v-for="time in times" :value="time">{{ time }}</option>
	</select>
`,
    props: ['value', 'startTime', 'endTime'],
    data() {
        return {
            selectedTime: '00:00 AM',
            isSelecting: false,
            times: []
        };
    },
    methods: {
        toggleSelection() {
            this.isSelecting = !this.isSelecting;
        },
        createTimes(startTime = null, endTime = null) {
            this.times = [];
            if (startTime !== null && endTime !== null) {
                let startTime24 = this.to24HourTime(startTime);
                let endTime24 = this.to24HourTime(endTime);
                this.appendToTimeSelectLoop(parseInt(startTime24.split(':')[0]), parseInt(endTime24.split(':')[0]), startTime24.split(':')[1], endTime24.split(':')[1]);
            } else {
                this.appendToTimeSelectLoop(0, 23);
            }

            this.setSelectedTimeToStartTime();
        },
        appendToTimeSelectLoop(startHour, endHour, startMinutes = null, endMinutes = null) {
            if (endHour <= startHour) {
                for (var lateHour = startHour; lateHour <= 23; lateHour++) {
                    this.appendToTimeSelect(lateHour, startHour, endHour, endMinutes, startMinutes);
                }
                for (var earlyHour = 0; earlyHour <= endHour; earlyHour++) {
                    this.appendToTimeSelect(earlyHour, startHour, endHour, endMinutes, startMinutes);
                }
            } else {
                for (var hour = startHour; hour <= endHour; hour++) {
                    this.appendToTimeSelect(hour, startHour, endHour, endMinutes, startMinutes);
                }
            }
        },
        appendToTimeSelect(hour, startHour, endHour, endMinutes, startMinutes) {
            let self = this;
            let minutesSelection = [];
            if (hour === startHour && startMinutes !== null) {
                switch (startMinutes) {
                    case '15':
                        minutesSelection = ['15', '30', '45'];
                        break;
                    case '30':
                        minutesSelection = ['30', '45'];
                        break;
                    case '45':
                        minutesSelection = ['45'];
                        break;
                    default:
                        minutesSelection = ['00', '15', '30', '45'];
                        break;
                }
            } else {
                minutesSelection = ['00', '15', '30', '45'];
            }

            minutesSelection.forEach(function (minutes) {
                if (endMinutes !== null && hour === endHour && endMinutes < minutes) {
                    return;
                }

                let time = self.to12HourTime(hour + ':' + minutes);
                self.times.push(time);

            });
        },
        to12HourTime(twentyFourHourTime) {
            let split = twentyFourHourTime.split(':');
            let amPm = 'AM';
            let hours = split[0];
            hours = parseInt(hours);

            if (hours > 12) {
                hours = hours - 12;
                amPm = 'PM';
            } else if (hours === 12) {
                amPm = 'PM';
            } else if (hours === 0) {
                hours = 12;
            }

            //if (hours < 10) {
            //    hours = '0' + hours;
            //}

            let minutes = split[1].substring(0, 2);

            if (minutes !== '00' && minutes < 10) {
                minutes = '0' + minutes;
            }

            return hours + ':' + minutes + ' ' + amPm;
        },
        to24HourTime(twelveHourTime) {
            if (twelveHourTime.length < 8) {
                twelveHourTime = '0' + twelveHourTime;
            }

            let hours = twelveHourTime.split(':')[0];
            let minutes = twelveHourTime.split(':')[1].substring(0, 2);
            let amPm = twelveHourTime.split(' ')[1].substring(0, 2);

            hours = parseInt(hours);

            if (hours === 12 && amPm === 'AM') {
                hours = 0;
            } else if (hours === 12 && amPm === 'PM') {
                hours = 12;
            } else if (amPm === 'PM') {
                hours = hours + 12;
            }

            //if (hours < 10) {
            //    hours = '0' + hours;
            //}

            return hours + ':' + minutes;
        },
        setSelectedTimeToStartTime() {
            //if (this.startTime.length === 7) {
            //    this.selectedTime = "0" + this.startTime;
            //} else {
            //    this.selectedTime = this.startTime;
            //}
            this.selectedTime = this.startTime;
        },
        setSelectedTimeToNearestMinuteSelection() {
            if (typeof this.selectedTime === 'undefined') {
                return;
            }

            let hoursString = this.selectedTime.split(':')[0];
            let minutesString = this.selectedTime.split(':')[1].substring(0, 2);
            let amPmString = this.selectedTime.split(' ')[1].substring(0, 2);
            let minutes = parseInt(minutesString);

            if (minutes <= 0) {
                minutes = 0;
            } else if (minutes <= 15) {
                minutes = 15;
            } else if (minutes <= 30) {
                minutes = 30;
            } else if (minutes <= 45) {
                minutes = 45;
            } else if (minutes > 45) {
                minutes = 0;
                hoursString = parseInt(hoursString) + 1;
            }

            let newMinutesString = minutesString;

            if (minutes < 10) {
                newMinutesString = '0' + minutes;
            } else {
                newMinutesString = minutes;
            }

            this.selectedTime = hoursString + ':' + newMinutesString + ' ' + amPmString;
        }
    },
    watch: {
        selectedTime() {
            if (typeof this.selectedTime === 'undefined' || this.selectedTime === null) {
                this.selectedTime = this.times[0];
            }

            //if (typeof this.selectedTime !== 'undefined' && this.selectedTime.length === 7) {
            //    this.selectedTime = "0" + this.selectedTime;
            //}

            this.setSelectedTimeToNearestMinuteSelection();

            if (!this.times.includes(this.selectedTime)) {
                this.selectedTime = this.times[0];
            }

            this.$emit('input', this.selectedTime);
        },
        value() {
            if (this.selectedTime !== this.value) {
                this.selectedTime = this.value;
            }
        },
        startTime() {
            this.createTimes(this.startTime, this.endTime);
        }
    },
    beforeMount() {
        if (this.startTime !== null) {
            this.createTimes(this.startTime, this.endTime);
        }
    },
    mounted() {
        if (typeof this.value !== "undefined" && this.value !== '' && this.value !== null) {
            this.selectedTime = this.value;
        }
    }
});