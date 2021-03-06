//This is the functions that starts on load of the website
//I.1) Display distance
//I.2) Setting up for Submit-button
window.onload = function() {
    //I.1) Display distance: This function ensures that there are numbers displayed for the distance between user and colleagues
    for (var i = 0; i <= 300; i += 10) {
        var distance = i
        var option = document.createElement("option");
        var dropdown_ele = document.createTextNode(distance)
        option.value = distance
        option.appendChild(dropdown_ele)
        document.getElementById("distancecolleague").appendChild(option);
    }


    //I.2) This function sets up the Submit-button eventlistener that reacts either on a mouseclick or a stroke of the enter key.
    search_button.addEventListener("click", doSearch);
    search_button.addEventListener("click", displayresults);
    window.addEventListener("keydown", function(e) {
        if (e.keyCode == "13") {
            console.log("wow");
            e.preventDefault();
            doSearch()
            displayresults()
        }
    });
}

//II.1) This function initiates the display of the results
function displayresults() {
    document.getElementById("listofresults").className = "outputAfter"

}

//II.2 a) This function takes the input given by the user:
//name of the city, age and distance to closest colleagues at work.
var doSearch = function() {
    var age = document.getElementById("age").value;
    //based on the age group the minimum loss of productivity is estimated(days)
    var agerisk = 0
    if (age == "0to4" || age == "65plus") {
        agerisk = 1;
    } else {
        agerisk = 0.5
    }
    //based on the age group the likelihood of getting the flu is estimated
    //the colourcode blue, yellow, red is used for increasing risk with red being the highest level
    if (age == "0to4") {
        changeColourred3();
    } else if (age == "5to17" || age == "65plus") {
        changeColouryellow3();
    } else {
        changeColourblue3();
    }

    //Here the value of the distance to the next colleague is stored in a variable
    var distancecolleague = document.getElementById("distancecolleague").value;
    console.log(distancecolleague);
    //Here the input for the city in which the user lives is assigned to a variable
    var search_term = document.getElementById("search_term").value;
    console.log(search_term);

    //This block sends the search_term to the Google Maps API to get the lng, lat coordinates
    //and the shortcode of the country in which the city is located
    var searchxhttp = new XMLHttpRequest();
    searchxhttp.addEventListener("load", function() {
        var response = JSON.parse(this.response);
        //As the number of keys varies but the shortcode is always stored in the last key of the object,
        //we ask specifically for this last key
        //http://stackoverflow.com/questions/21076732/how-to-get-the-last-item-in-a-javascript-value-object-with-a-for-loop
        var keys = Object.keys(response.results[0].address_components);
        var last = keys[keys.length - 1];
        if (response.results[0].address_components[last].types != "postal_code") {
            var shortcode = response.results[0].address_components[last].short_name;
        } else {
            var shortcode = response.results[0].address_components[keys[keys.length - 2]].short_name;
        }
        var lat = response.results["0"].geometry.location.lat
        var lng = response.results["0"].geometry.location.lng
        console.log(lng)
        console.log(lat)
        console.log(shortcode)
        console.log(search_term)

        //III. This initiates three different functions for each of the three main functionalities

        //III.1) This function calculates the financial loss based on the avg wage in the country according to the OECD and
        // the earlier calculated age based risk of lost productivity in days
        OECDwagerisk(shortcode, agerisk)

        //III.2) This function will calculate the risk of getting the flu based on the given city
        //as there is a correlation between flu outbreaks and unexpectedly low humidity, this function
        //compares humidity values from the three previous years with the current humidity
        HistoricalDates(lng, lat, search_term)

        //III.3)This function is used to calculate the risk of getting the flu based on the distance between user and his nearest colleague
        distancerisk(distancecolleague)
    });
    var MAPSurl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + search_term + "&key=AIzaSyD43HRHWXPXsuUbuERoG3pkZwtP0N0O92Q&language=en"
    console.log(MAPSurl);
    searchxhttp.open("GET", MAPSurl);
    searchxhttp.send();
}

//II. 2b) These functions change now the "traffic light" dot on the webpage
//according to the colour code for the flurisk based on the age

function changeColourred3() {
    document.getElementById("agelight").className = "trafficlightred";
}

function changeColouryellow3() {
    document.getElementById("agelight").className = "trafficlightyellow";
}

function changeColourblue3() {
    document.getElementById("agelight").className = "trafficlightblue";
}


//III.1 a) Calculating the lost amount of productivity based on OECD average wage and agerisk
function OECDwagerisk(shortcode, agerisk) {
    //This converts the country shortcode into its longcode because otherwise the OECD cannot
    //give the value of the average wage
    var xhttpOECDwagerisk = new XMLHttpRequest();
    xhttpOECDwagerisk.addEventListener("load", function() {
        var responseOECDwagerisk = JSON.parse(this.response);
        console.log(responseOECDwagerisk);
        var countrylongcode = responseOECDwagerisk["0"].alpha3Code;
        //The country"s longcode is passed to the next function that asks for the average wage
        searchOECDcountry(countrylongcode, agerisk);
    });
    var OECDwageriskURL = "https://restcountries.eu/rest/v1/alpha?codes=" + shortcode
    console.log(OECDwageriskURL);
    xhttpOECDwagerisk.open("GET", OECDwageriskURL);
    xhttpOECDwagerisk.send();
}

//III.1 b) This function sends the request that should give  the AVG wage;
function searchOECDcountry(countrylongcode, agerisk) {
    var xhttp2 = new XMLHttpRequest();
    xhttp2.addEventListener("load", function() {
        var response2 = JSON.parse(this.response);
        console.log(response2);
        var size = console.log(Object.keys(response2.dataSets[0]))
        //Here again we ask for the last key in order to get the average wafe
        //http://stackoverflow.com/questions/21076732/how-to-get-the-last-item-in-a-javascript-value-object-with-a-for-loop
        var keys = Object.keys(response2.dataSets[0].observations);
        var last = keys[keys.length - 1];
        //Here we assign the average wage to a variable, divide it by 365 days
        //multiply it with the age-based number of lost days in productivity and
        //then, lastly, round to two decimals after the dot
        var avgrawwage = (response2.dataSets["0"].observations[last]["0"] / 365) * agerisk
        var avgwage = Math.round(avgrawwage).toFixed(2)
        document.getElementById("result3").innerHTML = avgwage+" Dollars"
    });
    var url2 = "https://stats.oecd.org/SDMX-JSON/data/AV_AN_WAGE/" + countrylongcode + ".CPNCU+CNPNCU+USDPPP+USDEX/all?startTime=2000&endTime=2015&dimensionAtObservation=allDimensions&pid=48a42b9a-ef88-4ae2-8f01-27622f456dcd"
    console.log(url2);
    xhttp2.open("GET", url2);
    xhttp2.send();
    console.log("Wow!")
}

//III.2 a) This function uses the lng, lat to retrieve humidity data about
// the last three years and also keeps the search_term(cityname) to search for the
//current humidity data. But firstly it has to define what is the current date.
function HistoricalDates(lng, lat, search_term) {
    console.log("This retrieves the current and historical data")
    console.log(lng, lat, search_term)
    currenttime(lng, lat, search_term)
    //This function is used to find out the current date and time for a given
    //pair of lng and lat. This is done with this timezone API
    function currenttime(lng, lat, search_term) {
        var xhttpcurrenttimeconvert = new XMLHttpRequest();
        xhttpcurrenttimeconvert.addEventListener(
            "load",
            function() {
                var Responsecurrenttime = JSON.parse(this.response);
                var currtime = Responsecurrenttime.time.replace(/-/g, "");
                currtime = parseInt(currtime.split(" ")[0], 10)
                console.log(currtime + " " + lat + " " + lng);
                //Here the last three years are calculated by substracting one year
                //from the current date
                var year_0 = currtime
                var year_1 = currtime - 10000
                var year_2 = currtime - 20000
                var year_3 = currtime - 30000
                console.log(year_1)
                console.log(year_2)
                console.log(year_3)
                //Now, the information about the dates as well as lng, lat and search_term
                //are passed on to the next function III.2b)
                HistoricalWeather(lat, lng, year_0, year_1, year_2, year_3, search_term)
            })
        //This is the actual timezone API call.
        var currenttimeconvertURL = "https://api.geonames.org/timezoneJSON?lat=" + lat + "&lng=" + lng + "&username=haluka"
        console.log(currenttimeconvertURL);
        xhttpcurrenttimeconvert.open("GET", currenttimeconvertURL);
        xhttpcurrenttimeconvert.send();

    }
}

//III.2b) This function can now look for the humidity data in the past three years.
//As each call has to be done separately, this works as kind of a cascade of functions.
//First, the humidity data is retrieved for one year. Then the whole set of variables
//including the new variable for the humidity in this year is passed on to the next function.
//Probably, a recursive function would have been more efficient but was not used this time,
//because of sheer pragmatism.
function HistoricalWeather(lat, lnt, year_0, year_1, year_2, year_3, search_term) {
    console.log(lat, lnt, year_0, year_1, year_2, year_3, search_term)
    console.log("This should load the weather");
    var xhttp1 = new XMLHttpRequest();
    xhttp1.addEventListener("load", function() {
        //Here the humidity data is stored in variable Histhum1 and then passed on to the next function.
        var HistoricalWeatherresponse = JSON.parse(this.response);
        var index1 = parseInt(String(this.response).indexOf("hum")) + 6
        var index2 = parseInt(String(this.response).indexOf("hum")) + 7
        var index3 = parseInt(String(this.response).indexOf("hum")) + 8
        if (String(this.response)[index3] == 0){var Histhum1 = parseInt(String(this.response)[index1] + String(this.response)[index2] + String(this.response)[index3])
        }else{
        var Histhum1 = parseInt(String(this.response)[index1] + String(this.response)[index2])
        }
        console.log(Histhum1);

        HistoricalWeather2(lat, lnt, year_0, year_1, year_2, year_3, search_term, Histhum1)

    });
    //This is the call of the API for historical weather data with lng, lat and the date
    var urlweather = "https://api.wunderground.com/api/76aa53af8c201071/history_" + year_1 + "/q/" + lat + "," + lnt + ".json"
    console.log(urlweather);
    xhttp1.open("GET", urlweather);
    xhttp1.send();
}

//Same thing happens here again just for year_2
function HistoricalWeather2(lat, lnt, year_0, year_1, year_2, year_3, search_term, Histhum1) {
    console.log(lat, lnt, year_0, year_1, year_2, year_3, search_term, Histhum1)
    console.log("This should load the weather2");
    var xhttp2 = new XMLHttpRequest();
    xhttp2.addEventListener("load", function() {
      var index1 = parseInt(String(this.response).indexOf("hum")) + 6
      var index2 = parseInt(String(this.response).indexOf("hum")) + 7
      var index3 = parseInt(String(this.response).indexOf("hum")) + 8
      if (String(this.response)[index3] == 0){var Histhum2 = parseInt(String(this.response)[index1] + String(this.response)[index2] + String(this.response)[index3])
      }else{
      var Histhum2 = parseInt(String(this.response)[index1] + String(this.response)[index2])
      }console.log(Histhum1, Histhum2);
        HistoricalWeather3(lat, lnt, year_0, year_1, year_2, year_3, search_term, Histhum1, Histhum2)
    });
    var urlweather = "https://api.wunderground.com/api/76aa53af8c201071/history_" + year_2 + "/q/" + lat + "," + lnt + ".json"
    console.log(urlweather);
    xhttp2.open("GET", urlweather);
    xhttp2.send();
}

//Same thing happens here again just for year_3
function HistoricalWeather3(lat, lnt, year_0, year_1, year_2, year_3, search_term, Histhum1, Histhum2) {
    console.log(lat, lnt, year_0, year_1, year_2, year_3, search_term, Histhum1, Histhum2)
    console.log("This should load the weather2");
    var xhttp2 = new XMLHttpRequest();
    xhttp2.addEventListener("load", function() {
        var HistoricalWeatherresponse = JSON.parse(this.response);
        var index1 = parseInt(String(this.response).indexOf("hum")) + 6
        var index2 = parseInt(String(this.response).indexOf("hum")) + 7
        var index3 = parseInt(String(this.response).indexOf("hum")) + 8
        if (String(this.response)[index3] == 0){var Histhum3 = parseInt(String(this.response)[index1] + String(this.response)[index2] + String(this.response)[index3])
        }else{
        var Histhum3 = parseInt(String(this.response)[index1] + String(this.response)[index2])
        }console.log(search_term, Histhum1, Histhum2, Histhum3);
        //Now, the three humidity values are used to calculate an average
        var avgHistHum = (Histhum1 + Histhum2 + Histhum3) / 3
        console.log(avgHistHum)
        //This average for the humidity is now passed on to another function together
        //with the search_term to compare current and past humidity. This is function III.2c)
        HistoricalWeather_final(lat, lnt, year_0, avgHistHum)
    });
    var urlweather = "https://api.wunderground.com/api/76aa53af8c201071/history_" + year_3 + "/q/" + lat + "," + lnt + ".json"
    console.log(urlweather);
    xhttp2.open("GET", urlweather);
    xhttp2.send();
}

//Same thing happens here again just for year_0
function HistoricalWeather_final(lat, lnt, year_0, avgHistHum) {
    console.log(lat, lnt, year_0, avgHistHum)
    console.log("This should load the weather0");
    var xhttp2 = new XMLHttpRequest();
    xhttp2.addEventListener("load", function() {
        var CurrentWeatherresponse = JSON.parse(this.response);
        console.log(CurrentWeatherresponse)
        var index1 = parseInt(String(this.response).indexOf("hum")) + 6
        var index2 = parseInt(String(this.response).indexOf("hum")) + 7
        var index3 = parseInt(String(this.response).indexOf("hum")) + 8
        if (String(this.response)[index3] == 0){var humidity = parseInt(String(this.response)[index1] + String(this.response)[index2] + String(this.response)[index3])
        }else{
        var humidity = parseInt(String(this.response)[index1] + String(this.response)[index2])
        }
        console.log(humidity)
        var index4 = parseInt(String(this.response).indexOf("tempm")) + 8
        var index5 = parseInt(String(this.response).indexOf("tempm")) + 9
        var index6 = parseInt(String(this.response).indexOf("tempm")) + 10
        var index7 = parseInt(String(this.response).indexOf("tempm")) + 11
        console.log(index1, index2, index3)
        console.log(index4, index5, index6, index7)
        if (String(this.response)[index6] == "."){var temperature = (parseInt((String(this.response)[index4] + String(this.response)[index5] + String(this.response)[index7])))
        }else{
        var temperature = ((parseInt((String(this.response)[index4]) + (String(this.response)[index6]))))/10
        }
        console.log(humidity, temperature, avgHistHum);
        absolutehum(humidity, temperature, avgHistHum)
    });
    var urlweather = "https://api.wunderground.com/api/76aa53af8c201071/history_" + year_0 + "/q/" + lat + "," + lnt + ".json"
    console.log(urlweather);
    xhttp2.open("GET", urlweather);
    xhttp2.send();
}
///III.2c.) Comparing the historical and current humidity values.
//First, this function retrieves data about the current humidity and temperature.


function absolutehum(rh, Temp, avgHistHum) {
  //These function now convert the relative humidity into absolute humidity
  //Please note that there is a small mistake in this function as the current Temperature is
  //also used as the reference for the historical average humidity data
    var ah = (6.112 * Math.exp((17.67 * Temp) / (Temp + 243.5)) * rh * 2.1674) / (273.15 + Temp)
    var nh = (6.112 * Math.exp((17.67 * Temp) / (Temp + 243.5)) * avgHistHum * 2.1674) / (273.15 + Temp)
    var dh = (6.112 * Math.exp((17.67 * Temp) / (Temp + 243.5)) * 1 * 2.1674) / (273.15 + Temp)
    //This ratio finally tells us how exceptionally low the humidity of today is compared to the humidity of the last years.
    var ratio = (ah / dh - nh / dh)
    console.log("this is the ratio between past and current humidity values " + ratio)
    ///III.2.d) Finally converting this ratio into a risk value for the user.
    flurisk(ratio)
}

//III.2.d) Converting ratio into colour code
//This function converts the ratio into the colourcode. The threshold values 1.5
//and 4 are taken from a study
function flurisk(ratio) {
    var flurisknum = Math.exp(-180 * ratio / 1000 + 0.5) + 0.8
    console.log(flurisknum)
    if (flurisknum < 1.5) {
        changeColourblue();
    } else if (flurisknum < 4) {
        changeColouryellow();
    } else {
        changeColourred();
    }
    finalresults()
}


//III.2.e)These functions change now the "traffic light" dot on the webpage
//according to the colour code for the flurisk based on the city
function changeColourred() {
    document.getElementById("locallight").className = "trafficlightred";
}

function changeColouryellow() {
    document.getElementById("locallight").className = "trafficlightyellow";
}

function changeColourblue() {
    document.getElementById("locallight").className = "trafficlightblue";
}


//III.3 a)This function is used to calculate the risk of getting the flu based on the distance between user and his nearest colleague

function distancerisk(distancecolleague) {
    console.log(distancecolleague);
    //I use a quadratic approach as probably the risk of getting the flu is more about the space
    //rather than just about the sheer distance
    var riskdist = 1 - ((distancecolleague * distancecolleague) / 90000)
    console.log(riskdist)
    if (riskdist < 0.3) {
        changeColourblue2();
    } else if (riskdist < 0.6) {
        changeColouryellow2();
    } else {
        changeColourred2();
    }
}


//III.3.b)These functions change now the "traffic light" dot on the webpage
//according to the colour code for the flurisk based on the distance to the colleague

function changeColourred2() {
    document.getElementById("distancelight").className = "trafficlightred";
}

function changeColouryellow2() {
    document.getElementById("distancelight").className = "trafficlightyellow";
}

function changeColourblue2() {
    document.getElementById("distancelight").className = "trafficlightblue";
}

//IV. These functions calculate the overall result by looking at the earlier results for each parameter (age, working environment, city)
function finalresults(){
  var overallresult = 0
  var  distanceresult= document.getElementById("distancelight").className;
  if (distanceresult== "trafficlightred"){
    overallresult += 2
  } else if (distanceresult == "trafficlightyellow") {
    overallresult += 1
  }
  console.log(overallresult);
  var  ageresult = document.getElementById("agelight").className;
  if (ageresult== "trafficlightred"){
    overallresult += 2
  } else if (ageresult == "trafficlightyellow") {
    overallresult += 1
  }
  console.log(overallresult);
  var  localresult = document.getElementById("locallight").className;
  if (localresult== "trafficlightred"){
    overallresult += 2
  } else if (localresult == "trafficlightyellow") {
    overallresult += 1
  }
  console.log(overallresult);
  if (overallresult>3){endresultred()}
  else if(overallresult>1){endresultyellow()}
  else {endresultblue()}

}

//V. These functions display the final results depending on the calculation above

function endresultred(){
  document.getElementById("finalresultsgrey").className = "finalresultshidden";
  document.getElementById("finalresultsred").className = "finalresultsshown";
  document.getElementById("finalresultsyellow").className = "finalresultshidden";
  document.getElementById("finalresultsblue").className = "finalresultshidden";
}

function endresultyellow(){
  document.getElementById("finalresultsgrey").className = "finalresultshidden";
  document.getElementById("finalresultsred").className = "finalresultshidden";
  document.getElementById("finalresultsyellow").className = "finalresultsshown";
  document.getElementById("finalresultsblue").className = "finalresultshidden";

}

function endresultblue(){
  document.getElementById("finalresultsgrey").className = "finalresultshidden";
  document.getElementById("finalresultsred").className = "finalresultshidden";
  document.getElementById("finalresultsyellow").className = "finalresultshidden";
  document.getElementById("finalresultsblue").className = "finalresultsshown";
}

//VI. When the user clicks on the menu button,
//it toggles between hiding and showing the dropdown content
//Code taken from http://www.w3schools.com/howto/howto_js_dropdown.asp
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches(".dropbtn")) {

        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
            }
        }
    }
}
