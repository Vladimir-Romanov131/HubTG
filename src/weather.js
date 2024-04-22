const API_KEY = 'f95d854cd7ab45a89f4a6bef80c3971c';
const city = 'Donetsk'; 

async function getWeather(city) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка при получении данных о погоде:', error);
  }
}

async function displayWeather() {
  const weatherData = await getWeather(city);
  document.getElementById('city').textContent = weatherData.name;
  document.getElementById('temperature').textContent = weatherData.main.temp;
  document.getElementById('description').textContent = weatherData.weather[0].description;
  document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;
}

// Вызовем функцию отображения погоды при загрузке страницы
displayWeather();