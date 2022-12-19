
class Utils {

    newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    btoa(text) {
        return Buffer.from(text, 'binary').toString('base64');
    }
    atoa(base64){        
        return Buffer.from(base64, 'base64').toString('binary');
    }

    base64Encode(string) 
    {
        if(!string) return '';
        const buff = Buffer.from(string, 'utf-8');
        return buff.toString('base64');
    }
    base64Decode(string) 
    {        
        if(!string) return '';
        const buff = Buffer.from(string, 'base64');
        return buff.toString('utf-8');
    }

    htmlEncode(text) {
        if(text === undefined) 
            return '';
        if(typeof(text) !== 'string')
            text = '' + text;
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&#34;").replace(/\'/g, "&#39;");
    }
        
    formatBytes(bytes) {
        if (typeof (bytes) === 'string') {
            bytes = parseFloat(bytes, 10);
        }

        if (isNaN(bytes))
            return '';

        let order = 0;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        while (bytes >= 1000 && order < sizes.length - 1) {
            ++order;
            bytes /= 1000; 
        }
        return bytes.toFixed(2) + ' ' +sizes[order];
    }

    formatTime(date, showSeconds) {
        let minute = date.getMinutes();
        if (minute < 10)
            minute = '0' + minute;
        let hour = date.getHours();
        let meridian = 'am';
        if (hour >= 12) {
            meridian = 'pm';
            hour -= hour == 12 ? 0 : 12;
        }
        if (hour == 0)
            hour = 12;

        if (showSeconds) {
            let seconds = date.getSeconds();
            if (seconds < 10)
                seconds = '0' + seconds;
            return hour + ':' + minute + ':' + seconds + ' ' + meridian;
            
        }
        return hour + ':' + minute + ' ' + meridian;
    }
	
	formatMilliTimeToWords(milliTime, showSeconds) {

		let days = Math.floor(milliTime/1000/60/60/24)
		milliTime -= days*1000*60*60*24;
		let hour = Math.floor(milliTime/1000/60/60); 
		milliTime -= hour*1000*60*60;
        let minute = Math.floor(milliTime/1000/60)
        milliTime -= minute*1000*60;
		let seconds = Math.floor(milliTime/1000);
		
		
		let returnText = '';
		
		if(hour == 1) {
			returnText = returnText + hour + " hour ";
		} else if (hour > 1 ) {
			returnText = returnText + hour + " hours ";
		}
		
		
		if(minute == 1) {
			returnText = returnText + minute + " minute ";
		} else if (minute > 1 ) {
			returnText = returnText + minute + " minutes ";
		}
		
        if (showSeconds) { 
            if(seconds == 1) {
				return returnText + seconds + " second ";
			} else if (seconds > 1 ) {
				return returnText + seconds + " seconds ";
			}
        }
        return returnText;
    }
	
    
    formatDate(date) {
        if (!date)
            return '';
        if (typeof (date) === 'string')
            date = new Date(date);
        let now = new Date();
        if (date.getTime() > (now.getTime() - (24 * 60 * 60 * 1000)))
        {
            // within last 24 hours
            if (date.getDate() == now.getDate()) {
                // today, so return time
                return this.formatTime(date);
            }
        }
        let day = date.getDate();
        let month = date.getMonth() + 1; // zero based
        let year = date.getFullYear();
        if (month < 10)
            month = '0' + month;
        if (day < 10)
            day = '0' + day;
        return year + '-' + month + '-' + day;
    }

    formatCalanderDate(date, delim) {
        if (!date)
            return '';
        if (typeof (date) === 'string')
            date = new Date(date);
        let now = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1; // zero based
        let year = date.getFullYear();
        if (month < 10)
            month = '0' + month;
        if (day < 10)
            day = '0' + day;
        return year + delim + month + delim + day;
    }
}

module.exports = Utils;
