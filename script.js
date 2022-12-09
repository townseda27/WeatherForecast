/*
Author: Daniel Townsend
*/

const startTomTomURL = "https://api.tomtom.com/search/2/search/";
const endTomTomURL = ".json?minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=all&key=...";
const baseWeatherURL = "https://api.openweathermap.org/data/2.5/forecast?";
const weatherKey = "...";

const weekdayArr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let weatherData = [];

$(document).ready(function() {
	displayDays(new Date());
        $("#searchBtn").on("click", function() {
		searchStr = $("#searchBox").val();
		if(searchStr == "") return;

		$("#summaryCol").css("display", "block");
		$(".cardContainer").css("display", "block");
		$(".searchBar").removeClass("offset-lg-3");

                $.ajax({
	        		url: startTomTomURL + encodeURIComponent(searchStr) + endTomTomURL,
	                method: 'GET'
	        }).done(function(location) {
			const lat = location.results[0].position.lat;
			const lon = location.results[0].position.lon;
			$.ajax({
				url: baseWeatherURL,
				method: 'GET',
				data: {lat: lat, lon: lon, units: "imperial", appid: weatherKey}
			}).done(function(weather) {
				weather.list = convertDates(weather.list);
				displayWeather(weather);
			}).fail(function(error) {
				console.log(error);
			});
	        }).fail(function(error) {
			console.log(error);
	        });
        });

	$("#searchDateBtn").on("click", function() {
		$("table").css("display", "table");
		$("tbody").html("");
		$("#historyWeatherDiv").css("display", "none");
		fetchHistory($("#searchDateBox").val(), $("#maxRows").val());
	});

});

function displayDays(startDate) {
	let dayOfWeek = weekdayArr[startDate.getDay()];
	let month = monthArr[startDate.getMonth()];
	let day = startDate.getDate();

	$("#day").text(dayOfWeek + ", " + month + " " + day);
	$(".card-group .card-header").each(function(index) {
		dayOfWeek = weekdayArr[startDate.getDay()];
		month = monthArr[startDate.getMonth()];
		day = startDate.getDate();
		$(this).text(dayOfWeek + ", " + month + " " + day);
		startDate.setDate(startDate.getDate() + 1);
	});
}

function displayWeather(data) {
	$("#summary .card-header").text("Today's weather in " + data.city.name);
	$("#summary .card-body").text();

	let startDateStr = data.list[0].dt_txt.split(" ")[0];
	let startDate = new Date(startDateStr.split("-")[0], startDateStr.split("-")[1] - 1, startDateStr.split("-")[2]);
	displayDays(new Date(startDate));
	$(".card-group .card-body").each(function(index) {
		startDateStr = getDateStr(startDate);
		let timeStr = (index == 0)? "":"13:00:00";

		const forecast = getDataFromList(data.list, startDateStr, timeStr);
		const low = Math.round(forecast.main.temp_min);
                const high = Math.round(forecast.main.temp_max);
                const desc = capitilizeFirstChar(forecast.weather[0].description);
                const visibility = Math.round(metersToMiles(forecast.visibility));
                const humidity = forecast.main.humidity;
                const imgSrc = "http://openweathermap.org/img/wn/" + forecast.weather[0].icon.replace("n", "d") + "@2x.png";

		if(index == 0) {
			$("#summary .card-body").text(desc + " with a high of " + high + "°F" + " and a low of " + low + "°F" + ". ");
			if(high < 45) {
				$("#summary .card-body").text($("#summary .card-body").text() + "Wear a coat.");
			}
		}

		$(this).html(generateHTMLForCard(forecast));
		startDate.setDate(startDate.getDate() + 1);
	});
}

function getDataFromList(list, dateStr, timeStr) {
	for(let i = 0; i < list.length; i++) {
		const listItem = list[i];
		if(listItem.dt_txt.includes(dateStr) && listItem.dt_txt.includes(timeStr)) {
			return listItem;
		}
	}
	return null;
}

function getDateStr(date) {
	return date.getFullYear() + "-" + appendZero((date.getMonth() + 1)) + "-" + appendZero(date.getDate());
}

function getDateTimeStr(date) {
	return date.getFullYear() + "-" + appendZero(date.getMonth() + 1) + "-" + appendZero(date.getDate()) + " " + appendZero(date.getHours()) + ":" + appendZero(date.getMinutes()) + ":" + appendZero(date.getSeconds());
}

function UTCtoEST(baseStr) {
	let baseStrArr = baseStr.split(" ");
	let dayStrArr = baseStrArr[0].split("-");
	let timeStrArr = baseStrArr[1].split(":");

	let date = new Date(dayStrArr[0], (dayStrArr[1] - 1), dayStrArr[2], timeStrArr[0], timeStrArr[1], timeStrArr[2]);
	date.setHours(date.getHours() - 5);
	return getDateTimeStr(date);
}

function convertDates(list) {
	for(let i = 0; i < list.length; i++) {
		list[i].dt_txt = UTCtoEST(list[i].dt_txt);
	}
	return list;
}

function appendZero(num) {
	if (num < 10) {
		num = "0" + num;
	}
	return num;
}

function capitilizeFirstChar(str) {
	let firstChar = str[0].toUpperCase();
	str = str.slice(1, str.length);
	str = firstChar + str;
	return str;
}

function metersToMiles(meters) {
	return meters * 0.0006213712;
}

function generateHTMLForCard(forecast) {
	const low = Math.round(forecast.main.temp_min);
        const high = Math.round(forecast.main.temp_max);
        const desc = capitilizeFirstChar(forecast.weather[0].description);
        const visibility = Math.round(metersToMiles(forecast.visibility));
        const humidity = forecast.main.humidity;
        const imgSrc = "http://openweathermap.org/img/wn/" + forecast.weather[0].icon.replace("n", "d") + "@2x.png";

	return '<div class="container">'
		+ '<div class="row">'
		+ '<div class="col-lg">'
		+ 'L: ' + low + "°F"
		+ '</div>'
		+ '<div class="col-lg">'
		+ 'H: ' + high + "°F"
		+ '</div>'
		+ '</div>'
		+ '<div class="row">'
		+ '<div class="col">'
		+ desc
		+ '</div>'
		+ '</div>'
		+ '<div class="row">'
		+ '<div class="col">'
		+ "Visibility: " + visibility + "mi"
		+ '</div>'
		+ '<div class="row">'
		+ '<div class="col">'
		+ "Humidity: " + humidity + "%"
		+ '</div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="row text-center">'
		+ '<div class="col">'
		+ '<img src="' + imgSrc + '">'
		+ '</div>'
		+ '</div>'
}
