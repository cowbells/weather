import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import './index.css';
import '../node_modules/font-awesome/css/font-awesome.min.css'; 

const num_of_days = 5;
const weatherImageUrl = 'http://openweathermap.org/img/w/';
const weatherUrl = 'http://api.openweathermap.org/data/2.5/weather?q=';
const weatherForecast = 'http://api.openweathermap.org/data/2.5/forecast?q=';
const weatherAppToken = '&appid=bb6ac3453c97e811431aa7c519e53310&mode=json&units=Imperial';
const empty = '';

function capitalCase(text) {
  return text.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

class MainComponent extends React.Component {
  render() {
    const data = this.props.data;
    const isEmpty = data.temperature === empty;
    const temperature = isEmpty? empty : data.temperature + '\xB0';
    const humidity = data.humidity ? data.humidity + '% Humidity' : data.humidity;
    const tempScale = isEmpty ? empty : 'F';
    const description = capitalCase(data.description);

    return (
      <div className='main-container'>
        <div className='main-container-left'>
          <label className='main-container-temperature'>{temperature}</label>
        </div>
        <div className='main-container-right'>
          <label className='main-container-farenheit'>{tempScale}</label>
          <br/>
          <label className='main-container-desc'>{description}</label>
          <br/>
          <label className='main-container-desc'>{humidity}</label>
        </div>
      </div>
    );
  }
}

class DayComponent extends React.Component {
  render() {
    const data = this.props.data;
    const options = { month: 'short', day: 'numeric' };
    const updatedDate = data.date ? new Date(data.date).toLocaleDateString('en-US', options) : empty;
    const imageSrc = data.imageCode ? `${weatherImageUrl}${data.imageCode}.png`: empty;
    return (
      <div className='col'>
        <label className='day-container-date'>{updatedDate}</label><br/>
        {/* Adding an empty alt tag since we don't want any text appearing initially when there is no image */}
        <img className='day-container-image' src={imageSrc} alt={empty}/><br/>
        <label className='day-container-max-temp'><strong>{data.max}</strong></label><br/>
        <label className='day-container-min-temp'>{data.min}</label><br/>
        
      </div>
    );
  }
}

class WeatherContainer extends React.Component {
  constructor(props) {
    super(props);
    this.emptyState = {
      future: Array(num_of_days).fill({min: empty, max: empty, date: empty, imageCode: empty}),
      present: {temperature: empty, humidity: empty, description: empty},
    };
    this.state = this.emptyState;
  }

  updateState(data) {
    this.setState({
      present: {temperature: data.main.temp, humidity: data.main.humidity, description: data.weather[0].description},
    });
  }

  getForecastDetails(data, start, end) {
    let min = data[start].main.temp_min;
    let max = data[start].main.temp_max;

    for (let i = start; i < end ; ++i) {
      min = data[i].main.temp_min < min ? data[i].main.temp_min : min;
      max = data[i].main.temp_max > max ? data[i].main.temp_max : max;
    }
    return {
      min,
      max,
      date: data[start].dt_txt,
      imageCode: data[start].weather[0].icon,
    }
  }

  updateForecast(data) {
    // The data contains weather details for every 3 hours
    // That makes 8 objects for 1 day. We get the max and min from these values and show them
    this.setState({
      future: [
        this.getForecastDetails(data.list, 0, data.list.length - 32),
        this.getForecastDetails(data.list, data.list.length - 32, data.list.length - 24),
        this.getForecastDetails(data.list, data.list.length - 24, data.list.length - 16),
        this.getForecastDetails(data.list, data.list.length - 16, data.list.length - 8),
        this.getForecastDetails(data.list, data.list.length - 8, data.list.length),
      ],
    });
  }

  clearSearch() {
    $('.weather-container-input').val(empty);
    this.setState(this.emptyState);
    $('.weather-container-input').focus();
  }

  citySearch(event) {
    // Making the ajax call only on 'Enter' key
    if(event.keyCode === 13) {
      const value = $('.weather-container-input').val();
      const fetchTodaysWeatherUrl = `${weatherUrl}${value}${weatherAppToken}`;
      const fetchForecastUrl = `${weatherForecast}${value}${weatherAppToken}`;

      // First making the call to get today's details
      $.ajax({
        url: fetchTodaysWeatherUrl,
      })
      .then((data) => {
        this.updateState(data);
        // Second making the call to get the details for the next few days
        $.ajax({
          url: fetchForecastUrl,
        })
        .done((data) => {
          this.updateForecast(data);
        });
      });
    }

  }

  render() {
    const days = this.state.future;
    const today = this.state.present;
    const searchFunction = this.citySearch.bind(this);
    const clearFunction = this.clearSearch.bind(this);
    let dayItems = [];
    for (let i = 0; i < num_of_days; ++i) {
      dayItems.push(<div key={i}>
        <DayComponent data={days[i]}/>
      </div>);
    }

    return (
      <div className = 'weather-container'>
        <div className='searchCity'>
          <i class="fa fa-search" aria-hidden="true"/>
          <input autoFocus type = 'text' className = 'weather-container-input' onKeyUp = {searchFunction} placeHolder='Enter a city'/>
          <i class="fa fa-times" aria-hidden="true" onClick = {clearFunction}/> 
        </div>
        <div className = 'weather-main'>
          <MainComponent data={today}/>
        </div>
        <div className = 'weather-list'>
          <div>{dayItems}</div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <WeatherContainer />,
  document.getElementById('weatherContainer')
);