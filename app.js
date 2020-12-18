var staticUrl = "https://corona-api.com/countries"; //live api with updates to database
var tempHashTable = {};
var sortByDeaths = {};
var top10Deaths = [];
var sortByConfirmed = {};
var top10Confirmed = {};
var top10Recovered = {};
var top8Recovered = [];
let top8Confirmed = [];
var totalConfirmedCasesNum = 0;
var todayTopConfirmedCases = [];
var todayTopDeathsCases = [];
var todayTop3Confirmed = [];
var todayTop3Deaths = [];


var countiesNameConfirmedDeaths = [];
var countiesCoordsWithEverything = [];
var countiesWithConfirmedAndCoords = [];

$.getJSON(staticUrl, function (data) { //show the database in the console
  console.log(data);
});

//copying everything from .csv file into the hashtable for country name and latitude/longitude because the current api data
//does not contain all the latitudes and longitudes for all the countries
jQuery.ajax({
  url: "/CountriesLatLon.csv",
  type: 'get',
  dataType: 'text',
  success: function (data) {
    let lines = data.split('\n');
    let fields = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      let current = lines[i].split(',');
      tempHashTable[current[3]] = [current[1], current[2]];
    }
  },
  error: function (jqXHR, textStatus, errorThrow) {
    console.log(textStatus);
  }
});

console.log(tempHashTable); //show the hashtable in the console

jQuery.ajax({
  url: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
  type: 'get',
  dataType: 'text',
  success: function (data) {
    let lines = data.split('\n');
    let tempArrayForCounties = [];

    for (let i = 1; i < lines.length; i++) {
      let current = lines[i].split(',');
      tempArrayForCounties[current[1]] = [current[4], current[5]];
    }

    for (var keys in tempArrayForCounties) {
      if (countiesNameConfirmedDeaths[keys] == undefined) {
        countiesNameConfirmedDeaths[keys] = tempArrayForCounties[keys];
      } else {
        countiesNameConfirmedDeaths[keys][0] += tempArrayForCounties[keys][0];
        countiesNameConfirmedDeaths[keys][1] += tempArrayForCounties[keys][1];
      }
    }
  },
  error: function (jqXHR, textStatus, errorThrow) {
    console.log(textStatus);
  }
});


jQuery.ajax({
  url: "/CountiesInfo.csv",
  type: 'get',
  dataType: 'text',
  success: function (data) {
    let lines = data.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let current = lines[i].split(',');
      countiesCoordsWithEverything[current[0]] = [current[2], current[1]];
    }
  },
  error: function (jqXHR, textStatus, errorThrow) {
    console.log(textStatus);
  }
});

//initializing echarts for map and points
var dom = document.getElementById('main');
var chart = echarts.init(dom);
let coordinatesData = []; //array to push to echarts to point to location with dots

//async function to take the data in the hashtable, and match it with the api/database to get each countries
//lat and long and the data within each country, and push them into coordinatesData for the echart to process
//the function also works with all the data and generates all the charts
async function getLat() {
  const response = await fetch(staticUrl);
  const d = await response.json();

  for (let i = 0; i < d.data.length; i++) {
    confirmedCases = d.data[i].latest_data.confirmed;
    deaths = d.data[i].latest_data.deaths;
    todayTopConfirmed = d.data[i].today.confirmed;
    todayTopDeaths = d.data[i].today.deaths;
    if (tempHashTable.hasOwnProperty(d.data[i].name + "\r")) {
      let tempLong = tempHashTable[d.data[i].name + "\r"][1];
      let tempLat = tempHashTable[d.data[i].name + "\r"][0];
      coordinatesData.push([tempLong, tempLat, confirmedCases]); //this is to get the coordinate data for the map
      sortByConfirmed[d.data[i].name] = confirmedCases; //adding values into total sort confirmed array
      sortByDeaths[d.data[i].name] = deaths; //adding values into total sort deaths array
      totalConfirmedCasesNum += confirmedCases; //adding all cases to get total confirmed cases
      todayTopConfirmedCases[d.data[i].name] = todayTopConfirmed; //adding values into today confirmed array
      todayTopDeathsCases[d.data[i].name] = todayTopDeathsCases; //adding values into today deaths array
    }
  }

  chart.setOption({ //setting options for the echart map/leaflet and the coordinate dots
    series: [{
      type: "scatter",
      coordinateSystem: "leaflet",
      data: coordinatesData,
      symbolSize: function (value) {
        return value[2] > 0 ? Math.log(value[2]) : 0;
      },
      itemStyle: {
        color: "red",
      }
    }],
    visualMap: {
      type: "continuous",
      textStyle: { color: '#FFFFFF' },
      min: 0,
      max: 25000,
      inRange: {
        color: ["yellow", "red"],
        opacity: [0.6, 0.9],
      }
    },
    leaflet: {
      center: [0, 40],
      roam: true,
      tiles: [{
        urlTemplate:
          "https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png",
      }]
    }
  });

  function quickSortArray(array) { //quick sorts out a list of values from the associative array in order
    counter = 0;
    for (var key in array) {
      if (array.hasOwnProperty(key)) counter++;
    }
    if (counter < 2) return array;

    var pivot = 0;
    var tempStoreKey = "";
    for (var key in array) {
      pivot = array[key];
      tempStoreKey = key;
      break;
    }

    var lesserArray = [];
    var greaterArray = [];

    delete array[tempStoreKey];

    for (var key in array) {
      if (array[key] > pivot) {
        greaterArray.push(array[key]);
      } else {
        lesserArray.push(array[key]);
      }
    }

    return quickSortArray(lesserArray) + " " + pivot + " " + quickSortArray(greaterArray);
  }

  //This part below is all for the top total deaths per country donut chart 

  var dom1 = document.getElementById('donut');
  var chart1 = echarts.init(dom1);

  //splits it by " " to put in an array and then removes all the "" values because some used to contain two spaces
  let tempSortByDeaths = quickSortArray(sortByDeaths).split(" ");
  let tempSortByDeaths2 = tempSortByDeaths.filter(function (e) { return e != "" });

  //takes the sorted tempSortByDeaths2 array and pulls out the top 10 countries with the most deaths
  var keysForDeaths = Object.keys(tempSortByDeaths2);
  for (var k = keysForDeaths.length - 1; k > keysForDeaths.length - 11; k--) {
    for (var key in sortByDeaths) {
      if (sortByDeaths[key] == tempSortByDeaths2[keysForDeaths[k]]) {
        top10Deaths.push({ value: tempSortByDeaths2[keysForDeaths[k]], name: key });
      }
    }
  }
  console.log(top10Deaths);

  chart1.setOption({ //generating the donut chart for top 10 countries with the most deaths and include top10Deaths data
    tooltip: {
      trigger: 'item',
      formatter: '{c} deceased'
    },
    series: [{
      type: 'pie',
      radius: ['60%', '80%'],
      avoidLabelOverlap: false,
      color: ['#F15854', '#FAA43A', '#B276B2', '#B2912F', '#F17CB0', '#DECF3F', '#60BD68', '#0000FF', '#5DA5DA', '#FFF'],
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '19',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: top10Deaths
    }]

  })

  //This part below is all for the bar chart for top 8 countries with the most confirmed cases with recovered cases

  //splits it by " " to put in an array and then removes all the "" values because some used to contain two spaces
  let tempSortByConfirmed = quickSortArray(sortByConfirmed).split(" ");
  let tempSortByConfirmed2 = tempSortByConfirmed.filter(function (e) { return e != "" });

  //Takes the sorted tempSortByConfirmed2 array and pulls out the top 10 countries with the most confirmed cases
  //and the reason it's 10 and not 8 is because 10 is needed for the left side of the dashboard
  var keysForConfirmed = Object.keys(tempSortByConfirmed2);
  for (var k = keysForConfirmed.length - 1; k > keysForConfirmed.length - 11; k--) {
    for (var key in sortByConfirmed) {
      if (sortByConfirmed[key] == tempSortByConfirmed2[keysForConfirmed[k]]) {
        top10Confirmed[key] = tempSortByConfirmed2[keysForConfirmed[k]];
      }
    }
  }
  console.log(top10Confirmed);

  //Because I grabbed the top 10 countries with the most confirmed cases, I grab the corresponding recoveries with those countries
  for (var keys in top10Confirmed) {
    for (let j = 0; j < d.data.length; j++) {
      if (keys == d.data[j].name) {
        top10Recovered[keys] = d.data[j].latest_data.recovered;
      }
    }
  }
  console.log(top10Recovered);

  //I push the top 5 countries with the most confirmed cases (with recoveries) and push them into their respective arrays
  var actualKeysForConfirmed = Object.keys(top10Confirmed);
  for (let i = 0; i < 5; i++) {
    top8Confirmed.push(top10Confirmed[actualKeysForConfirmed[i]]);
    for (let keys in top10Recovered) {
      if (actualKeysForConfirmed[i] == keys) {
        top8Recovered.push(top10Recovered[keys]);
      }
    }
  }

  //I split the array for the keys (country name) from length 10 to length 5 as well for the bar graph
  var half = Math.ceil(actualKeysForConfirmed.length / 2);
  var firstHalfActualKeysForConfirmed = actualKeysForConfirmed.splice(0, half);

  console.log(top8Confirmed);
  console.log(top8Recovered);

  var dom2 = document.getElementById('barChart');
  var chart2 = echarts.init(dom2);

  chart2.setOption({ //This creates the bar graph with the top 5 countries with the most confirmed cases with recoveries
    color: ['#00FF00', '#FF0000'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { show: false },
        data: firstHalfActualKeysForConfirmed,
        axisLabel: {
          textStyle: {
            color: 'white'
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          textStyle: {
            color: 'white'
          }
        }
      }
    ],
    series: [
      {
        name: 'Recovered',
        type: 'bar',
        barGap: 0,
        data: top8Recovered
      },
      {
        name: 'Confirmed',
        type: 'bar',
        data: top8Confirmed
      }
    ]
  })

  //This part below is all for the bar graph with today's top 3 countries with the newest most confirmed cases and deaths

  //splits it by " " to put in an array and then removes all the "" values because some used to contain two spaces
  let tempSortByTodayConfirmed = quickSortArray(todayTopConfirmedCases).split(" ");
  let tempSortByTodayConfirmed2 = tempSortByTodayConfirmed.filter(function (e) { return e != "" });
  var keysForTodayConfirmed = Object.keys(tempSortByTodayConfirmed2);
  var listOfCountriesForToday = []; //IMPORTANT FOR BAR GRAPH KEYS (country names)

  //Takes the sorted tempSortByTodayConfirmed2 array and pulls out (and pushes) the top 3 countries with the most (newest) confirmed cases today
  for (var k = keysForTodayConfirmed.length - 1; k > keysForTodayConfirmed.length - 4; k--) {
    for (var key in todayTopConfirmedCases) {
      if (todayTopConfirmedCases[key] == tempSortByTodayConfirmed2[keysForTodayConfirmed[k]]) {
        listOfCountriesForToday.push(key);
        todayTop3Confirmed.push(tempSortByTodayConfirmed2[keysForTodayConfirmed[k]]);
      }
    }
  }
  console.log(todayTop3Confirmed);

  //Because I grabbed the top 3 countries with the most (newest) confirmed cases, I grab and push the corresponding deaths
  for (let i = 0; i < listOfCountriesForToday.length; i++) {
    for (let j = 0; j < d.data.length; j++) {
      if (listOfCountriesForToday[i] == d.data[j].name) {
        todayTop3Deaths.push(d.data[j].today.deaths);
      }
    }
  }
  console.log(todayTop3Deaths);

  var dom3 = document.getElementById('barChartForToday');
  var chart3 = echarts.init(dom3);

  chart3.setOption({ //Creates the bar graph with the top 3 countries with the most newest confirmed cases and their correspoinding deaths
    color: ['#FFFF00', '#FF0000'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { show: false },
        data: listOfCountriesForToday,
        axisLabel: {
          textStyle: {
            color: 'white'
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          textStyle: {
            color: 'white'
          }
        }
      }
    ],
    series: [
      {
        name: 'Deaths',
        type: 'bar',
        barGap: 0,
        data: todayTop3Deaths
      },
      {
        name: 'Confirmed',
        type: 'bar',
        data: todayTop3Confirmed
      }
    ]
  })

  //grabbing the top 10 confirmed values one by one and storing them individually in the html file
  var testarray = Object.keys(top10Confirmed);
  document.getElementById("firstCKey").innerHTML = testarray[0] + ":";
  document.getElementById("firstCValue").innerHTML = parseInt(top10Confirmed[testarray[0]]).toLocaleString();

  document.getElementById("secondCKey").innerHTML = testarray[1] + ":";
  document.getElementById("secondCValue").innerHTML = parseInt(top10Confirmed[testarray[1]]).toLocaleString();

  document.getElementById("thirdCKey").innerHTML = testarray[2] + ":";
  document.getElementById("thirdCValue").innerHTML = parseInt(top10Confirmed[testarray[2]]).toLocaleString();

  document.getElementById("fourthCKey").innerHTML = testarray[3] + ":";
  document.getElementById("fourthCValue").innerHTML = parseInt(top10Confirmed[testarray[3]]).toLocaleString();

  document.getElementById("fifthCKey").innerHTML = testarray[4] + ":";
  document.getElementById("fifthCValue").innerHTML = parseInt(top10Confirmed[testarray[4]]).toLocaleString();

  document.getElementById("sixthCKey").innerHTML = testarray[5] + ":";
  document.getElementById("sixthCValue").innerHTML = parseInt(top10Confirmed[testarray[5]]).toLocaleString();

  document.getElementById("seventhCKey").innerHTML = testarray[6] + ":";
  document.getElementById("seventhCValue").innerHTML = parseInt(top10Confirmed[testarray[6]]).toLocaleString();

  document.getElementById("eighthCKey").innerHTML = testarray[7] + ":";
  document.getElementById("eighthCValue").innerHTML = parseInt(top10Confirmed[testarray[7]]).toLocaleString();

  document.getElementById("ninthCKey").innerHTML = testarray[8] + ":";
  document.getElementById("ninthCValue").innerHTML = parseInt(top10Confirmed[testarray[8]]).toLocaleString();

  document.getElementById("tenthCKey").innerHTML = testarray[9] + ":";
  document.getElementById("tenthCValue").innerHTML = parseInt(top10Confirmed[testarray[9]]).toLocaleString();

  //grabbing the total cases in all the countries and putting them in the html
  document.getElementById("totalval").innerHTML = totalConfirmedCasesNum.toLocaleString();


  for (var keys in countiesNameConfirmedDeaths) {
    if (countiesCoordsWithEverything.hasOwnProperty(keys)) {
      countiesWithConfirmedAndCoords[keys] = [countiesNameConfirmedDeaths[0], countiesCoordsWithEverything[0], countiesCoordsWithEverything[1]];
    }
  }

  var temp1111 = Object.keys(countiesNameConfirmedDeaths);
  var temp2222 = Object.keys(countiesCoordsWithEverything);
  
  console.log(temp1111[0] == temp2222[0])
  console.log(temp1111);
  console.log(temp2222[3]);

  console.log(countiesNameConfirmedDeaths["Abbeville"]);



  console.log(countiesNameConfirmedDeaths);
  console.log(countiesCoordsWithEverything);
  console.log(countiesWithConfirmedAndCoords);

}

getLat(); //calls getLat to run the program in which getLat() contains everything on the website







