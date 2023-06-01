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
            let startHour = startTime !== null ? parseInt(this.to24HourTime(startTime).split(':')[0]) : 0;
            let endHour = endTime !== null ? parseInt(this.to24HourTime(endTime).split(':')[0]) : 23;

            for (let hour = startHour; hour <= endHour; hour++) {
                this.appendToTimeSelect(hour, startHour, endHour);
            }

            this.setSelectedTimeToStartTime();
        },
        appendToTimeSelect(hour, startHour, endHour) {
            let self = this;
            let minutesSelection = ['00', '15', '30', '45'];

            if (hour === startHour && startHour !== endHour) {
                let startMinutes = this.to24HourTime(this.startTime).split(':')[1];
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
                }
            }

            if (hour === endHour && this.endTime !== null) {
                let endMinutes = this.to24HourTime(this.endTime).split(':')[1];
                minutesSelection = minutesSelection.filter(minutes => parseInt(minutes) <= parseInt(endMinutes));
            }

            minutesSelection.forEach(function (minutes) {
                let time = self.to12HourTime(hour + ':' + minutes);
                self.times.push(time);
            });
        },
        to12HourTime(twentyFourHourTime) {
            let split = twentyFourHourTime.split(':');
            let amPm = 'AM';
            let hours = parseInt(split[0]);

            if (hours > 12) {
                hours = hours - 12;
                amPm = 'PM';
            } else if (hours === 12) {
                amPm = 'PM';
            } else if (hours === 0) {
                hours = 12;
            }

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

            return hours + ':' + minutes;
        },
        setSelectedTimeToStartTime() {
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
            if (typeof this.selectedTime === 'undefined' || this.selectedTime === null || this.selectedTime === '') {
                this.selectedTime = this.times[0];
            }

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


Vue.component("blazortimepicker", {
    template: `
	<select v-bind="additionalAttributes" class="form-control" v-model="localSelectedTime">
        <option v-for="time in times" :value="time" :key="time">{{ formatTime(time) }}</option>
    </select>
`,
    props: {
        additionalAttributes: {
            type: Object,
            default: () => ({})
        },
        minimumTimeSelected: {
            type: String,
            default: null
        },
        maximumTimeSelected: {
            type: String,
            default: null
        },
        selectedTime: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            times: [],
            localSelectedTime: this.selectedTime
        };
    },
    mounted() {
        this.initializeTimes();
        this.localSelectedTime = this.selectedTime; // Set the initial value of localSelectedTime
    },
    watch: {
        localSelectedTime(newTime) {
            const roundedTime = this.roundToNearest15Minutes(this.convertTimeStringToMilliseconds(newTime));
            const clampedTime = this.clampTimeToRange(roundedTime, this.convertTimeStringToMilliseconds(this.minimumTimeSelected), this.convertTimeStringToMilliseconds(this.maximumTimeSelected));
            this.$emit('update:selectedTime', this.formatTime(clampedTime));
        },
        selectedTime(newValue) {
            this.localSelectedTime = newValue;
        }
    },
    methods: {
        initializeTimes() {
            const minTime = this.convertTimeStringToMilliseconds(this.minimumTimeSelected);
            const maxTime = this.convertTimeStringToMilliseconds(this.maximumTimeSelected);

            const startTime = Math.ceil(minTime / 900000) * 900000; // Round up to the nearest 15 minutes
            const endTime = Math.floor(maxTime / 900000) * 900000; // Round down to the nearest 15 minutes

            let time = startTime;
            while (time <= endTime) {
                this.times.push(time);
                time += 900000; // 15 minutes in milliseconds
            }
        },
        formatTime(time) {
            const date = new Date(time);
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        },
        roundToNearest15Minutes(time) {
            const minutes = time / 60000; // Convert to minutes
            const roundedMinutes = Math.round(minutes / 15) * 15;
            return roundedMinutes * 60000; // Convert back to milliseconds
        },
        clampTimeToRange(time, minTime, maxTime) {
            let clampedTime = time;
            if (minTime !== null && clampedTime < minTime) {
                clampedTime = minTime;
            }
            if (maxTime !== null && clampedTime > maxTime) {
                clampedTime = maxTime;
            }
            return clampedTime;
        },
        convertTimeStringToMilliseconds(timeString) {
            if (!timeString || typeof timeString !== 'string') {
                return null;
            }
            const [time, period] = timeString.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let milliseconds = (hours % 12) * 3600000 + minutes * 60000; // Convert hours and minutes to milliseconds

            if (period === 'PM') {
                milliseconds += 12 * 3600000; // Add 12 hours in milliseconds for PM times
            }

            return milliseconds;
        }
    }
});